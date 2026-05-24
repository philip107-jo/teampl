import { Router, Request, Response } from 'express';
import { UsersService } from './users.service';
import { z } from 'zod';
import { validate } from '../../middlewares/validate.middleware';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import { uploadToKTCloud } from '../drive/ktcloud.storage';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } });

import { config } from '../../lib/config';
const JWT_SECRET = config.jwt.secret;

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

// DELETE /api/users/me - 회원 탈퇴
router.delete('/me', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    await UsersService.deleteAccount(userId);
    res.json({ message: '회원탈퇴가 완료되었습니다.' });
  } catch (e: any) {
    res.status(500).json({ message: e.message || '회원탈퇴 중 오류가 발생했습니다.' });
  }
});


// POST /api/users/avatar - 프로필 이미지 업로드
router.post('/avatar', authMiddleware, upload.single('file'), async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    if (!req.file) return res.status(400).json({ message: '파일이 없습니다.' });
    
    const ext = req.file.originalname.split('.').pop() || 'png';
    const key = `avatar/${userId}-${Date.now()}.${ext}`;
    const url = await uploadToKTCloud(key, req.file.buffer, req.file.mimetype);
    
    // DB 업데이트
    const updated = await UsersService.updateProfile(userId, { avatarUrl: url });
    const { password: _, ...userWithoutPassword } = updated;
    res.json(userWithoutPassword);
  } catch (e: any) {
    res.status(500).json({ message: e.message });
  }
});

// POST /api/users/upgrade - 유료 플랜 업그레이드 (Mock)
router.post('/upgrade', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const updated = await UsersService.upgradePlan(userId, 'PRO');
    const { password: _, ...userWithoutPassword } = updated;
    res.json(userWithoutPassword);
  } catch (e: any) {
    res.status(500).json({ message: e.message });
  }
});

export default router;
