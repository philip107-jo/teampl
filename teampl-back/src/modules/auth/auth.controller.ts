import { Router, Request, Response } from 'express';
import { AuthService } from './auth.service';
import { validate } from '../../middlewares/validate.middleware';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { z } from 'zod';

const router = Router();

const AuthSchema = z.object({
  body: z.object({
    email: z.string().email("Invalid email format"),
    password: z.string().min(4, "Password must be at least 4 characters"), // 프론트엔드 기준(최소 4자)과 맞춥니다.
    name: z.string().optional(),
    studentId: z.string().optional(),
    department: z.string().optional(),
  }),
});

const SendCodeSchema = z.object({
  body: z.object({
    email: z.string().email("Invalid email format"),
  }),
});

const VerifyCodeSchema = z.object({
  body: z.object({
    email: z.string().email("Invalid email format"),
    code: z.string().length(6, "Verification code must be 6 digits"),
  }),
});

const ResetPasswordSchema = z.object({
  body: z.object({
    email: z.string().email("Invalid email format"),
    newPassword: z.string().min(4, "Password must be at least 4 characters"),
  }),
});

router.post('/send-code', validate(SendCodeSchema), async (req: Request, res: Response) => {
  const { email } = req.body;
  const result = await AuthService.sendVerificationCode(email);
  res.json(result);
});

router.post('/verify-code', validate(VerifyCodeSchema), async (req: Request, res: Response) => {
  const { email, code } = req.body;
  const result = await AuthService.verifyCode(email, code);
  res.json(result);
});

router.post('/forgot-password/send-code', validate(SendCodeSchema), async (req: Request, res: Response) => {
  const { email } = req.body;
  const result = await AuthService.sendPasswordResetCode(email);
  res.json(result);
});

router.post('/forgot-password/verify-code', validate(VerifyCodeSchema), async (req: Request, res: Response) => {
  const { email, code } = req.body;
  // verifyCode logic is the same (checking email and code, setting isVerified)
  const result = await AuthService.verifyCode(email, code);
  res.json(result);
});

router.post('/forgot-password/reset', validate(ResetPasswordSchema), async (req: Request, res: Response) => {
  const { email, newPassword } = req.body;
  const result = await AuthService.resetPassword(email, newPassword);
  res.json(result);
});

router.post('/register', validate(AuthSchema), async (req: Request, res: Response) => {
  const { email, password, name, studentId, department } = req.body;
  const result = await AuthService.register(email, password, name, studentId, department);
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
