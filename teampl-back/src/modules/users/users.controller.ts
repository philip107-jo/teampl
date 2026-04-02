import { Router, Request, Response } from 'express';
import { UsersService } from './users.service';
import { z } from 'zod';
import { validate } from '../../middlewares/validate.middleware';
import jwt from 'jsonwebtoken';

const router = Router();

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key';

const UpdateProfileSchema = z.object({
  body: z.object({
    name: z.string().min(1, '이름을 입력해주세요.').optional(),
    studentId: z.string().optional(),
    department: z.string().optional(),
  }),
});

import { authMiddleware } from '../../middlewares/auth.middleware';

// GET /api/users/me - 내 정보 조회
router.get('/me', authMiddleware, async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const user = await UsersService.findById(userId);
  if (!user) {
    res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
    return;
  }
  const { password: _, ...userWithoutPassword } = user;
  res.json(userWithoutPassword);
});

// PUT /api/users/me - 내 정보 수정
router.put('/me', authMiddleware, validate(UpdateProfileSchema), async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { name, studentId, department } = req.body;
  const updated = await UsersService.updateProfile(userId, { name, studentId, department });
  const { password: _, ...userWithoutPassword } = updated;
  res.json(userWithoutPassword);
});

export default router;
