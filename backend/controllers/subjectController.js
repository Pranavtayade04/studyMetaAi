import mongoose from 'mongoose';
import Subject from '../models/Subject.js';
import recordActivity from '../utils/recordActivity.js';
import createNotification from '../utils/createNotification.js';

const COLORS = ['#796bff', '#3cb99b', '#f09b5b', '#e06b91', '#e39c44', '#4b9bdb'];

function validateSubject({ name, description, lessonCount, progressPercent }) {
  if (typeof name !== 'string' || !name.trim() || name.trim().length > 80) {
    return 'Enter a subject name between 1 and 80 characters.';
  }
  if (
    description !== undefined &&
    (typeof description !== 'string' || description.trim().length > 500)
  ) {
    return 'Description must be 500 characters or fewer.';
  }
  if (
    lessonCount !== undefined &&
    (!Number.isInteger(lessonCount) || lessonCount < 0 || lessonCount > 10000)
  ) {
    return 'Lesson count must be a whole number between 0 and 10,000.';
  }
  if (
    progressPercent !== undefined &&
    (!Number.isInteger(progressPercent) || progressPercent < 0 || progressPercent > 100)
  ) {
    return 'Progress must be a whole number between 0 and 100.';
  }
  return null;
}

function subjectJSON(subject) {
  return {
    id: subject._id,
    name: subject.name,
    description: subject.description,
    lessonCount: subject.lessonCount,
    progressPercent: subject.progressPercent,
    color: subject.color,
    createdAt: subject.createdAt,
    updatedAt: subject.updatedAt,
  };
}

export async function listSubjects(req, res) {
  try {
    const subjects = await Subject.find({ userId: req.user._id })
      .sort({ name: 1 })
      .lean();
    return res.json({ subjects: subjects.map(subjectJSON) });
  } catch (error) {
    console.error('List subjects error:', error);
    return res.status(500).json({ message: 'Could not load your subjects.' });
  }
}

export async function createSubject(req, res) {
  const validationError = validateSubject(req.body || {});
  if (validationError) return res.status(400).json({ message: validationError });

  try {
    const existing = await Subject.findOne({
      userId: req.user._id,
      name: req.body.name.trim(),
    });
    if (existing) {
      return res.status(409).json({ message: 'You already have a subject with that name.' });
    }

    const subject = await Subject.create({
      userId: req.user._id,
      name: req.body.name.trim(),
      description: req.body.description?.trim() || '',
      lessonCount: req.body.lessonCount ?? 0,
      progressPercent: req.body.progressPercent ?? 0,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
    });
    await recordActivity(req.user._id, 'subjects', `Added subject: ${subject.name}`);
    await createNotification(req.user._id, 'subjects', `Added subject: ${subject.name}`);
    return res.status(201).json({ subject: subjectJSON(subject) });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: 'You already have a subject with that name.' });
    }
    console.error('Create subject error:', error);
    return res.status(500).json({ message: 'Could not create your subject.' });
  }
}

export async function updateSubject(req, res) {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ message: 'Invalid subject ID.' });
  }
  const validationError = validateSubject(req.body || {});
  if (validationError) return res.status(400).json({ message: validationError });

  try {
    const subject = await Subject.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      {
        name: req.body.name.trim(),
        description: req.body.description?.trim() || '',
        lessonCount: req.body.lessonCount ?? 0,
        progressPercent: req.body.progressPercent ?? 0,
      },
      { new: true, runValidators: true }
    );
    if (!subject) return res.status(404).json({ message: 'Subject not found.' });
    await recordActivity(req.user._id, 'subjects', `Updated subject: ${subject.name}`);
    return res.json({ subject: subjectJSON(subject) });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: 'You already have a subject with that name.' });
    }
    console.error('Update subject error:', error);
    return res.status(500).json({ message: 'Could not update your subject.' });
  }
}

export async function deleteSubject(req, res) {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ message: 'Invalid subject ID.' });
  }

  try {
    const subject = await Subject.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id,
    });
    if (!subject) return res.status(404).json({ message: 'Subject not found.' });
    await recordActivity(req.user._id, 'subjects', `Deleted subject: ${subject.name}`);
    return res.json({ message: 'Subject deleted.' });
  } catch (error) {
    console.error('Delete subject error:', error);
    return res.status(500).json({ message: 'Could not delete your subject.' });
  }
}
