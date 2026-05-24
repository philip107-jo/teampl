import { Router } from 'express';
import { ProjectsService } from './projects.service';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { prisma } from '../../prisma';

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

// POST /api/projects/:id/invite-email
router.post('/:id/invite-email', async (req, res) => {
    const email = req.user!.email;
    const id = parseInt(req.params.id, 10);
    const { targetEmail } = req.body;
    try {
        await ProjectsService.inviteByEmail(email, id, targetEmail);
        res.json({ success: true, message: "팀원을 성공적으로 초대했습니다." });
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



router.get('/:id/stats', async (req, res) => {
    const projectId = parseInt(req.params.id, 10);
    const email = req.user!.email;
    try {
        const stats = await ProjectsService.getStats(email, projectId);
        res.json(stats);
    } catch (e: any) {
        res.status(500).json({ message: e.message });
    }
});

// POST /api/projects/:id/ai/split-tasks
router.post('/:id/ai/split-tasks', async (req, res) => {
    try {
        const email = req.user!.email;
        const id = parseInt(req.params.id, 10);
        const { teamSize, topic, description } = req.body;

        const member = await prisma.projectMember.findUnique({
            where: { userEmail_projectId: { userEmail: email, projectId: id } }
        });
        if (!member) {
            return res.status(403).json({ message: "권한이 없습니다." });
        }

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) return res.status(404).json({ message: "유저를 찾을 수 없습니다." });

        if (user.plan === 'FREE' && user.aiUsageCount >= 1) {
            return res.status(402).json({ message: "무료 이용 횟수를 초과했습니다. PRO 플랜으로 업그레이드 해주세요.", requireUpgrade: true });
        }

        if (!teamSize || !topic) return res.status(400).json({ message: "팀 인원 수와 주제를 입력해주세요." });
        const suggestions = await ProjectsService.generateTasksWithAi(id, teamSize, topic, description || "");
        
        await prisma.user.update({ where: { email }, data: { aiUsageCount: { increment: 1 } } });
        
        res.json(suggestions);
    } catch (e: any) {
        res.status(500).json({ message: e.message });
    }
});

// POST /api/projects/:id/ai/evaluate
router.post('/:id/ai/evaluate', async (req, res) => {
    try {
        const email = req.user!.email;
        const id = parseInt(req.params.id, 10);
        const { reportText } = req.body;

        const member = await prisma.projectMember.findUnique({
            where: { userEmail_projectId: { userEmail: email, projectId: id } }
        });
        if (!member) {
            return res.status(403).json({ message: "권한이 없습니다." });
        }

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user || user.plan !== 'PRO') {
            return res.status(402).json({ message: "산출물 평가 기능은 PRO 플랜에서만 이용 가능합니다.", requireUpgrade: true });
        }

        if (!reportText) return res.status(400).json({ message: "평가할 보고서 텍스트를 입력해주세요." });
        
        const evaluation = await ProjectsService.evaluateProjectWithAi(id, reportText);
        res.json(evaluation);
    } catch (e: any) {
        res.status(500).json({ message: e.message });
    }
});

// PATCH /api/projects/:id/status
router.patch('/:id/status', async (req, res) => {
    const email = req.user!.email;
    const id = parseInt(req.params.id, 10);
    const { status } = req.body;
    try {
        const updatedProject = await ProjectsService.updateStatus(email, id, status);
        res.json(updatedProject);
    } catch (e: any) {
        res.status(403).json({ message: e.message });
    }
});

// PATCH /api/projects/:id/stages
router.patch('/:id/stages', async (req, res) => {
    const email = req.user!.email;
    const id = parseInt(req.params.id, 10);
    const { stages } = req.body;
    try {
        const updatedProject = await ProjectsService.updateStages(email, id, stages);
        res.json(updatedProject);
    } catch (e: any) {
        res.status(403).json({ message: e.message });
    }
});

// GET /api/projects/:id/search
router.get('/:id/search', async (req, res) => {
    const email = req.user!.email;
    const id = parseInt(req.params.id, 10);
    const q = req.query.q as string;
    
    if (!q) {
        return res.json({ messages: [], tasks: [], files: [] });
    }
    
    try {
        const results = await ProjectsService.searchAll(email, id, q);
        res.json(results);
    } catch (e: any) {
        res.status(403).json({ message: e.message });
    }
});

export default router;
