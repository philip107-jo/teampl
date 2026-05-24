import { Router } from 'express';
import { TasksService } from './tasks.service';
import { authMiddleware } from '../../middlewares/auth.middleware';
import multer from 'multer';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB
});

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

// POST /api/projects/:projectId/tasks/batch
router.post('/batch', async (req, res) => {
    const email = req.user!.email;
    const projectId = parseInt((req.params as any).projectId, 10);
    const { tasks } = req.body;
    try {
        console.log("Batch create received:", { email, projectId, tasksCount: tasks?.length });
        const newTasks = await TasksService.batchCreate(email, projectId, tasks);
        res.status(201).json(newTasks);
    } catch (e: any) {
        console.error("BatchCreate Error:", e);
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

// POST /api/projects/:projectId/tasks/:id/submit
router.post('/:id/submit', upload.array('files', 20), async (req, res) => {
    const email = req.user!.email;
    const projectId = parseInt((req.params as any).projectId, 10);
    const { id } = req.params;
    const files = req.files as Express.Multer.File[];
    
    if (!files || files.length === 0) {
        return res.status(400).json({ message: '산출물 파일이 없습니다.' });
    }

    try {
        const updatedTask = await TasksService.submitForReview(email, projectId, id as string, files);
        res.json(updatedTask);
    } catch (e: any) {
        res.status(403).json({ message: e.message });
    }
});

// POST /api/projects/:projectId/tasks/:id/deliverables (add more files)
router.post('/:id/deliverables', upload.array('files', 20), async (req, res) => {
    const email = req.user!.email;
    const projectId = parseInt((req.params as any).projectId, 10);
    const { id } = req.params;
    const files = req.files as Express.Multer.File[];
    
    if (!files || files.length === 0) {
        return res.status(400).json({ message: '업로드할 파일이 없습니다.' });
    }

    try {
        const updatedTask = await TasksService.addDeliverables(email, projectId, id as string, files);
        res.json(updatedTask);
    } catch (e: any) {
        res.status(403).json({ message: e.message });
    }
});

// DELETE /api/projects/:projectId/tasks/:id/deliverables/:deliverableId
router.delete('/:id/deliverables/:deliverableId', async (req, res) => {
    const email = req.user!.email;
    const projectId = parseInt((req.params as any).projectId, 10);
    const { id } = req.params;
    const deliverableId = parseInt(req.params.deliverableId, 10);
    
    try {
        await TasksService.deleteDeliverable(email, projectId, id, deliverableId);
        res.status(204).send();
    } catch (e: any) {
        res.status(403).json({ message: e.message });
    }
});

// POST /api/projects/:projectId/tasks/:id/approve
router.post('/:id/approve', async (req, res) => {
    const email = req.user!.email;
    const projectId = parseInt((req.params as any).projectId, 10);
    const { id } = req.params;
    
    try {
        const updatedTask = await TasksService.approveTask(email, projectId, id);
        res.json(updatedTask);
    } catch (e: any) {
        res.status(403).json({ message: e.message });
    }
});

// PATCH /api/projects/:projectId/tasks/:id/assignees
router.patch('/:id/assignees', async (req, res) => {
    const email = req.user!.email;
    const projectId = parseInt((req.params as any).projectId, 10);
    const { id } = req.params;
    const { assignees } = req.body;
    try {
        const updatedTask = await TasksService.updateAssignees(email, projectId, id, assignees);
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

// PATCH /api/projects/:projectId/tasks/:id/details
router.patch('/:id/details', async (req, res) => {
    const email = req.user!.email;
    const projectId = parseInt((req.params as any).projectId, 10);
    const { id } = req.params;
    const { title, description, requiresDeliverable } = req.body;
    try {
        const updatedTask = await TasksService.updateDetails(email, projectId, id, { title, description, requiresDeliverable });
        res.json(updatedTask);
    } catch (e: any) {
        res.status(403).json({ message: e.message });
    }
});

// GET /api/projects/:projectId/tasks/:id/comments
router.get('/:id/comments', async (req, res) => {
    const email = req.user!.email;
    const projectId = parseInt((req.params as any).projectId, 10);
    const { id } = req.params;
    try {
        const comments = await TasksService.getComments(email, projectId, id);
        res.json(comments);
    } catch (e: any) {
        res.status(403).json({ message: e.message });
    }
});

// POST /api/projects/:projectId/tasks/:id/comments
router.post('/:id/comments', async (req, res) => {
    const email = req.user!.email;
    const projectId = parseInt((req.params as any).projectId, 10);
    const { id } = req.params;
    const { content } = req.body;
    try {
        const comment = await TasksService.addComment(email, projectId, id, content);
        res.status(201).json(comment);
    } catch (e: any) {
        res.status(403).json({ message: e.message });
    }
});

// DELETE /api/projects/:projectId/tasks/:id/comments/:commentId
router.delete('/:id/comments/:commentId', async (req, res) => {
    const email = req.user!.email;
    const projectId = parseInt((req.params as any).projectId, 10);
    const commentId = parseInt(req.params.commentId, 10);
    try {
        await TasksService.deleteComment(email, projectId, commentId);
        res.status(204).send();
    } catch (e: any) {
        res.status(403).json({ message: e.message });
    }
});

export default router;
