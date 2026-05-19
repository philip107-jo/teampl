import { Router } from 'express';
import { SchedulesService } from './schedules.service';
import { authMiddleware } from '../../middlewares/auth.middleware';

const router = Router();
router.use(authMiddleware);

// GET /api/schedules
router.get('/', async (req, res) => {
    const email = req.user!.email;
    try {
        const schedules = await SchedulesService.getGlobal(email);
        res.json(schedules);
    } catch (e: any) {
        res.status(500).json({ message: e.message });
    }
});

// POST /api/schedules
router.post('/', async (req, res) => {
    const email = req.user!.email;
    // If projectId is provided in the body, it's a project schedule
    const { projectId, ...data } = req.body;
    try {
        if (projectId) {
            const newSchedule = await SchedulesService.create(email, parseInt(projectId, 10), data);
            res.status(201).json(newSchedule);
        } else {
            const newSchedule = await SchedulesService.createPersonal(email, data);
            res.status(201).json(newSchedule);
        }
    } catch (e: any) {
        res.status(403).json({ message: e.message });
    }
});

// PATCH /api/schedules/:id
router.patch('/:id', async (req, res) => {
    const email = req.user!.email;
    const id = parseInt(req.params.id, 10);
    const { projectId, ...data } = req.body;
    try {
        if (projectId) {
            const updated = await SchedulesService.update(email, parseInt(projectId, 10), id, data);
            res.json(updated);
        } else {
            const updated = await SchedulesService.updatePersonal(email, id, data);
            res.json(updated);
        }
    } catch (e: any) {
        res.status(403).json({ message: e.message });
    }
});

// DELETE /api/schedules/:id
router.delete('/:id', async (req, res) => {
    const email = req.user!.email;
    const id = parseInt(req.params.id, 10);
    const projectId = req.query.projectId;
    
    try {
        let success = false;
        if (projectId) {
            success = await SchedulesService.delete(email, parseInt(projectId as string, 10), id);
        } else {
            success = await SchedulesService.deletePersonal(email, id);
        }
        
        if (!success) return res.status(404).json({ message: 'Schedule not found or permission denied' });
        res.status(204).send();
    } catch (e: any) {
        res.status(403).json({ message: e.message });
    }
});

export default router;
