import { Router } from 'express';
import { SchedulesService } from './Schedules.service';
import { authMiddleware } from '../../middlewares/auth.middleware';

const router = Router({ mergeParams: true });
router.use(authMiddleware);

// GET /api/projects/:projectId/schedules
router.get('/', async (req, res) => {
    const email = req.user!.email;
    const projectId = parseInt((req.params as any).projectId, 10);
    try {
        const schedules = await SchedulesService.getByProject(email, projectId);
        res.json(schedules);
    } catch (e: any) {
        res.status(403).json({ message: e.message });
    }
});

// POST /api/projects/:projectId/schedules  
router.post('/', async (req, res) => {
    const email = req.user!.email;
    const projectId = parseInt((req.params as any).projectId, 10);
    try {
        const newSchedule = await SchedulesService.create(email, projectId, req.body);
        res.status(201).json(newSchedule);
    } catch (e: any) {
        res.status(403).json({ message: e.message });
    }
});

// PATCH /api/projects/:projectId/schedules/:id
router.patch('/:id', async (req, res) => {
    const email = req.user!.email;
    const projectId = parseInt((req.params as any).projectId, 10);
    const id = parseInt(req.params.id, 10);
    try {
        const updated = await SchedulesService.update(email, projectId, id, req.body);
        if (!updated) return res.status(404).json({ message: 'Schedule not found' });
        res.json(updated);
    } catch (e: any) {
        res.status(403).json({ message: e.message });
    }
});

// DELETE /api/projects/:projectId/schedules/:id
router.delete('/:id', async (req, res) => {
    const email = req.user!.email;
    const projectId = parseInt((req.params as any).projectId, 10);
    const id = parseInt(req.params.id, 10);
    try {
        const success = await SchedulesService.delete(email, projectId, id);
        if (!success) return res.status(404).json({ message: 'Schedule not found' });
        res.status(204).send();
    } catch (e: any) {
        res.status(403).json({ message: e.message });
    }
});

export default router;
