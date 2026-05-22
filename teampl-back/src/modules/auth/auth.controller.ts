import { Router, Request, Response } from 'express';
import { AuthService } from './auth.service';
import { validate } from '../../middlewares/validate.middleware';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { z } from 'zod';

const router = Router();

const AuthSchema = z.object({
  body: z.object({
    email: z.string().email("Invalid email format"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    name: z.string().optional(),
  }),
});

router.post('/register', validate(AuthSchema), async (req: Request, res: Response) => {
  const { email, password, name } = req.body;
  const result = await AuthService.register(email, password, name);
  res.status(201).json(result);
});

router.post('/login', validate(AuthSchema), async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const result = await AuthService.login(email, password);
  res.json(result);
});

router.post('/change-password', authMiddleware, async (req: Request, res: Response) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ message: '현재 비밀번호와 새 비밀번호를 모두 입력해주세요.' });
  }
  if (newPassword.length < 6) {
    return res.status(400).json({ message: '새 비밀번호는 6자 이상이어야 합니다.' });
  }
  const result = await AuthService.changePassword(req.user!.id, currentPassword, newPassword);
  res.json(result);
});

export default router;
