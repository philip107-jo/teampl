import { Router } from 'express';
import { DriveService } from './drive.service';
import { authMiddleware } from '../../middlewares/auth.middleware';
import multer from 'multer';
import path from 'path';

// /api/projects/:projectId/drive
const router = Router({ mergeParams: true });
router.use(authMiddleware);

// Multer 설정
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(process.cwd(), 'uploads'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    // 한글 등 유니코드 파일명 깨짐 방지를 위해 원본 이름은 DB에 저장하고, 서버에는 안전한 파일명으로 저장
    cb(null, uniqueSuffix + '-' + Buffer.from(file.originalname, 'latin1').toString('utf8').replace(/[^a-zA-Z0-9.-]/g, '_'));
  }
});
const upload = multer({ storage });

router.get('/', async (req, res) => {
    const projectId = parseInt((req.params as any).projectId, 10);
    try {
        const data = await DriveService.getDriveContents(projectId);
        res.json(data);
    } catch (e: any) {
        res.status(500).json({ message: e.message });
    }
});

router.post('/folders', async (req, res) => {
    const projectId = parseInt((req.params as any).projectId, 10);
    const { name } = req.body;
    try {
        const folder = await DriveService.createFolder(projectId, name);
        res.status(201).json(folder);
    } catch (e: any) {
        res.status(500).json({ message: e.message });
    }
});

// 파일 업로드 라우터
router.post('/files', upload.single('file'), async (req, res) => {
    const email = req.user!.email;
    const projectId = parseInt((req.params as any).projectId, 10);
    const folderId = req.body.folderId; // form-data 필드로 전달받을 수 있음

    if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
    }

    try {
        // req.file 객체에 filename, originalname, size, mimetype 등이 담겨 있습니다.
        const fileInfo = { ...req.file, folderId };
        
        // 원본 이름 한글 인코딩 복원 (Node 18+에서 Form-data가 latin1으로 넘어오는 경우 대응)
        fileInfo.originalname = Buffer.from(fileInfo.originalname, 'latin1').toString('utf8');

        const savedFile = await DriveService.saveFileRecord(projectId, fileInfo, email);
        res.status(201).json(savedFile);
    } catch (e: any) {
        res.status(500).json({ message: e.message });
    }
});

router.delete('/files/:fileId', async (req, res) => {
    const fileId = parseInt(req.params.fileId, 10);
    try {
        const success = await DriveService.deleteFile(fileId);
        if (!success) return res.status(404).json({ message: 'File not found' });
        res.status(204).send();
    } catch (e: any) {
        res.status(500).json({ message: e.message });
    }
});

export default router;
