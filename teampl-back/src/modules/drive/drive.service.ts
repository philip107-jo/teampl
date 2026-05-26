import { prisma } from '../../prisma'; // Prisma client connection
import { uploadToKTCloud, deleteFromKTCloud, s3Client, BUCKET } from './ktcloud.storage';
import AdmZip from 'adm-zip';
import { GetObjectCommand } from '@aws-sdk/client-s3';

export const DriveService = {
  // 프로젝트 드라이브 조회
  getDriveContents: async (projectId: number) => {
    const folders = await prisma.driveFolder.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
      include: {
        creator: {
          select: { name: true }
        }
      }
    });

    const files = await prisma.driveFile.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
      include: {
        uploader: {
          select: { name: true }
        }
      }
    });

    return { folders, files };
  },

  createFolder: async (projectId: number, name: string, creatorEmail: string) => {
    return await prisma.driveFolder.create({
      data: {
        projectId,
        name,
        theme: 'blue',
        creatorEmail
      },
      include: {
        creator: {
          select: { name: true }
        }
      }
    });
  },

  /**
   * KT Cloud에 파일을 업로드하고 DB에 기록합니다.
   */
  uploadFile: async (
    projectId: number,
    uploaderEmail: string,
    file: Express.Multer.File,
    folderId?: number | null
  ) => {
    // 원본 이름 한글 인코딩 복원
    const originalName = Buffer.from(file.originalname, 'latin1').toString('utf8');

    // KT Cloud 오브젝트 키: projects/{projectId}/{타임스탬프}_{파일명}
    const safeFileName = originalName.replace(/[^a-zA-Z0-9가-힣.\-_]/g, '_');
    const key = `projects/${projectId}/${Date.now()}_${safeFileName}`;

    // KT Cloud에 업로드
    const publicUrl = await uploadToKTCloud(key, file.buffer, file.mimetype);

    // DB에 기록
    return await prisma.driveFile.create({
      data: {
        projectId,
        name: key,              // KT Cloud 오브젝트 키
        originalName,           // 원본 파일명
        type: file.mimetype,
        size: file.size,
        url: publicUrl,         // KT Cloud 공개 URL
        uploaderEmail,
        folderId: folderId ?? null,
      },
      include: {
        uploader: { select: { name: true } }
      }
    });
  },

  /**
   * KT Cloud와 DB에서 파일을 삭제합니다.
   */
  deleteFile: async (fileId: number, requesterEmail?: string) => {
    const file = await prisma.driveFile.findUnique({ where: { id: fileId } });
    if (!file) return false;

    // KT Cloud에서 삭제 (key = name 필드에 저장된 오브젝트 키)
    try {
      await deleteFromKTCloud(file.name);
    } catch (err) {
      console.error('[KT Cloud] 파일 삭제 실패 (계속 진행):', err);
    }

    await prisma.driveFile.delete({ where: { id: fileId } });
    return true;
  },

  /**
   * 파일을 특정 폴더로 이동하거나 폴더 밖(미분류)으로 이동합니다.
   */
  moveFile: async (fileId: number, folderId: number | null) => {
    return await prisma.driveFile.update({
      where: { id: fileId },
      data: { folderId }
    });
  },

  /**
   * 폴더와 폴더 안의 모든 파일을 KT Cloud와 DB에서 삭제합니다.
   */
  deleteFolder: async (projectId: number, folderId: number, requesterEmail: string) => {
    const folder = await prisma.driveFolder.findFirst({
      where: { id: folderId, projectId }
    });
    if (!folder) return false;

    // 본인이 생성한 폴더만 삭제 권한 부여 (기존 생성자가 없는 폴더는 삭제 허용)
    if (folder.creatorEmail && folder.creatorEmail !== requesterEmail) {
      throw new Error('폴더를 삭제할 권한이 없습니다.');
    }

    // 폴더 내부의 모든 파일 조회
    const files = await prisma.driveFile.findMany({
      where: { folderId }
    });

    // 파일들을 KT Cloud 및 DB에서 삭제
    for (const file of files) {
      try {
        await deleteFromKTCloud(file.name);
      } catch (err) {
        console.error('[KT Cloud] 파일 삭제 실패 (계속 진행):', err);
      }
      await prisma.driveFile.delete({ where: { id: file.id } });
    }

    // 폴더 자체 삭제
    await prisma.driveFolder.delete({
      where: { id: folderId }
    });
    return true;
  },

  /**
   * 여러 개의 파일을 하나의 ZIP 파일로 만들어 버퍼를 반환합니다.
   */
  downloadZip: async (projectId: number, fileIds: number[]) => {
    const files = await prisma.driveFile.findMany({
      where: {
        id: { in: fileIds },
        projectId
      }
    });

    if (files.length === 0) {
      throw new Error('다운로드할 파일이 없습니다.');
    }

    const zip = new AdmZip();
    const usedNames = new Set<string>();

    const getUniqueName = (originalName: string) => {
      let name = originalName;
      let counter = 1;
      const extIndex = name.lastIndexOf('.');
      const base = extIndex !== -1 ? name.substring(0, extIndex) : name;
      const ext = extIndex !== -1 ? name.substring(extIndex) : '';
      
      while (usedNames.has(name)) {
        name = `${base} (${counter})${ext}`;
        counter++;
      }
      usedNames.add(name);
      return name;
    };

    const streamToBuffer = async (stream: any): Promise<Buffer> => {
      return new Promise((resolve, reject) => {
        const chunks: any[] = [];
        stream.on('data', (chunk: any) => chunks.push(chunk));
        stream.on('error', reject);
        stream.on('end', () => resolve(Buffer.concat(chunks)));
      });
    };

    for (const file of files) {
      try {
        const command = new GetObjectCommand({
          Bucket: BUCKET,
          Key: file.name
        });
        const s3Response = await s3Client.send(command);
        if (s3Response.Body) {
          const buffer = await streamToBuffer(s3Response.Body);
          const uniqueName = getUniqueName(file.originalName);
          zip.addFile(uniqueName, buffer);
        }
      } catch (err) {
        console.error(`[KT Cloud] 파일 다운로드 실패 (${file.originalName}):`, err);
      }
    }

    return zip.toBuffer();
  }
};
