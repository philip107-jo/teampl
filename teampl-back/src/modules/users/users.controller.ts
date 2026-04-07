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

// GET /api/users/ms-login - Microsoft 로그인 시작점 (브라우저 리다이렉트 방식)
router.get('/ms-login', (req: Request, res: Response) => {
  // 브라우저 주소 이동이라 Authorization 헤더를 못 보내므로 쿼리로 JWT 수신
  const token = req.query.token as string;
  if (!token) return res.status(401).json({ error: '토큰이 없습니다.' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; email: string };
    const userId = decoded.id;

    const clientId = process.env.MS_CLIENT_ID;
    const redirectUri = process.env.MS_REDIRECT_URI;
    if (!clientId || !redirectUri) return res.status(500).json({ error: "Missing MS credentials" });

    const scopes = "offline_access user.read Files.ReadWrite.AppFolder";
    const authUrl = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id=${clientId}&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}&response_mode=query&scope=${encodeURIComponent(scopes)}&state=${userId}&prompt=select_account`;

    // 바로 Microsoft 로그인 페이지로 이동
    res.redirect(authUrl);
  } catch (e) {
    return res.status(401).json({ error: '유효하지 않은 토큰입니다.' });
  }
});

// GET /api/users/ms-callback - Microsoft 로그인 콜백
import axios from 'axios';
router.get('/ms-callback', async (req: Request, res: Response) => {
  const code = req.query.code as string;
  const userId = req.query.state as string; // We passed userId in state
  const error = req.query.error;

  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

  if (error || !code) {
    return res.redirect(`${frontendUrl}/projects?tab=overview&ms_error=true`);
  }

  const clientId = process.env.MS_CLIENT_ID!;
  const clientSecret = process.env.MS_CLIENT_SECRET!;
  const redirectUri = process.env.MS_REDIRECT_URI!;

  try {
    const params = new URLSearchParams();
    params.append('client_id', clientId);
    params.append('scope', 'user.read Files.ReadWrite.AppFolder offline_access');
    params.append('code', code);
    params.append('redirect_uri', redirectUri);
    params.append('grant_type', 'authorization_code');
    params.append('client_secret', clientSecret);

    const tokenResponse = await axios.post('https://login.microsoftonline.com/common/oauth2/v2.0/token', params.toString(), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });

    const accessToken = tokenResponse.data.access_token;
    const refreshToken = tokenResponse.data.refresh_token;

    // Fetch user info from Graph API to get the microsoft account ID
    const userResponse = await axios.get('https://graph.microsoft.com/v1.0/me', {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    const msAccountId = userResponse.data.id;

    // Update our DB
    await UsersService.linkMicrosoftAccount(userId, msAccountId, refreshToken);

    // Redirect to frontend
    res.redirect(`${frontendUrl}/projects?tab=overview&ms_success=true`);
  } catch (err: any) {
    console.error("MS Auth Error:", err.response?.data || err.message);
    res.redirect(`${frontendUrl}/projects?tab=overview&ms_error=true`);
  }
});

export default router;
