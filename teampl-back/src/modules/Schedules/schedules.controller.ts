import { Router } from 'express';
import { SchedulesService } from './schedules.service';
import { authMiddleware } from '../../middlewares/auth.middleware';

const router = Router();
router.use(authMiddleware);

router.get('/', async (req, res) => {
  const email = req.user!.email;
  const schedules = await SchedulesService.getAll(email);
  res.json(schedules);
});

router.post('/', async (req, res) => {
  const email = req.user!.email;
  const newSchedule = await SchedulesService.create(email, req.body);
  res.status(201).json(newSchedule);
});

router.patch('/:id', async (req, res) => {
  const email = req.user!.email;
  const id = parseInt(req.params.id, 10);
  const updated = await SchedulesService.update(email, id, req.body);
  if (!updated) return res.status(404).json({ message: 'Schedule not found' });
  res.json(updated);
});

router.delete('/:id', async (req, res) => {
  const email = req.user!.email;
  const id = parseInt(req.params.id, 10);
  const success = await SchedulesService.delete(email, id);
  if (!success) return res.status(404).json({ message: 'Schedule not found' });
  res.status(204).send();
});

export default router;
