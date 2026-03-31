import { Router } from 'express';
import { SchedulesService } from './schedules.service';

const router = Router();

router.get('/', (req, res) => {
  const email = req.header('X-User-Email') || '';
  const schedules = SchedulesService.getAll(email);
  res.json(schedules);
});

router.post('/', (req, res) => {
  const email = req.header('X-User-Email') || '';
  const newSchedule = SchedulesService.create(email, req.body);
  res.status(201).json(newSchedule);
});

router.patch('/:id', (req, res) => {
  const email = req.header('X-User-Email') || '';
  const id = parseInt(req.params.id, 10);
  const updated = SchedulesService.update(email, id, req.body);
  if (!updated) return res.status(404).json({ message: 'Schedule not found' });
  res.json(updated);
});

router.delete('/:id', (req, res) => {
  const email = req.header('X-User-Email') || '';
  const id = parseInt(req.params.id, 10);
  const success = SchedulesService.delete(email, id);
  if (!success) return res.status(404).json({ message: 'Schedule not found' });
  res.status(204).send();
});

export default router;
