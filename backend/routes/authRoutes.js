import express from 'express';
import { signup, login, me, updateProfile, updatePreferences, deleteAccount } from '../controllers/authController.js';
import protect from '../middleware/auth.js';

const router = express.Router();

router.post('/signup', signup);
router.post('/login', login);
router.get('/me', protect, me);
router.put('/profile', protect, updateProfile);
router.put('/preferences', protect, updatePreferences);
router.delete('/account', protect, deleteAccount);

export default router;
