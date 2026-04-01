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

// JWT에서 유저 id 추출 미들웨어
function authMiddleware(req: Request, res: Response, next: Function) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ message: '인증이 필요합니다.' });
    return;
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; email: string };
    (req as any).userId = decoded.id;
    next();
  } catch {
    res.status(401).json({ message: '유효하지 않은 토큰입니다.' });
  }
}

// GET /api/users/me - 내 정보 조회
router.get('/me', authMiddleware, async (req: Request, res: Response) => {
  const userId = (req as any).userId;
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
  const userId = (req as any).userId;
  const { name, studentId, department } = req.body;
  const updated = await UsersService.updateProfile(userId, { name, studentId, department });
  const { password: _, ...userWithoutPassword } = updated;
  res.json(userWithoutPassword);
});

export default router;
