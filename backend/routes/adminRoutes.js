import express from 'express';
import { getOverview } from '../controllers/adminController.js';
import adminOnly from '../middleware/adminOnly.js';
import protect from '../middleware/auth.js';

const router = express.Router();

router.get('/overview', protect, adminOnly, getOverview);

export default router;
