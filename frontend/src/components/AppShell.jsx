import { useEffect, useState, useCallback } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  Bell, BookOpen, BarChart3, BrainCircuit, CheckCircle2, CircleHelp, ShieldCheck,
  Flame, LayoutDashboard, Menu, MoreHorizontal, Moon, NotebookPen,
  Settings, Sun, X,
} from 'lucide-react';
import Logo from './Logo.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import {
  listNotificationsRequest,
  markAllNotificationsReadRequest,
} from '../api/notifications.js';
import brandText from '../utils/brandText.js';

const navItems = [
  ['Dashboard', LayoutDashboard, '/dashboard'],
  ['AI Tutor', BrainCircuit, '/tutor'],
  ['Notes', NotebookPen, '/notes'],
  ['Quiz', CircleHelp, '/quiz'],
  ['Subjects', BookOpen, '/subjects'],
  ['Progress', BarChart3, '/progress'],
  ['Settings', Settings, '/settings'],
];

const typeIcons = {
  quiz: [CheckCircle2, '#3cb99b'],
  notes: [NotebookPen, '#e39c44'],
  streak: [Flame, '#ef4444'],
  subjects: [BookOpen, '#796bff'],
  system: [Bell, '#4b9bdb'],
  auth: [ShieldCheck, '#796bff'],
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

export default function AppShell() {
  const [mobile, setMobile] = useState(false);
  const [dark, setDark] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notificationsList, setNotificationsList] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationError, setNotificationError] = useState('');

  const navigate = useNavigate();
  const location = useLocation();
  const { user, token, logout } = useAuth();
  const visibleNavItems = user?.role === 'admin'
    ? [...navItems, ['Admin', ShieldCheck, '/admin']]
    : navItems;

  const currentLabel =
    visibleNavItems.find(([, , path]) => path === location.pathname)?.[0] || '';

  const loadNotifications = useCallback(async () => {
    if (!token) return;
    try {
      const data = await listNotificationsRequest(token);
      setNotificationsList(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
      setNotificationError('');
    } catch (error) {
      setNotificationError(error.message);
    }
  }, [token]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications, location.pathname]);

  const go = (path) => {
    navigate(path);
    setMobile(false);
  };

  function handleLogout() {
    logout();
    navigate('/login');
  }

  async function handleToggleNotifications() {
    const nextState = !notificationsOpen;
    setNotificationsOpen(nextState);
    if (nextState) {
      await loadNotifications();
    }
  }

  async function handleMarkAllRead() {
    if (!token) return;
    try {
      await markAllNotificationsReadRequest(token);
      setUnreadCount(0);
      setNotificationsList((current) =>
        current.map((item) => ({ ...item, read: true }))
      );
      setNotificationError('');
    } catch (error) {
      setNotificationError(error.message);
    }
  }

  return (
    <div className={`app-shell ${dark ? 'dark' : ''}`}>
      <aside className={mobile ? 'sidebar open' : 'sidebar'}>
        <div className="side-top">
          <Logo />
          <button className="close-mobile" onClick={() => setMobile(false)}>
            <X />
          </button>
        </div>
        <nav>
          {visibleNavItems.map(([name, Icon, path]) => (
            <button
              key={name}
              onClick={() => go(path)}
              className={location.pathname === path ? 'active' : ''}
            >
              <Icon size={19} />
              <span>{name}</span>
              {name === 'AI Tutor' && <i className="new-tag">NEW</i>}
            </button>
          ))}
        </nav>
        <div className="side-bottom">
          <div
            className="profile"
            onClick={handleLogout}
            role="button"
            tabIndex={0}
            title="Log out"
            onKeyDown={(e) => e.key === 'Enter' && handleLogout()}
          >
            <div className="profile-avatar">{user?.initials}</div>
            <div>
              <b>{user?.name}</b>
              <span>{user?.role === 'admin' ? 'Administrator' : 'Student account'}</span>
            </div>
            <MoreHorizontal size={18} />
          </div>
        </div>
      </aside>
      {mobile && <div className="backdrop" onClick={() => setMobile(false)} />}
      <main className="app-main">
        <header className="app-header">
          <button className="mobile-menu" onClick={() => setMobile(true)}>
            <Menu />
          </button>
          <div className="breadcrumb">
            StudyMeta <span>/</span> {currentLabel}
          </div>
          <div className="header-actions">
            <button
              className="theme-toggle"
              onClick={() => setDark(!dark)}
              aria-label="Toggle color theme"
            >
              {dark ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <div className="notification-wrap">
              <button
                className="icon-btn"
                aria-label="Notifications"
                onClick={handleToggleNotifications}
              >
                <Bell size={19} />
                {unreadCount > 0 && <i className="notification" />}
              </button>
              {notificationsOpen && (
                <div className="notification-popover">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <b>Notifications</b>
                    {unreadCount > 0 && (
                      <button
                        className="text-btn"
                        style={{ fontSize: 12, padding: 0 }}
                        onClick={handleMarkAllRead}
                      >
                        Mark all as read
                      </button>
                    )}
                  </div>
                  {notificationError ? (
                    <p role="alert" style={{ padding: '12px 0', fontSize: 13, color: '#d9534f' }}>
                      {notificationError}
                    </p>
                  ) : notificationsList.length === 0 ? (
                    <p style={{ padding: '12px 0', fontSize: 13, color: 'var(--muted, #888)' }}>
                      No notifications yet.
                    </p>
                  ) : (
                    notificationsList.map((n) => {
                      const [Icon, color] = typeIcons[n.type] || [Bell, '#796bff'];
                      return (
                        <div key={n.id} style={{ opacity: n.read ? 0.7 : 1 }}>
                          <span style={{ color }}>
                            <Icon size={15} />
                          </span>
                          <p>
                            {brandText(n.text)}
                            <small>{formatRelativeTime(n.createdAt)}</small>
                          </p>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>
            <div className="profile-avatar header-avatar">{user?.initials}</div>
          </div>
        </header>
        <div className="page-content">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
