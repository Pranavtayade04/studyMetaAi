import { useEffect, useState } from 'react';
import {
  Activity, BarChart3, CalendarCheck, ClipboardList, Target,
} from 'lucide-react';
import StatCard from '../components/StatCard.jsx';
import { dashboardProgressRequest } from '../api/dashboard.js';
import { useAuth } from '../context/AuthContext.jsx';
import brandText from '../utils/brandText.js';
import './Progress.css';

function formatActivityDate(value) {
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value));
}

export default function Progress() {
  const { token } = useAuth();
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function loadProgress() {
      setLoading(true);
      setError('');
      try {
        const data = await dashboardProgressRequest(token);
        if (!cancelled) setProgress(data);
      } catch (requestError) {
        if (!cancelled) setError(requestError.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    if (token) loadProgress();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const stats = progress
    ? [
        [ClipboardList, 'Quizzes completed', progress.stats.quizzesCompleted, '#3cb99b'],
        [
          Target,
          'Average quiz score',
          progress.stats.averageScore === null ? '—' : `${progress.stats.averageScore}%`,
          '#e06b91',
        ],
        [CalendarCheck, 'Active days (7 days)', progress.stats.activeDays, '#7267ef'],
        [Activity, 'Study activities (7 days)', progress.stats.activitiesThisWeek, '#ef9b5e'],
      ]
    : [];
  const maximumActivity = Math.max(1, ...(progress?.weeklyActivity.map((day) => day.count) || []));

  return (
    <>
      <section className="page-title">
        <div>
          <p className="eyebrow">
            <BarChart3 size={14} /> YOUR LEARNING JOURNEY
          </p>
          <h1>Progress overview</h1>
          <span>Quiz results and your recent learning activity.</span>
        </div>
        <span className="progress-period">Last 7 days</span>
      </section>

      {error && <p className="form-error" role="alert">{error}</p>}
      {loading ? (
        <p className="progress-message" role="status">Loading your progress...</p>
      ) : progress && (
        <>
          <div className="stats-grid">
            {stats.map(([Icon, label, value, color]) => (
              <StatCard
                key={label}
                icon={<Icon size={21} />}
                label={label}
                value={value}
                color={color}
              />
            ))}
          </div>

          <section className="panel progress-activity-panel">
            <div className="panel-head">
              <div>
                <h2>Weekly learning activity</h2>
                <p>Recorded study activities each day</p>
              </div>
              <div className="chart-legend"><i /> Activities</div>
            </div>
            <div className="progress-activity-chart" aria-label="Study activities over the last seven days">
              {progress.weeklyActivity.map((day) => (
                <div className="progress-activity-day" key={day.date}>
                  <span
                    className="progress-activity-bar"
                    style={{ height: `${(day.count / maximumActivity) * 100}%` }}
                    title={`${day.count} ${day.count === 1 ? 'activity' : 'activities'}`}
                    aria-label={`${day.label}: ${day.count} ${day.count === 1 ? 'activity' : 'activities'}`}
                  />
                  <small>{day.label}</small>
                </div>
              ))}
            </div>
          </section>

          <section className="progress-subjects panel">
            <div className="panel-head">
              <div>
                <h2>Quiz performance by subject</h2>
                <p>Average score across your completed quizzes</p>
              </div>
            </div>
            {progress.subjects.length === 0 ? (
              <p className="progress-message">Add a subject to see your learning progress here.</p>
            ) : progress.subjects.map((subject) => (
              <div className="progress-score-row" key={subject.id}>
                <span>{subject.name}</span>
                <div className="progress-score-track">
                  <span
                    style={{
                      width: `${subject.averageScore ?? 0}%`,
                      background: subject.color,
                    }}
                  />
                </div>
                <b>
                  {subject.averageScore === null
                    ? 'No quizzes'
                    : `${subject.averageScore}% · ${subject.quizzesCompleted}`}
                </b>
              </div>
            ))}
          </section>

          <section className="panel progress-recent-panel">
            <div className="panel-head">
              <div>
                <h2>Recent activity</h2>
                <p>Your latest recorded learning sessions</p>
              </div>
            </div>
            {progress.recentActivity.length === 0 ? (
              <p className="progress-message">Your completed quizzes will appear here.</p>
            ) : (
              <ul className="progress-activity-list">
                {progress.recentActivity.map((item) => (
                  <li key={item.id}>
                    <span>{brandText(item.text)}</span>
                    <time dateTime={item.timestamp}>{formatActivityDate(item.timestamp)}</time>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </>
  );
}
