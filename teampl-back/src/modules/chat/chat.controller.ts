import { Router } from 'express';
import multer from 'multer';
import { ChatService } from './chat.service';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { uploadToKTCloud } from '../drive/ktcloud.storage';

const router = Router();
router.use(authMiddleware);

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } });

router.get('/reads', async (req, res) => {
    try {
        const reads = await ChatService.getReadStates(req.user!.email);
        res.json(reads);
    } catch (e: any) {
        res.status(500).json({ message: e.message });
    }
});

router.post('/reads', async (req, res) => {
    try {
        const { roomKey, lastReadMsgId } = req.body;
        const read = await ChatService.updateLastRead(req.user!.email, roomKey, lastReadMsgId);
        res.json(read);
    } catch (e: any) {
        res.status(500).json({ message: e.message });
    }
});

router.get('/project/:projectId', async (req, res) => {
    const projectId = parseInt(req.params.projectId, 10);
    const email = req.user!.email;
    try {
        const messages = await ChatService.getProjectMessages(email, projectId);
        res.json(messages);
    } catch (e: any) {
        res.status(500).json({ message: e.message });
    }
});

router.get('/direct/:email', async (req, res) => {
    const myEmail = req.user!.email;
    const targetEmail = req.params.email;
    try {
        const messages = await ChatService.getDirectMessages(myEmail, targetEmail);
        res.json(messages);
    } catch (e: any) {
        res.status(500).json({ message: e.message });
    }
});

// 채팅용 파일 업로드 → KT Cloud 저장 후 URL 반환
router.post('/upload', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ message: '파일이 없습니다.' });
        const ext = req.file.originalname.split('.').pop() || 'bin';
        const key = `chat/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const url = await uploadToKTCloud(key, req.file.buffer, req.file.mimetype);
        res.json({
            url,
            name: req.file.originalname,
            type: req.file.mimetype,
            size: req.file.size,
        });
    } catch (e: any) {
        res.status(500).json({ message: e.message });
    }
});

export default router;
