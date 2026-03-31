import { Router } from 'express';
import { ProjectsService } from './projects.service';
import { TasksService } from '../tasks/tasks.service';

const router = Router();

// GET /api/projects
router.get('/', (req, res) => {
    const email = req.header('X-User-Email') || '';
    const projects = ProjectsService.getAll(email);
    res.json(projects);
});

// POST /api/projects
router.post('/', (req, res) => {
    const email = req.header('X-User-Email') || '';
    const newProject = ProjectsService.create(email, req.body);
    res.status(201).json(newProject);
});

// POST /api/projects/join
router.post('/join', (req, res) => {
    const email = req.header('X-User-Email') || '';
    const { inviteCode, userName } = req.body;
    if (!inviteCode) return res.status(400).json({ message: 'Invite code is required' });
    
    const joinedProject = ProjectsService.join(email, inviteCode, userName);
    if (!joinedProject) return res.status(404).json({ message: 'Invalid invite code or project not found' });
    
    res.status(200).json(joinedProject);
});

// PATCH /api/projects/:id
router.patch('/:id', (req, res) => {
    const email = req.header('X-User-Email') || '';
    const id = parseInt(req.params.id, 10);
    const updated = ProjectsService.update(email, id, req.body);
    if (!updated) return res.status(404).json({ message: 'Project not found' });
    res.json(updated);
});

// DELETE /api/projects/:id
router.delete('/:id', (req, res) => {
    const email = req.header('X-User-Email') || '';
    const id = parseInt(req.params.id, 10);
    const success = ProjectsService.delete(email, id);
    if (!success) return res.status(404).json({ message: 'Project not found' });

    // CASCADE delete tasks associated with this project
    TasksService.deleteByWorkspaceId(email, id.toString());

    res.status(204).send();
});

export default router;
