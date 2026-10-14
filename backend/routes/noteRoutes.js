import express from 'express';
import protect from '../middleware/auth.js';
import { createNote, deleteNote, listNotes, updateNote } from '../controllers/noteController.js';

const router = express.Router();

router.use(protect);
router.get('/', listNotes);
router.post('/', createNote);
router.put('/:id', updateNote);
router.delete('/:id', deleteNote);

export default router;
