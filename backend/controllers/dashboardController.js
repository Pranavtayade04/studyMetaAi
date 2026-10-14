import ActivityLog from '../models/ActivityLog.js';
import Quiz from '../models/Quiz.js';
import Subject from '../models/Subject.js';

function startOfUtcDay(date) {
  const value = new Date(date);
  value.setUTCHours(0, 0, 0, 0);
  return value;
}

export async function getSummary(req, res) {
  try {
    const user = req.user;
    const today = startOfUtcDay(new Date());
    const lastActive = user.lastActiveDate
      ? startOfUtcDay(user.lastActiveDate)
      : null;

    if (!lastActive) {
      user.currentStreak = 1;
      user.lastActiveDate = today;
    } else {
      const dayMs = 24 * 60 * 60 * 1000;
      const daysSinceLastActive = Math.round(
        (today.getTime() - lastActive.getTime()) / dayMs
      );

      if (daysSinceLastActive === 1) {
        user.currentStreak = Math.max(1, user.currentStreak || 0) + 1;
        user.lastActiveDate = today;
      } else if (daysSinceLastActive > 1) {
        user.currentStreak = 1;
        user.lastActiveDate = today;
      }
      // Same day: keep the existing streak and do not rewrite it.
    }

    await user.save();

    const [recentActivity, latestQuiz, userSubjects] = await Promise.all([
      ActivityLog.find({ userId: user._id })
        .sort({ createdAt: -1 })
        .limit(5)
        .lean(),
      Quiz.findOne({ userId: user._id, completedAt: { $ne: null } })
        .sort({ completedAt: -1 })
        .lean(),
      Subject.find({ userId: user._id })
        .sort({ name: 1 })
        .limit(6)
        .lean(),
    ]);

    let quizSummary = { hasAttempts: false };
    if (latestQuiz && latestQuiz.questions && latestQuiz.questions.length > 0) {
      const correct = latestQuiz.score !== undefined
        ? latestQuiz.score
        : latestQuiz.questions.reduce(
            (acc, q, idx) => acc + (latestQuiz.answers[idx] === q.correctIndex ? 1 : 0),
            0
          );
      const total = latestQuiz.totalQuestions || latestQuiz.questions.length;
      quizSummary = {
        hasAttempts: true,
        score: correct,
        total,
        percentage: total > 0 ? Math.round((correct / total) * 100) : 0,
        subject: latestQuiz.subject,
        difficulty: latestQuiz.difficulty,
        completedAt: latestQuiz.completedAt,
      };
    }

    res.json({
      streak: user.currentStreak || 1,
      joinedOn: user.createdAt,
      recentActivity: recentActivity.map((item) => ({
        id: item._id,
        type: item.type,
        text: item.text,
        timestamp: item.createdAt,
      })),
      quiz: quizSummary,
      subjects: userSubjects.map((s) => ({
        id: s._id,
        name: s.name,
        description: s.description,
        lessonCount: s.lessonCount,
        progressPercent: s.progressPercent,
        color: s.color,
      })),
    });
  } catch (error) {
    console.error('Dashboard summary error:', error);
    res.status(500).json({
      message: 'Could not load dashboard summary.',
    });
  }
}

export async function getProgress(req, res) {
  try {
    const now = new Date();
    const startDate = startOfUtcDay(new Date());
    startDate.setUTCDate(startDate.getUTCDate() - 6);

    const [quizzes, weeklyActivity, recentActivity, subjects] = await Promise.all([
      Quiz.find({ userId: req.user._id, completedAt: { $ne: null } })
        .select('subject questions.correctIndex answers completedAt')
        .sort({ completedAt: -1 })
        .lean(),
      ActivityLog.aggregate([
        { $match: { userId: req.user._id, createdAt: { $gte: startDate, $lte: now } } },
        {
          $group: {
            _id: {
              $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone: 'UTC' },
            },
            count: { $sum: 1 },
          },
        },
      ]),
      ActivityLog.find({ userId: req.user._id })
        .sort({ createdAt: -1 })
        .limit(8)
        .lean(),
      Subject.find({ userId: req.user._id }).select('name color').sort({ name: 1 }).lean(),
    ]);

    const quizTotals = new Map();
    let totalScorePercent = 0;
    for (const quiz of quizzes) {
      const correct = quiz.questions.reduce(
        (count, question, index) => count + (quiz.answers[index] === question.correctIndex ? 1 : 0),
        0
      );
      const questionCount = quiz.questions.length;
      const scorePercent = questionCount ? (correct / questionCount) * 100 : 0;
      totalScorePercent += scorePercent;

      const subjectTotal = quizTotals.get(quiz.subject) || { scorePercent: 0, quizzes: 0 };
      subjectTotal.scorePercent += scorePercent;
      subjectTotal.quizzes += 1;
      quizTotals.set(quiz.subject, subjectTotal);
    }

    const activityByDate = new Map(weeklyActivity.map(({ _id, count }) => [_id, count]));
    const activity = Array.from({ length: 7 }, (_, index) => {
      const date = new Date(startDate);
      date.setUTCDate(startDate.getUTCDate() + index);
      const dateKey = date.toISOString().slice(0, 10);
      return {
        date: dateKey,
        label: new Intl.DateTimeFormat('en', { weekday: 'short', timeZone: 'UTC' }).format(date),
        count: activityByDate.get(dateKey) || 0,
      };
    });
    const activitiesThisWeek = activity.reduce((sum, day) => sum + day.count, 0);

    return res.json({
      stats: {
        quizzesCompleted: quizzes.length,
        averageScore: quizzes.length ? Math.round(totalScorePercent / quizzes.length) : null,
        activeDays: activity.filter((day) => day.count > 0).length,
        activitiesThisWeek,
      },
      weeklyActivity: activity,
      subjects: subjects.map((subject) => {
        const result = quizTotals.get(subject.name);
        return {
          id: subject._id,
          name: subject.name,
          color: subject.color,
          quizzesCompleted: result?.quizzes || 0,
          averageScore: result
            ? Math.round(result.scorePercent / result.quizzes)
            : null,
        };
      }),
      recentActivity: recentActivity.map((item) => ({
        id: item._id,
        type: item.type,
        text: item.text,
        timestamp: item.createdAt,
      })),
    });
  } catch (error) {
    console.error('Progress analytics error:', error);
    return res.status(500).json({ message: 'Could not load progress analytics.' });
  }
}
