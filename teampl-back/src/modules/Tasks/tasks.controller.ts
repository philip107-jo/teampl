import { Router } from 'express';
import { TasksService } from './tasks.service';
import { authMiddleware } from '../../middlewares/auth.middleware';

const router = Router({ mergeParams: true }); // mergeParams로 상위 :projectId 접근
router.use(authMiddleware);

// GET /api/projects/:projectId/tasks
router.get('/', async (req, res) => {
    const email = req.user!.email;
    const projectId = parseInt((req.params as any).projectId, 10);
    try {
        const tasks = await TasksService.getByProject(email, projectId);
        res.json(tasks);
    } catch (e: any) {
        res.status(403).json({ message: e.message });
    }
});

// POST /api/projects/:projectId/tasks
router.post('/', async (req, res) => {
    const email = req.user!.email;
    const projectId = parseInt((req.params as any).projectId, 10);
    try {
        const newTask = await TasksService.create(email, projectId, req.body);
        res.status(201).json(newTask);
    } catch (e: any) {
        res.status(403).json({ message: e.message });
    }
});

// PATCH /api/projects/:projectId/tasks/:id
router.patch('/:id', async (req, res) => {
    const email = req.user!.email;
    const projectId = parseInt((req.params as any).projectId, 10);
    const { id } = req.params;
    const { status } = req.body;
    try {
        const updatedTask = await TasksService.updateStatus(email, projectId, id, status);
        if (!updatedTask) return res.status(404).json({ message: 'Task not found' });
        res.json(updatedTask);
    } catch (e: any) {
        res.status(403).json({ message: e.message });
    }
});

// DELETE /api/projects/:projectId/tasks/:id
router.delete('/:id', async (req, res) => {
    const email = req.user!.email;
    const projectId = parseInt((req.params as any).projectId, 10);
    const { id } = req.params;
    try {
        const success = await TasksService.delete(email, projectId, id);
        if (!success) return res.status(404).json({ message: 'Task not found' });
        res.status(204).send();
    } catch (e: any) {
        res.status(403).json({ message: e.message });
    }
});

export default router;
