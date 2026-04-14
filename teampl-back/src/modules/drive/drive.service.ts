import { prisma } from '../../prisma';
import fs from 'fs';
import path from 'path';

// 업로드 폴더 확인 및 생성
const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

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

  saveFileRecord: async (projectId: number, fileInfo: any, uploaderEmail: string) => {
    return await prisma.driveFile.create({
      data: {
        projectId,
        name: fileInfo.filename,            // 저장된 파일명 (랜덤화)
        originalName: fileInfo.originalname, // 원래 이름
        type: fileInfo.mimetype,
        size: fileInfo.size,
        url: `/uploads/${fileInfo.filename}`,
        uploaderEmail,
        folderId: fileInfo.folderId ? parseInt(fileInfo.folderId, 10) : null
      },
      include: {
        uploader: {
          select: { name: true }
        }
      }
    });
  },

  deleteFile: async (fileId: number) => {
    const file = await prisma.driveFile.findUnique({ where: { id: fileId } });
    if (!file) return false;
    
    const filePath = path.join(process.cwd(), 'uploads', file.name);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    
    await prisma.driveFile.delete({ where: { id: fileId } });
    return true;
  }
};
