import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight, BookOpen, BrainCircuit, CircleHelp, Flame, MessageSquareText,
  MoreHorizontal, NotebookPen, PenLine, Send,
} from 'lucide-react';
import Quick from '../components/Quick.jsx';
import ProgressBar from '../components/ProgressBar.jsx';
import { dashboardSummaryRequest } from '../api/dashboard.js';
import { listSubjectsRequest } from '../api/subjects.js';
import { useAuth } from '../context/AuthContext.jsx';
import brandText from '../utils/brandText.js';

const activityIcons = {
  tutor: [BrainCircuit, 'violet', 'AI Tutor'],
  notes: [NotebookPen, 'orange', 'Notes'],
  quiz: [CircleHelp, 'green', 'Quiz'],
  subjects: [BookOpen, 'violet', 'Subjects'],
  progress: [Flame, 'orange', 'Progress'],
  auth: [MessageSquareText, 'violet', 'Account'],
};

function formatRelativeTime(timestamp) {
  const date = new Date(timestamp);
  const diffMs = Date.now() - date.getTime();
  const minutes = Math.max(0, Math.floor(diffMs / 60000));

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes} min ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;

  const days = Math.floor(hours / 24);
  if (days === 1) return 'Yesterday';
  return `${days} days ago`;
}

function formatDate(dateValue) {
  return new Intl.DateTimeFormat('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date(dateValue));
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { token, user } = useAuth();
  const [summary, setSummary] = useState(null);
  const [subjectsList, setSubjectsList] = useState([]);
  const [askQuestion, setAskQuestion] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function loadDashboard() {
      setLoading(true);
      setError('');

      try {
        const [data, subData] = await Promise.all([
          dashboardSummaryRequest(token),
          listSubjectsRequest(token),
        ]);
        if (!cancelled) {
          setSummary(data);
          setSubjectsList(subData.subjects);
        }
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    if (token) loadDashboard();

    return () => {
      cancelled = true;
    };
  }, [token]);

  const todayLabel = useMemo(() => formatDate(new Date()), []);

  function handleAskSubmit(e) {
    e.preventDefault();
    const query = askQuestion.trim();
    if (!query) {
      navigate('/tutor');
    } else {
      navigate('/tutor', { state: { question: query } });
    }
  }

  const userSubjects = subjectsList.length > 0
    ? subjectsList
    : (summary?.subjects || []);

  return (
    <>
      <section className="welcome">
        <div>
          <p>{todayLabel.toUpperCase()}</p>
          <h1>
            Welcome, {user?.name || 'Student'} <span>✦</span>
          </h1>
          <h2>What would you like to learn today?</h2>
        </div>
        <div className="streak">
          <div>
            <Flame size={22} />
          </div>
          <span>
            <b>{loading ? 'Loading streak...' : `${summary?.streak || 0} day streak!`}</b>
            <small>Keep it going</small>
          </span>
        </div>
      </section>

      {error && (
        <div className="empty-state" role="alert" style={{ marginBottom: 20 }}>
          <p>{error}</p>
        </div>
      )}

      <form className="ask-box" onSubmit={handleAskSubmit}>
        <div className="ask-icon">
          <BrainCircuit size={21} />
        </div>
        <input
          placeholder="Ask StudyMeta anything..."
          value={askQuestion}
          onChange={(e) => setAskQuestion(e.target.value)}
          aria-label="Ask StudyMeta question"
        />
        <button type="submit" aria-label="Open AI Tutor">
          <Send size={18} />
        </button>
      </form>

      <section>
        <div className="section-heading">
          <div>
            <h2>Quick actions</h2>
            <p>Jump back into your learning flow</p>
          </div>
        </div>
        <div className="quick-grid">
          <Quick
            icon={<MessageSquareText />}
            title="Ask AI Tutor"
            text="Get help with a topic"
            onClick={() => navigate('/tutor')}
          />
          <Quick
            icon={<PenLine />}
            title="Create a note"
            text="Capture an idea"
            onClick={() => navigate('/notes')}
          />
          <Quick
            icon={<CircleHelp />}
            title="Take a quiz"
            text="Test your knowledge"
            onClick={() => navigate('/quiz')}
          />
          <Quick
            icon={<BookOpen />}
            title="Browse subjects"
            text="Continue learning"
            onClick={() => navigate('/subjects')}
          />
        </div>
      </section>

      <section className="dashboard-lower">
        <div className="panel activity-panel">
          <div className="panel-head">
            <div>
              <h2>Recent activity</h2>
              <p>Your latest learning moments</p>
            </div>
            <button className="text-btn" onClick={() => navigate('/progress')}>View all</button>
          </div>

          {loading ? (
            <div className="empty-state">
              <p>Loading recent activity...</p>
            </div>
          ) : summary?.recentActivity?.length ? (
            summary.recentActivity.map((activity) => {
              const [Icon, tone, tag] = activityIcons[activity.type] || [
                MessageSquareText, 'violet', 'Activity'
              ];

              return (
                <div className="activity" key={activity.id}>
                  <div className={`activity-icon ${tone}`}>
                    <Icon size={18} />
                  </div>
                  <div>
                    <span>{tag}</span>
                    <b>{brandText(activity.text)}</b>
                  </div>
                  <small>{formatRelativeTime(activity.timestamp)}</small>
                </div>
              );
            })
          ) : (
            <div className="empty-state">
              <p>No recent activity yet. Start learning to see it here.</p>
            </div>
          )}
        </div>

        <div className="panel score-panel">
          <div className="panel-head">
            <div>
              <h2>Quiz score</h2>
              <p>Your latest performance</p>
            </div>
            <button className="dots" aria-label="Quiz options" onClick={() => navigate('/quiz')}>
              <MoreHorizontal />
            </button>
          </div>

          {summary?.quiz?.hasAttempts ? (
            <div className="score-body">
              <div className="score-ring">
                <b>{summary.quiz.percentage}<small>%</small></b>
                <span>{summary.quiz.percentage >= 80 ? 'Great job!' : 'Keep going!'}</span>
              </div>
              <div>
                <b>Latest quiz: {summary.quiz.subject}</b>
                <p>
                  {summary.quiz.score} of {summary.quiz.total} correct · {summary.quiz.difficulty || 'Quiz'}
                </p>
                <button className="text-btn" onClick={() => navigate('/quiz')}>
                  Take another quiz <ArrowRight size={14} />
                </button>
              </div>
            </div>
          ) : (
            <div className="empty-state">
              <p>No quiz attempts yet. Take a quiz to see your score here.</p>
              <button className="text-btn" onClick={() => navigate('/quiz')}>
                Take a quiz <ArrowRight size={14} />
              </button>
            </div>
          )}
        </div>
      </section>

      <section className="panel subject-panel">
        <div className="panel-head">
          <div>
            <h2>My subjects</h2>
            <p>Keep making progress, one lesson at a time</p>
          </div>
          <button className="text-btn" onClick={() => navigate('/subjects')}>
            View all <ArrowRight size={14} />
          </button>
        </div>
        <div className="subject-grid">
          {userSubjects.length > 0 ? (
            userSubjects.slice(0, 6).map((subject) => (
              <div
                className="subject"
                key={subject.id || subject.name}
                onClick={() => navigate(`/notes?subject=${encodeURIComponent(subject.name)}`)}
                style={{ cursor: 'pointer' }}
              >
                <div className="subject-top">
                  <div
                    className="subject-icon"
                    style={{ background: `${subject.color}18`, color: subject.color }}
                  >
                    <BookOpen size={18} />
                  </div>
                  <MoreHorizontal size={18} />
                </div>
                <b>{subject.name}</b>
                <span>{subject.lessonCount} {subject.lessonCount === 1 ? 'lesson' : 'lessons'}</span>
                <div className="subject-progress">
                  <ProgressBar value={`${subject.progressPercent}%`} color={subject.color} />
                  <small>{subject.progressPercent}%</small>
                </div>
              </div>
            ))
          ) : (
            <div className="empty-state" style={{ gridColumn: '1 / -1' }}>
              <p>No subjects in your library yet.</p>
              <button className="text-btn" onClick={() => navigate('/subjects')}>
                Browse subjects <ArrowRight size={14} />
              </button>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
