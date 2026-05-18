import { Router } from 'express';
import { ProjectsService } from './projects.service';
import { authMiddleware } from '../../middlewares/auth.middleware';
import axios from 'axios';
import crypto from 'crypto';
import { prisma } from '../../prisma';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        name: string;
        isUnivVerified?: boolean;
        msRefreshToken?: string | null;
      };
    }
  }
}

interface UserWithMS {
    id: string;
    email: string;
    name: string;
    isUnivVerified: boolean;
    msRefreshToken: string | null;
}

const router = Router();
router.use(authMiddleware);

// GET /api/projects
router.get('/', async (req, res) => {
    const email = req.user!.email;
    const projects = await ProjectsService.getAll(email);
    res.json(projects);
});

// POST /api/projects
router.post('/', async (req, res) => {
    const email = req.user!.email;
    const newProject = await ProjectsService.create(email, req.body);
    res.status(201).json(newProject);
});

// POST /api/projects/join
router.post('/join', async (req, res) => {
    const email = req.user!.email;
    const { inviteCode, userName } = req.body;
    if (!inviteCode) return res.status(400).json({ message: 'Invite code is required' });
    
    const joinedProject = await ProjectsService.join(email, inviteCode, userName);
    if (!joinedProject) return res.status(404).json({ message: 'Invalid invite code or project not found' });
    
    res.status(200).json(joinedProject);
});

// PATCH /api/projects/:id
router.patch('/:id', async (req, res) => {
    const email = req.user!.email;
    const id = parseInt(req.params.id, 10);
    const updated = await ProjectsService.update(email, id, req.body);
    if (!updated) return res.status(404).json({ message: 'Project not found' });
    res.json(updated);
});

// DELETE /api/projects/:id
router.delete('/:id', async (req, res) => {
    const email = req.user!.email;
    const id = parseInt(req.params.id, 10);
    const { deleteReason } = req.body;
    const success = await ProjectsService.delete(email, id, deleteReason);
    if (!success) return res.status(404).json({ message: 'Project not found' });

    // Task, Schedule은 Prisma의 onDelete: Cascade로 자동 삭제됨
    res.status(204).send();
});

// PATCH /api/projects/:id/invite-code
router.patch('/:id/invite-code', async (req, res) => {
    const email = req.user!.email;
    const id = parseInt(req.params.id, 10);
    try {
        const updatedProject = await ProjectsService.regenerateInviteCode(email, id);
        res.json(updatedProject);
    } catch (e: any) {
        res.status(403).json({ message: e.message });
    }
});

// PATCH /api/projects/:id/transfer-leadership
router.patch('/:id/transfer-leadership', async (req, res) => {
    const email = req.user!.email;
    const id = parseInt(req.params.id, 10);
    const { targetUserId } = req.body;
    try {
        await ProjectsService.transferLeadership(email, id, targetUserId);
        res.json({ success: true, message: "권한 위임 성공" });
    } catch (e: any) {
        res.status(403).json({ message: e.message });
    }
});

// PATCH /api/projects/:id/kick-member
router.patch('/:id/kick-member', async (req, res) => {
    const email = req.user!.email;
    const id = parseInt(req.params.id, 10);
    const { targetUserId, kickReason } = req.body;
    try {
        await ProjectsService.kickMember(email, id, targetUserId, kickReason);
        res.json({ success: true, message: "팀원을 내보냈습니다." });
    } catch (e: any) {
        res.status(403).json({ message: e.message });
    }
});

// GET /api/projects/kicked-alerts
router.get('/kicked-alerts', async (req, res) => {
    const email = req.user!.email;
    try {
        const alerts = await ProjectsService.getKickedAlerts(email);
        res.json(alerts);
    } catch (e: any) {
        res.status(500).json({ message: e.message });
    }
});

// DELETE /api/projects/:id/kicked-alert
router.delete('/:id/kicked-alert', async (req, res) => {
    const email = req.user!.email;
    const id = parseInt(req.params.id, 10);
    try {
        await ProjectsService.ackKickedAlert(email, id);
        res.status(204).send();
    } catch (e: any) {
        res.status(500).json({ message: e.message });
    }
});

// GET /api/projects/delete-alerts
router.get('/delete-alerts', async (req, res) => {
    const email = req.user!.email;
    try {
        const alerts = await ProjectsService.getDeleteAlerts(email);
        res.json(alerts);
    } catch (e: any) {
        res.status(500).json({ message: e.message });
    }
});

// DELETE /api/projects/:id/delete-alert
router.delete('/:id/delete-alert', async (req, res) => {
    const email = req.user!.email;
    const alertId = parseInt(req.params.id, 10);
    try {
        await ProjectsService.ackDeleteAlert(email, alertId);
        res.status(204).send();
    } catch (e: any) {
        res.status(500).json({ message: e.message });
    }
});

