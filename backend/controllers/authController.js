import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import Note from '../models/Note.js';
import Quiz from '../models/Quiz.js';
import Subject from '../models/Subject.js';
import ActivityLog from '../models/ActivityLog.js';
import Notification from '../models/Notification.js';
import generateToken from '../utils/generateToken.js';
import recordActivity from '../utils/recordActivity.js';
import createNotification from '../utils/createNotification.js';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// POST /api/auth/signup
export async function signup(req, res) {
  try {
    const { name, email, password } = req.body || {};

    // --- Validation ---
    if (!name || typeof name !== 'string' || !name.trim() || name.trim().length > 80) {
      return res.status(400).json({ message: 'Please enter your full name (1-80 characters).' });
    }
    const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
    if (!normalizedEmail || !EMAIL_REGEX.test(normalizedEmail)) {
      return res.status(400).json({ message: 'Please enter a valid email address.' });
    }
    if (!password || typeof password !== 'string' || password.length < 6 || password.length > 128) {
      return res.status(400).json({
        message: 'Password must be between 6 and 128 characters long.',
      });
    }

    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      return res.status(409).json({
        message: 'An account with this email already exists. Try logging in instead.',
      });
    }

    // --- Hash the password (never store plain text) ---
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      passwordHash,
      preferences: {
        language: 'English',
        dailyReminder: true,
        weeklyReport: false,
      },
    });

    await recordActivity(user._id, 'auth', 'Created StudyMeta account');
    await createNotification(user._id, 'system', 'Welcome to StudyMeta AI! Start your learning journey.');

    const token = generateToken(user);
    return res.status(201).json({ token, user: user.toPublicJSON() });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        message: 'An account with this email already exists. Try logging in instead.',
      });
    }
    console.error('Signup error:', error);
    return res.status(500).json({ message: 'Something went wrong while creating your account.' });
  }
}

// POST /api/auth/login
export async function login(req, res) {
  try {
    const { email, password } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({ message: 'Please enter your email and password.' });
    }

    const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    await recordActivity(user._id, 'auth', 'Logged in to StudyMeta');

    const token = generateToken(user);
    return res.json({ token, user: user.toPublicJSON() });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ message: 'Something went wrong while logging in.' });
  }
}

// GET /api/auth/me  (protected — requires a valid JWT)
export async function me(req, res) {
  return res.json({ user: req.user.toPublicJSON() });
}

// PUT /api/auth/profile  (protected — updates name/email)
export async function updateProfile(req, res) {
  try {
    const { name, email } = req.body || {};

    if (!name || typeof name !== 'string' || !name.trim() || name.trim().length > 80) {
      return res.status(400).json({ message: 'Please enter your full name (1-80 characters).' });
    }

    const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
    if (!normalizedEmail || !EMAIL_REGEX.test(normalizedEmail)) {
      return res.status(400).json({ message: 'Please enter a valid email address.' });
    }

    const userWithSameEmail = await User.findOne({
      email: normalizedEmail,
      _id: { $ne: req.user._id },
    });

    if (userWithSameEmail) {
      return res.status(409).json({
        message: 'An account with this email already exists. Try another email.',
      });
    }

    req.user.name = name.trim();
    req.user.email = normalizedEmail;
    await req.user.save();

    await recordActivity(req.user._id, 'auth', 'Updated profile information');
    return res.json({ user: req.user.toPublicJSON() });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        message: 'An account with this email already exists. Try another email.',
      });
    }
    console.error('Update profile error:', error);
    return res.status(500).json({ message: 'Something went wrong while updating your profile.' });
  }
}

// PUT /api/auth/preferences (protected — updates user learning preferences)
export async function updatePreferences(req, res) {
  try {
    const { language, dailyReminder, weeklyReport } = req.body || {};

    if (language !== undefined) {
      if (!['English', 'Hindi', 'Marathi'].includes(language)) {
        return res.status(400).json({ message: 'Language must be English, Hindi, or Marathi.' });
      }
      req.user.preferences.language = language;
    }

    if (dailyReminder !== undefined) {
      req.user.preferences.dailyReminder = Boolean(dailyReminder);
    }

    if (weeklyReport !== undefined) {
      req.user.preferences.weeklyReport = Boolean(weeklyReport);
    }

    req.user.markModified('preferences');
    await req.user.save();

    await recordActivity(req.user._id, 'auth', 'Updated learning preferences');
    return res.json({ user: req.user.toPublicJSON() });
  } catch (error) {
    console.error('Update preferences error:', error);
    return res.status(500).json({ message: 'Could not update preferences.' });
  }
}

// DELETE /api/auth/account (protected — deletes account and cascades to all user data)
export async function deleteAccount(req, res) {
  try {
    const userId = req.user._id;

    await Promise.all([
      Note.deleteMany({ userId }),
      Quiz.deleteMany({ userId }),
      Subject.deleteMany({ userId }),
      ActivityLog.deleteMany({ userId }),
      Notification.deleteMany({ userId }),
      User.findByIdAndDelete(userId),
    ]);

    return res.json({ message: 'Account and associated data deleted successfully.' });
  } catch (error) {
    console.error('Delete account error:', error);
    return res.status(500).json({ message: 'Could not delete your account.' });
  }
}
