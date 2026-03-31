import { Router } from 'express';
import { ChatService } from './chat.service';

const router = Router();

// POST /api/chat/suggest
router.post('/suggest', async (req, res) => {
    const { content } = req.body;
    
    if (!content || content.trim() === '') {
        return res.status(400).json({ error: '과제 내용을 입력해주세요.' });
    }

    try {
        const suggestion = await ChatService.suggestAssignmentPlan(content);
        res.json({ suggestion });
    } catch (error: any) {
        console.error('AI 분석 오류:', error);
        res.status(500).json({ 
            error: 'AI 분석 중 오류가 발생했습니다.',
            message: error.message 
        });
    }
});

export default router;
