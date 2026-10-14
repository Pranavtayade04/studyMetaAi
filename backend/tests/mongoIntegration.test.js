import assert from 'node:assert/strict';
import test, { after, before } from 'node:test';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';

import User from '../models/User.js';
import Note from '../models/Note.js';
import Quiz from '../models/Quiz.js';
import Subject from '../models/Subject.js';
import ActivityLog from '../models/ActivityLog.js';
import Notification from '../models/Notification.js';

import { signup, login, updatePreferences, deleteAccount } from '../controllers/authController.js';
import { createNote, listNotes, updateNote, deleteNote } from '../controllers/noteController.js';
import { generateQuiz, gradeQuiz } from '../controllers/quizController.js';
import { getSummary } from '../controllers/dashboardController.js';
import { listNotifications, markAsRead } from '../controllers/notificationController.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

function mockRes() {
  return {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
  };
}

before(async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/studymate';
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(uri);
  }
});

after(async () => {
  try {
    const testUsers = await User.find({
      email: { $regex: /^test\.(integration|user[ab])\./i },
    }).select('_id');
    const userIds = testUsers.map(({ _id }) => _id);

    await Promise.all([
      Note.deleteMany({ userId: { $in: userIds } }),
      Quiz.deleteMany({ userId: { $in: userIds } }),
      Subject.deleteMany({ userId: { $in: userIds } }),
      ActivityLog.deleteMany({ userId: { $in: userIds } }),
      Notification.deleteMany({ userId: { $in: userIds } }),
      User.deleteMany({ _id: { $in: userIds } }),
    ]);
  } finally {
    await mongoose.disconnect();
  }
});

