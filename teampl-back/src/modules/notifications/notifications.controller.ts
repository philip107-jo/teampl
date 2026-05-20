import { Router } from 'express';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { NotificationsService } from './notifications.service';

const router = Router();
router.use(authMiddleware);

// GET /api/notifications
router.get('/', async (req, res) => {
  try {
    const notifications = await NotificationsService.getNotifications(req.user!.email);
    res.json(notifications);
  } catch (e: any) {
    res.status(500).json({ message: e.message });
  }
});

// PATCH /api/notifications/read-all
router.patch('/read-all', async (req, res) => {
  try {
    await NotificationsService.markAllAsRead(req.user!.email);
    res.status(200).send();
  } catch (e: any) {
    res.status(500).json({ message: e.message });
  }
});

// PATCH /api/notifications/:id/read
router.patch('/:id/read', async (req, res) => {
  try {
    const notificationId = parseInt(req.params.id, 10);
    await NotificationsService.markAsRead(req.user!.email, notificationId);
    res.status(200).send();
  } catch (e: any) {
    res.status(500).json({ message: e.message });
  }
});

// GET /api/notifications/vapid-public-key
router.get('/vapid-public-key', (req, res) => {
  res.json({ publicKey: process.env.VAPID_PUBLIC_KEY || 'BAOx6TgJVwefwaj42jgCoFmYQNLjZJkW-JtoICpVZIuBA-5A-I33HzO3hmur04kdsTBd2Xpy21_5W5LSE3LumT4' });
});

// POST /api/notifications/subscribe
router.post('/subscribe', async (req, res) => {
  try {
    const subscription = req.body;
    await NotificationsService.subscribePush(req.user!.email, subscription);
    res.status(201).json({});
  } catch (e: any) {
    res.status(500).json({ message: e.message });
  }
});

// DELETE /api/notifications/unsubscribe
router.delete('/unsubscribe', async (req, res) => {
  try {
    const { endpoint } = req.body;
    await NotificationsService.unsubscribePush(req.user!.email, endpoint);
    res.status(204).send();
  } catch (e: any) {
    res.status(500).json({ message: e.message });
  }
});

export default router;
