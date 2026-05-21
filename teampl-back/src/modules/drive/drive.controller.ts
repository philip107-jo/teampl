import { Router, Request, Response } from 'express';
import { DriveService } from './drive.service';
import { authMiddleware } from '../../middlewares/auth.middleware';
import multer from 'multer';

// /api/projects/:projectId/drive
const router = Router({ mergeParams: true });
router.use(authMiddleware);

// Multer - 메모리 스토리지 (KT Cloud로 스트리밍)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB
});

// GET /api/projects/:projectId/drive
router.get('/', async (req: Request<{ projectId: string }>, res: Response) => {
  const projectId = parseInt(req.params.projectId, 10);
  try {
    const data = await DriveService.getDriveContents(projectId);
    res.json(data);
  } catch (e: any) {
    res.status(500).json({ message: e.message });
  }
});

// POST /api/projects/:projectId/drive/folders
router.post('/folders', async (req: Request<{ projectId: string }>, res: Response) => {
  const projectId = parseInt(req.params.projectId, 10);
  const { name } = req.body;
  try {
    const folder = await DriveService.createFolder(projectId, name);
    res.status(201).json(folder);
  } catch (e: any) {
    res.status(500).json({ message: e.message });
  }
});

// POST /api/projects/:projectId/drive/files
router.post('/files', upload.single('file'), async (req: Request<{ projectId: string }>, res: Response) => {
  const email = req.user!.email;
  const projectId = parseInt(req.params.projectId, 10);
  const folderId = req.body.folderId ? parseInt(req.body.folderId, 10) : null;

  if (!req.file) {
    return res.status(400).json({ message: '파일이 없습니다.' });
  }

  try {
    const savedFile = await DriveService.uploadFile(projectId, email, req.file, folderId);
    res.status(201).json(savedFile);
  } catch (e: any) {
    console.error('[Drive] 업로드 실패:', e);
    res.status(500).json({ message: e.message });
  }
});

// DELETE /api/projects/:projectId/drive/files/:fileId
router.delete('/files/:fileId', async (req: Request<{ projectId: string; fileId: string }>, res: Response) => {
  const fileId = parseInt(req.params.fileId, 10);
  try {
    const success = await DriveService.deleteFile(fileId, req.user!.email);
    if (!success) return res.status(404).json({ message: '파일을 찾을 수 없습니다.' });
    res.status(204).send();
  } catch (e: any) {
    res.status(500).json({ message: e.message });
  }
});

// PATCH /api/projects/:projectId/drive/files/:fileId/move
router.patch('/files/:fileId/move', async (req: Request<{ projectId: string; fileId: string }>, res: Response) => {
  const fileId = parseInt(req.params.fileId, 10);
  const folderId = req.body.folderId !== undefined && req.body.folderId !== null 
    ? parseInt(req.body.folderId, 10) 
    : null;
  try {
    const file = await DriveService.moveFile(fileId, folderId);
    res.json(file);
  } catch (e: any) {
    res.status(500).json({ message: e.message });
  }
});

export default router;
