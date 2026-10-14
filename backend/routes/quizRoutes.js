import express from 'express';
import protect from '../middleware/auth.js';
import { generateQuiz, gradeQuiz } from '../controllers/quizController.js';

const router = express.Router();

router.post('/generate', protect, generateQuiz);
router.post('/grade', protect, gradeQuiz);

export default router;
