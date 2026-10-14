import { useEffect, useState } from 'react';
import { Activity, BookOpen, ClipboardList, ShieldCheck, Users } from 'lucide-react';
import StatCard from '../components/StatCard.jsx';
import { adminOverviewRequest } from '../api/admin.js';
import { useAuth } from '../context/AuthContext.jsx';
import brandText from '../utils/brandText.js';
import './Admin.css';

function formatDate(value) {
  return new Intl.DateTimeFormat(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(value));
}

function formatDateTime(value) {
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value));
}

export default function Admin() {
  const { token } = useAuth();
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function loadOverview() {
      setLoading(true);
      setError('');
      try {
        const data = await adminOverviewRequest(token);
        if (!cancelled) setOverview(data);
      } catch (requestError) {
        if (!cancelled) setError(requestError.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    if (token) loadOverview();
    return () => {
      cancelled = true;
    };
  }, [token]);

  return (
    <>
      <section className="page-title">
        <div>
          <p className="eyebrow">
            <ShieldCheck size={14} /> ADMINISTRATION
          </p>
          <h1>Admin overview</h1>
          <span>Monitor accounts and learning activity across StudyMeta.</span>
        </div>
      </section>

      {error && <p className="form-error" role="alert">{error}</p>}
      {loading ? (
        <p className="admin-message" role="status">Loading admin overview...</p>
      ) : overview && (
        <>
          <div className="stats-grid">
            {[
              [Users, 'Registered users', overview.stats.users, '#7267ef'],
              [BookOpen, 'Saved notes', overview.stats.notes, '#ef9b5e'],
              [BookOpen, 'Subjects', overview.stats.subjects, '#3cb99b'],
              [ClipboardList, 'Completed quizzes', overview.stats.completedQuizzes, '#e06b91'],
            ].map(([Icon, label, value, color]) => (
              <StatCard
                key={label}
                icon={<Icon size={21} />}
                label={label}
                value={value}
                color={color}
              />
            ))}
          </div>

          <section className="panel admin-section">
            <div className="panel-head">
              <div>
                <h2>User accounts</h2>
                <p>
                  {overview.users.length === 50
                    ? 'Showing the 50 most recently joined accounts'
                    : `${overview.users.length} account${overview.users.length === 1 ? '' : 's'}`}
                </p>
              </div>
            </div>
            {overview.users.length === 0 ? (
              <p className="admin-message">No user accounts found.</p>
            ) : (
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th scope="col">Name</th>
                      <th scope="col">Email</th>
                      <th scope="col">Role</th>
                      <th scope="col">Joined</th>
                    </tr>
                  </thead>
                  <tbody>
                    {overview.users.map((user) => (
                      <tr key={user.id}>
                        <td>{user.name}</td>
                        <td>{user.email}</td>
                        <td>
                          <span className={`admin-role ${user.role === 'admin' ? 'is-admin' : ''}`}>
                            {user.role}
                          </span>
                        </td>
                        <td>{formatDate(user.joinedAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className="panel admin-section">
            <div className="panel-head">
              <div>
                <h2>Recent platform activity</h2>
                <p>Latest actions recorded for student accounts</p>
              </div>
              <Activity size={19} />
            </div>
            {overview.recentActivity.length === 0 ? (
              <p className="admin-message">No activity has been recorded yet.</p>
            ) : (
              <ul className="admin-activity-list">
                {overview.recentActivity.map((item) => (
                  <li key={item.id}>
                    <div>
                      <b>{item.user.name}</b>
                      <span>{item.user.email}</span>
                      <p>{brandText(item.text)}</p>
                    </div>
                    <time dateTime={item.timestamp}>{formatDateTime(item.timestamp)}</time>
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
