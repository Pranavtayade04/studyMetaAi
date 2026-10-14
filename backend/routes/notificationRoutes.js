import express from 'express';
import protect from '../middleware/auth.js';
import {
  listNotifications,
  markAsRead,
  clearNotifications,
} from '../controllers/notificationController.js';

const router = express.Router();

router.use(protect);
router.get('/', listNotifications);
router.put('/:id/read', markAsRead);
router.put('/read-all', (req, res, next) => {
  req.params.id = 'all';
  return markAsRead(req, res, next);
});
router.delete('/', clearNotifications);

export default router;