test('Real MongoDB Integration: Full End-to-End Persistence Workflow', async (t) => {
  const testEmailA = `test.userA.${Date.now()}@example.com`;
  const testEmailB = `test.userB.${Date.now()}@example.com`;
  let userA = null;
  let userB = null;
  let tokenA = null;
  let noteA = null;
  let quizIdA = null;

  await t.test('1. User Registration stores user in MongoDB with bcrypt password hash', async () => {
    const res = mockRes();
    await signup(
      {
        body: {
          name: 'Integration User A',
          email: `  ${testEmailA.toUpperCase()}  `, // Test normalization & trimming
          password: 'SecretPassword123!',
        },
      },
      res
    );

    assert.equal(res.statusCode, 201);
    assert.ok(res.body.token);
    assert.equal(res.body.user.email, testEmailA.toLowerCase());
    assert.equal(res.body.user.name, 'Integration User A');
    assert.equal(res.body.user.passwordHash, undefined, 'Password hash must never be in API response');

    tokenA = res.body.token;

    // Verify document exists in real MongoDB
    const doc = await User.findOne({ email: testEmailA.toLowerCase() });
    assert.ok(doc, 'User must exist in MongoDB users collection');
    assert.equal(doc.name, 'Integration User A');
    assert.notEqual(doc.passwordHash, 'SecretPassword123!', 'Password must NOT be stored in plaintext');
    const isValidHash = await bcrypt.compare('SecretPassword123!', doc.passwordHash);
    assert.ok(isValidHash, 'Stored password hash must verify with bcrypt');
    assert.ok(doc.preferences, 'User preferences must be initialized');

    userA = doc;
  });

  await t.test('2. Prevents duplicate registrations with 409 Conflict', async () => {
    const res = mockRes();
    await signup(
      {
        body: {
          name: 'Duplicate User',
          email: testEmailA.toLowerCase(),
          password: 'AnotherPassword123!',
        },
      },
      res
    );

    assert.equal(res.statusCode, 409);
    assert.match(res.body.message, /already exists/i);
  });

  await t.test('3. Login verifies password and rejects invalid credentials', async () => {
    // Bad password
    const failRes = mockRes();
    await login(
      {
        body: {
          email: testEmailA,
          password: 'WrongPassword!',
        },
      },
      failRes
    );
    assert.equal(failRes.statusCode, 401);

    // Correct password
    const successRes = mockRes();
    await login(
      {
        body: {
          email: testEmailA,
          password: 'SecretPassword123!',
        },
      },
      successRes
    );
    assert.equal(successRes.statusCode, 200);
    assert.ok(successRes.body.token);
    assert.equal(successRes.body.user.id.toString(), userA._id.toString());
  });

  await t.test('4. Register User B to test cross-user data isolation', async () => {
    const res = mockRes();
    await signup(
      {
        body: {
          name: 'Integration User B',
          email: testEmailB,
          password: 'SecretPassword456!',
        },
      },
      res
    );
    assert.equal(res.statusCode, 201);
    userB = await User.findOne({ email: testEmailB.toLowerCase() });
    assert.ok(userB);
  });

  await t.test('5. Create Study Note and verify persistence in MongoDB', async () => {
    const res = mockRes();
    await createNote(
      {
        user: userA,
        body: {
          title: 'MongoDB Schema Design',
          body: 'Embedding vs Referencing best practices in NoSQL databases.',
          subject: 'Database Systems',
        },
      },
      res
    );

    assert.equal(res.statusCode, 201);
    assert.ok(res.body.note.id);
    assert.equal(res.body.note.title, 'MongoDB Schema Design');
    noteA = res.body.note;

    // Verify in MongoDB directly
    const noteDoc = await Note.findById(noteA.id);
    assert.ok(noteDoc);
    assert.equal(noteDoc.userId.toString(), userA._id.toString());
    assert.equal(noteDoc.title, 'MongoDB Schema Design');

    // Verify activity was recorded
    const activity = await ActivityLog.findOne({ userId: userA._id, type: 'notes' });
    assert.ok(activity);

    // Verify notification was recorded
    const notif = await Notification.findOne({ userId: userA._id, type: 'notes' });
    assert.ok(notif);
  });

  await t.test('6. Cross-user isolation: User B cannot access or modify User A note', async () => {
    // User B tries to update User A's note
    const updateRes = mockRes();
    await updateNote(
      {
        user: userB,
        params: { id: noteA.id },
        body: {
          title: 'Hacked Title',
          body: 'Malicious body',
          subject: 'Database Systems',
        },
      },
      updateRes
    );
    assert.equal(updateRes.statusCode, 404, 'User B must not find or modify User A note');

    // User B lists notes
    const listRes = mockRes();
    await listNotes(
      {
        user: userB,
        query: {},
      },
      listRes
    );
    assert.equal(listRes.statusCode, 200);
    assert.equal(listRes.body.notes.length, 0, 'User B should see 0 notes');

    // User A lists notes
    const listARes = mockRes();
    await listNotes(
      {
        user: userA,
        query: {},
      },
      listARes
    );
    assert.equal(listARes.statusCode, 200);
    assert.equal(listARes.body.notes.length, 1);
    assert.equal(listARes.body.notes[0].title, 'MongoDB Schema Design');
  });

  await t.test('7. Create and Grade Quiz, verifying database persistence', async () => {
    const prevKey = process.env.GEMINI_API_KEY;
    delete process.env.GEMINI_API_KEY;

    try {
      // Generate quiz
      const genRes = mockRes();
      await generateQuiz(
        {
          user: userA,
          body: {
            subject: 'Database Systems',
            difficulty: 'Easy',
            count: 5,
          },
        },
        genRes
      );

      assert.equal(genRes.statusCode, 201);
      assert.ok(genRes.body.quizId);
      assert.equal(genRes.body.questions.length, 5);
      quizIdA = genRes.body.quizId;

      // Verify in MongoDB
      const quizDoc = await Quiz.findById(quizIdA);
      assert.ok(quizDoc);
      assert.equal(quizDoc.completedAt, null);
      assert.equal(quizDoc.userId.toString(), userA._id.toString());

      // Grade quiz (submit answers)
      const gradeRes = mockRes();
      const correctAnswers = quizDoc.questions.map((q) => q.correctIndex);
      await gradeQuiz(
        {
          user: userA,
          body: {
            quizId: quizIdA.toString(),
            answers: correctAnswers,
          },
        },
        gradeRes
      );

      assert.equal(gradeRes.statusCode, 200);
      assert.equal(gradeRes.body.score, 5);
      assert.equal(gradeRes.body.total, 5);

      // Verify persistence in MongoDB
      const gradedDoc = await Quiz.findById(quizIdA);
      assert.ok(gradedDoc.completedAt);
      assert.equal(gradedDoc.score, 5);
      assert.deepEqual(gradedDoc.answers, correctAnswers);
    } finally {
      process.env.GEMINI_API_KEY = prevKey;
    }
  });

  await t.test('8. Dashboard summary shows real streak and real latest quiz score', async () => {
    const summaryRes = mockRes();
    await getSummary({ user: userA }, summaryRes);

    assert.equal(summaryRes.statusCode, 200);
    assert.ok(summaryRes.body.streak >= 1);
    assert.equal(summaryRes.body.quiz.hasAttempts, true);
    assert.equal(summaryRes.body.quiz.percentage, 100);
    assert.equal(summaryRes.body.quiz.subject, 'Database Systems');
  });

  await t.test('9. User preferences and profile persistence in MongoDB', async () => {
    const prefRes = mockRes();
    await updatePreferences(
      {
        user: userA,
        body: {
          language: 'Hindi',
          dailyReminder: false,
          weeklyReport: true,
        },
      },
      prefRes
    );

    assert.equal(prefRes.statusCode, 200);
    assert.equal(prefRes.body.user.preferences.language, 'Hindi');
    assert.equal(prefRes.body.user.preferences.dailyReminder, false);
    assert.equal(prefRes.body.user.preferences.weeklyReport, true);

    // Verify in MongoDB document
    const updatedUser = await User.findById(userA._id);
    assert.equal(updatedUser.preferences.language, 'Hindi');
    assert.equal(updatedUser.preferences.dailyReminder, false);
    assert.equal(updatedUser.preferences.weeklyReport, true);
  });

  await t.test('10. Notifications persistence and mark as read', async () => {
    const listRes = mockRes();
    await listNotifications({ user: userA }, listRes);

    assert.equal(listRes.statusCode, 200);
    assert.ok(listRes.body.notifications.length >= 1);
    const unread = listRes.body.unreadCount;
    assert.ok(unread > 0);

    const firstNotifId = listRes.body.notifications[0].id;
    const readRes = mockRes();
    await markAsRead({ user: userA, params: { id: firstNotifId } }, readRes);
    assert.equal(readRes.statusCode, 200);

    const doc = await Notification.findById(firstNotifId);
    assert.equal(doc.read, true);
  });

  await t.test('11. Delete Account cascades to delete all user data', async () => {
    const delRes = mockRes();
    await deleteAccount({ user: userA }, delRes);
    assert.equal(delRes.statusCode, 200);

    // Verify user is gone from MongoDB
    const checkUser = await User.findById(userA._id);
    assert.equal(checkUser, null);

    // Verify all associated data was cascaded
    const notesCount = await Note.countDocuments({ userId: userA._id });
    const quizzesCount = await Quiz.countDocuments({ userId: userA._id });
    const activityCount = await ActivityLog.countDocuments({ userId: userA._id });
    const notifsCount = await Notification.countDocuments({ userId: userA._id });

    assert.equal(notesCount, 0, 'User notes must be deleted');
    assert.equal(quizzesCount, 0, 'User quizzes must be deleted');
    assert.equal(activityCount, 0, 'User activity logs must be deleted');
    assert.equal(notifsCount, 0, 'User notifications must be deleted');
  });
});
