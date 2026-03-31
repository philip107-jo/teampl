import { Router } from 'express';
import { TasksService } from './tasks.service';

const router = Router();

// GET /api/tasks
router.get('/', (req, res) => {
  const email = req.header('X-User-Email') || '';
  const tasks = TasksService.getAll(email);
  res.json(tasks);
});

// POST /api/tasks
router.post('/', (req, res) => {
  const email = req.header('X-User-Email') || '';
  const newTask = TasksService.create(email, req.body);
  res.status(201).json(newTask);
});

// PATCH /api/tasks/:id/status
router.patch('/:id', (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const email = req.header('X-User-Email') || '';

  const updatedTask = TasksService.updateStatus(email, id, status);
  if (!updatedTask) {
    return res.status(404).json({ message: 'Task not found' });
  }

  res.json(updatedTask);
});

export default router;