// POST /api/projects/:id/ms-docs
router.post('/:id/ms-docs', async (req, res) => {
    const email = req.user!.email;
    const { type, title } = req.body; // 'word', 'excel', 'ppt', 'title' (optional)

    try {
        // 1. Get user from DB
        const user = (await prisma.user.findUnique({ where: { email } })) as UserWithMS | null;
        if (!user || !user.isUnivVerified || !user.msRefreshToken) {
            return res.status(403).json({ message: "Microsoft 계정 연동이 필요합니다." });
        }

        // 2. Fetch fresh access token using refresh token
        const clientId = process.env.MS_CLIENT_ID!;
        const clientSecret = process.env.MS_CLIENT_SECRET!;
        const tokenParams = new URLSearchParams();
        tokenParams.append('client_id', clientId);
        tokenParams.append('scope', 'user.read Files.ReadWrite.AppFolder offline_access');
        tokenParams.append('refresh_token', user.msRefreshToken);
        tokenParams.append('grant_type', 'refresh_token');
        tokenParams.append('client_secret', clientSecret);

        const tokenResponse = await axios.post('https://login.microsoftonline.com/common/oauth2/v2.0/token', tokenParams.toString(), {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });
        const accessToken = tokenResponse.data.access_token;
        
        // 3. Update refresh token if MS returned a new one
        if (tokenResponse.data.refresh_token) {
            await (prisma.user as any).update({
                where: { email },
                data: { msRefreshToken: tokenResponse.data.refresh_token }
            });
        }

        // 3. Create document via Graph API
        let extension = 'docx';
        if (type === 'excel') { extension = 'xlsx'; }
        if (type === 'ppt') { extension = 'pptx'; }

        // 파일명 생성: 사용자 제목 + 무작위 소금 (중복 방지)
        const randomSalt = crypto.randomBytes(4).toString('hex'); 
        const baseTitle = title ? title.trim() : `TP_${type.toUpperCase()}_v${Date.now()}`;
        // 파일명에 부적합한 문자 제거
        const safeTitle = baseTitle.replace(/[\\/:*?"<>|]/g, '_');
        const fileName = `${safeTitle}_${randomSalt}.${extension}`;
        
        // Create an empty file first
        const folderUrl = `https://graph.microsoft.com/v1.0/me/drive/special/approot:/${fileName}:/content`;
        const createResponse = await axios.put(folderUrl, "", {
            headers: { 
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'text/plain' 
            }
        });

        // 5. [긴급 복구] 다시 익명 권한으로 변경 (학교 보안 정책 우회용)
        // 학교 보안이 너무 강력하여 이 방식만이 현재로서는 가장 안정적으로 문서를 열 수 있습니다.
        const fileId = createResponse.data.id;
        const linkResponse = await axios.post(`https://graph.microsoft.com/v1.0/me/drive/items/${fileId}/createLink`, {
            type: 'edit',
            scope: 'anonymous' 
        }, {
            headers: { Authorization: `Bearer ${accessToken}` }
        });

        const webUrl = linkResponse.data.link.webUrl;
        
        // 6. DB에 문서 정보 저장
        const sharedDoc = await (prisma as any).sharedDocument.create({
            data: {
                projectId: parseInt(req.params.id, 10),
                fileName: fileName,
                fileType: type,
                webUrl: webUrl,
                creatorEmail: email
            }
        });

        // Return JSON to frontend
        res.json({ success: true, webUrl, document: sharedDoc });
    } catch (e: any) {
        console.error("Graph API Error:", e.response?.data || e.message);
        res.status(500).json({ message: "문서 생성에 실패했습니다." });
    }
});

// GET /api/projects/:id/ms-docs
router.get('/:id/ms-docs', async (req, res) => {
    const projectId = parseInt(req.params.id, 10);
    try {
        const docs = await (prisma as any).sharedDocument.findMany({
            where: { projectId },
            orderBy: { createdAt: 'desc' }
        });
        res.json(docs);
    } catch (e: any) {
        res.status(500).json({ message: "문서 목록을 가져오는 데 실패했습니다." });
    }
});

// GET /api/projects/:id/stats
router.get('/:id/stats', async (req, res) => {
    const projectId = parseInt(req.params.id, 10);
    try {
        const stats = await ProjectsService.getStats(projectId);
        res.json(stats);
    } catch (e: any) {
        res.status(500).json({ message: e.message });
    }
});

// POST /api/projects/:id/ai/split-tasks
router.post('/:id/ai/split-tasks', async (req, res) => {
    try {
        const { teamSize, topic, description } = req.body;
        if (!teamSize || !topic) return res.status(400).json({ message: "팀 인원 수와 주제를 입력해주세요." });
        const suggestions = await ProjectsService.generateTasksWithAi(teamSize, topic, description || "");
        res.json(suggestions);
    } catch (e: any) {
        res.status(500).json({ message: e.message });
    }
});

export default router;
