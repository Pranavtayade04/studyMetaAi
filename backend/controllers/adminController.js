import ActivityLog from '../models/ActivityLog.js';
import Note from '../models/Note.js';
import Quiz from '../models/Quiz.js';
import Subject from '../models/Subject.js';
import User from '../models/User.js';

export async function getOverview(req, res) {
  try {
    const [userCount, noteCount, subjectCount, quizCount, users, activity] = await Promise.all([
      User.countDocuments(),
      Note.countDocuments(),
      Subject.countDocuments(),
      Quiz.countDocuments({ completedAt: { $ne: null } }),
      User.find()
        .select('name email role createdAt')
        .sort({ createdAt: -1 })
        .limit(50)
        .lean(),
      ActivityLog.find()
        .sort({ createdAt: -1 })
        .limit(10)
        .populate('userId', 'name email')
        .lean(),
    ]);

    return res.json({
      stats: {
        users: userCount,
        notes: noteCount,
        subjects: subjectCount,
        completedQuizzes: quizCount,
      },
      users: users.map((user) => ({
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        joinedAt: user.createdAt,
      })),
      recentActivity: activity.map((item) => ({
        id: item._id,
        user: item.userId
          ? { name: item.userId.name, email: item.userId.email }
          : { name: 'Deleted account', email: '' },
        type: item.type,
        text: item.text,
        timestamp: item.createdAt,
      })),
    });
  } catch (error) {
    console.error('Admin overview error:', error);
    return res.status(500).json({ message: 'Could not load admin overview.' });
  }
}
