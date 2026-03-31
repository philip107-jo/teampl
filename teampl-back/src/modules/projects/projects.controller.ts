import { Router } from 'express';
import { ProjectsService } from './projects.service';
import { TasksService } from '../tasks/tasks.service';

const router = Router();

// GET /api/projects
router.get('/', async (req, res) => {
    const email = req.header('X-User-Email') || '';
    const projects = await ProjectsService.getAll(email);
    res.json(projects);
});

// POST /api/projects
router.post('/', async (req, res) => {
    const email = req.header('X-User-Email') || '';
    const newProject = await ProjectsService.create(email, req.body);
    res.status(201).json(newProject);
});

// PATCH /api/projects/:id
router.patch('/:id', async (req, res) => {
    const email = req.header('X-User-Email') || '';
    const id = parseInt(req.params.id, 10);
    const updated = await ProjectsService.update(email, id, req.body);
    if (!updated) return res.status(404).json({ message: 'Project not found' });
    res.json(updated);
});

// DELETE /api/projects/:id
router.delete('/:id', async (req, res) => {
    const email = req.header('X-User-Email') || '';
    const id = parseInt(req.params.id, 10);
    const success = await ProjectsService.delete(email, id);
    if (!success) return res.status(404).json({ message: 'Project not found' });

    // CASCADE delete tasks associated with this project
    await TasksService.deleteByWorkspaceId(email, id.toString());

    res.status(204).send();
});

export default router;
