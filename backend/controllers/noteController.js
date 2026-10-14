import mongoose from 'mongoose';
import Note from '../models/Note.js';
import recordActivity from '../utils/recordActivity.js';
import createNotification from '../utils/createNotification.js';

const COLORS = ['#e06b91', '#3cb99b', '#796bff', '#e39c44', '#4b9bdb'];
const MAX_SEARCH_LENGTH = 100;

function validateNoteFields({ title, body, subject }) {
  if (typeof title !== 'string' || !title.trim() || title.trim().length > 120) {
    return 'Enter a note title between 1 and 120 characters.';
  }
  if (typeof body !== 'string' || !body.trim() || body.trim().length > 10000) {
    return 'Enter note content between 1 and 10,000 characters.';
  }
  if (typeof subject !== 'string' || !subject.trim() || subject.trim().length > 80) {
    return 'Enter a subject between 1 and 80 characters.';
  }
  return null;
}

function userNoteQuery(req, id) {
  if (!mongoose.isValidObjectId(id)) return null;
  return { _id: id, userId: req.user._id };
}

export async function listNotes(req, res) {
  try {
    const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';
    const subject = typeof req.query.subject === 'string' ? req.query.subject.trim() : '';

    if (search.length > MAX_SEARCH_LENGTH) {
      return res.status(400).json({ message: 'Search text must be 100 characters or fewer.' });
    }

    const filter = { userId: req.user._id };
    if (subject && subject !== 'All subjects') filter.subject = subject;
    if (search) {
      const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.$or = [
        { title: { $regex: escaped, $options: 'i' } },
        { body: { $regex: escaped, $options: 'i' } },
        { subject: { $regex: escaped, $options: 'i' } },
      ];
    }

    const notes = await Note.find(filter).sort({ updatedAt: -1 }).lean();
    return res.json({
      notes: notes.map((note) => ({
        id: note._id,
        title: note.title,
        body: note.body,
        subject: note.subject,
        color: note.color,
        createdAt: note.createdAt,
        updatedAt: note.updatedAt,
      })),
    });
  } catch (error) {
    console.error('List notes error:', error);
    return res.status(500).json({ message: 'Could not load your notes.' });
  }
}

export async function createNote(req, res) {
  try {
    const validationError = validateNoteFields(req.body || {});
    if (validationError) return res.status(400).json({ message: validationError });

    const note = await Note.create({
      userId: req.user._id,
      title: req.body.title.trim(),
      body: req.body.body.trim(),
      subject: req.body.subject.trim(),
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
    });
    await recordActivity(req.user._id, 'notes', `Created a note in ${note.subject}`);
    await createNotification(req.user._id, 'notes', `Created note: "${note.title}" in ${note.subject}`);

    return res.status(201).json({
      note: {
        id: note._id,
        title: note.title,
        body: note.body,
        subject: note.subject,
        color: note.color,
        createdAt: note.createdAt,
        updatedAt: note.updatedAt,
      },
    });
  } catch (error) {
    console.error('Create note error:', error);
    return res.status(500).json({ message: 'Could not create your note.' });
  }
}

export async function updateNote(req, res) {
  const query = userNoteQuery(req, req.params.id);
  if (!query) return res.status(400).json({ message: 'Invalid note ID.' });

  const validationError = validateNoteFields(req.body || {});
  if (validationError) return res.status(400).json({ message: validationError });

  try {
    const note = await Note.findOneAndUpdate(
      query,
      {
        title: req.body.title.trim(),
        body: req.body.body.trim(),
        subject: req.body.subject.trim(),
      },
      { new: true, runValidators: true }
    ).lean();

    if (!note) return res.status(404).json({ message: 'Note not found.' });
    await recordActivity(req.user._id, 'notes', `Updated a note in ${note.subject}`);

    return res.json({
      note: {
        id: note._id,
        title: note.title,
        body: note.body,
        subject: note.subject,
        color: note.color,
        createdAt: note.createdAt,
        updatedAt: note.updatedAt,
      },
    });
  } catch (error) {
    console.error('Update note error:', error);
    return res.status(500).json({ message: 'Could not update your note.' });
  }
}

export async function deleteNote(req, res) {
  const query = userNoteQuery(req, req.params.id);
  if (!query) return res.status(400).json({ message: 'Invalid note ID.' });

  try {
    const note = await Note.findOneAndDelete(query);
    if (!note) return res.status(404).json({ message: 'Note not found.' });
    await recordActivity(req.user._id, 'notes', `Deleted a note in ${note.subject}`);
    return res.json({ message: 'Note deleted.' });
  } catch (error) {
    console.error('Delete note error:', error);
    return res.status(500).json({ message: 'Could not delete your note.' });
  }
}
