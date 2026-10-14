import express from 'express';
import protect from '../middleware/auth.js';
import {
  createSubject,
  deleteSubject,
  listSubjects,
  updateSubject,
} from '../controllers/subjectController.js';

const router = express.Router();

router.use(protect);
router.get('/', listSubjects);
router.post('/', createSubject);
router.put('/:id', updateSubject);
router.delete('/:id', deleteSubject);

export default router;
