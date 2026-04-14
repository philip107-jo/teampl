import { Router } from 'express';
import { ChatService } from './chat.service';
import { authMiddleware } from '../../middlewares/auth.middleware';

// 이 라우터는 mergeParams를 쓰지 않으므로 /api/chat 으로 마운트될 예정입니다.
// 프로젝트 메시지: /api/chat/project/:projectId
// 개인 메시지: /api/chat/direct/:email

const router = Router();
router.use(authMiddleware);

router.get('/project/:projectId', async (req, res) => {
    const projectId = parseInt(req.params.projectId, 10);
    try {
        const messages = await ChatService.getProjectMessages(projectId);
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

export default router;
