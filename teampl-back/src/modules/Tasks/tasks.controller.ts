import { Router } from 'express';
import { TasksService } from './tasks.service';

const router = Router();

// GET /api/tasks
router.get('/', async (req, res) => {
  const email = req.header('X-User-Email') || '';
  const tasks = await TasksService.getAll(email);
  res.json(tasks);
});

// POST /api/tasks
router.post('/', async (req, res) => {
  const email = req.header('X-User-Email') || '';
  const newTask = await TasksService.create(email, req.body);
  res.status(201).json(newTask);
});

// PATCH /api/tasks/:id/status
router.patch('/:id', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const email = req.header('X-User-Email') || '';

  const updatedTask = await TasksService.updateStatus(email, id, status);
  if (!updatedTask) {
    return res.status(404).json({ message: 'Task not found' });
  }

  res.json(updatedTask);
});

export default router;
