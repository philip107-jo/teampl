import { Router } from 'express';
import { AiService } from './ai.service';
import { authMiddleware } from '../../middlewares/auth.middleware';

const router = Router({ mergeParams: true });

// POST /api/projects/:projectId/ai/split-tasks
router.post('/split-tasks', authMiddleware, async (req: any, res) => {
  try {
    const { teamSize, topic, description } = req.body;
    if (!description) {
      return res.status(400).json({ error: '과제 설명이 필요합니다.' });
    }

    const tasks = await AiService.splitTasks(teamSize, topic, description);
    res.json({ tasks });
  } catch (error: any) {
    console.error('AI Split Error:', error);
    res.status(500).json({ error: error.message || 'AI 분석 중 오류가 발생했습니다.' });
  }
});

export default router;
