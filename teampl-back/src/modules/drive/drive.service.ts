import { prisma } from '../../prisma';
import { uploadToKTCloud, deleteFromKTCloud } from './ktcloud.storage';

export const DriveService = {
  // 프로젝트 드라이브 조회
  getDriveContents: async (projectId: number) => {
    const folders = await prisma.driveFolder.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' }
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

  createFolder: async (projectId: number, name: string) => {
    return await prisma.driveFolder.create({
      data: {
        projectId,
        name,
        theme: 'blue'
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
  }
};
