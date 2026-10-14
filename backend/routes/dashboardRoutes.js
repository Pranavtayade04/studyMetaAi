import express from 'express';
import protect from '../middleware/auth.js';
import { getProgress, getSummary } from '../controllers/dashboardController.js';

const router = express.Router();

router.get('/summary', protect, getSummary);
router.get('/progress', protect, getProgress);

export default router;
