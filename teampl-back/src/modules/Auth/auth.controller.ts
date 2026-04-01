import { Router, Request, Response } from 'express';
import { AuthService } from './auth.service';
import { validate } from '../../middlewares/validate.middleware';
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

export default router;
