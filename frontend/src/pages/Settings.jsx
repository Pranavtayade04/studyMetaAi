import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Settings } from 'lucide-react';
import Modal from '../components/Modal.jsx';
import { useAuth } from '../context/AuthContext.jsx';

export default function SettingsPage() {
  const navigate = useNavigate();
  const [confirm, setConfirm] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [language, setLanguage] = useState('English');
  const [dailyReminder, setDailyReminder] = useState(true);
  const [weeklyReport, setWeeklyReport] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [message, setMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const { user, updateProfile, updatePreferences, deleteAccount } = useAuth();

  useEffect(() => {
    setName(user?.name || '');
    setEmail(user?.email || '');
    if (user?.preferences) {
      setLanguage(user.preferences.language || 'English');
      setDailyReminder(user.preferences.dailyReminder !== false);
      setWeeklyReport(Boolean(user.preferences.weeklyReport));
    }
  }, [user]);

  async function handleSave() {
    setMessage('');
    setIsSuccess(false);

    if (!name.trim()) {
      setMessage('Please enter your full name.');
      return;
    }

    if (!email.trim()) {
      setMessage('Please enter your email address.');
      return;
    }

    setSaving(true);
    try {
      await updateProfile({ name, email });
      await updatePreferences({ language, dailyReminder, weeklyReport });
      setIsSuccess(true);
      setMessage('Settings and preferences saved successfully.');
    } catch (error) {
      setIsSuccess(false);
      setMessage(error.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteAccount() {
    setDeleting(true);
    try {
      await deleteAccount();
      navigate('/login');
    } catch (error) {
      setDeleting(false);
      setConfirm(false);
      setIsSuccess(false);
      setMessage(`Failed to delete account: ${error.message}`);
    }
  }

  return (
    <>
      <section className="page-title">
        <div>
          <p className="eyebrow">
            <Settings size={14} /> PREFERENCES
          </p>
          <h1>Settings</h1>
          <span>Manage your account and learning preferences.</span>
        </div>
      </section>

      <div className="settings-stack">
        <section className="panel setting-block">
          <h2>Profile information</h2>
          <p>Update the details associated with your account.</p>
          <div className="profile-edit">
            <div className="large-avatar">{user?.initials}</div>
            <button className="btn outline" type="button">Change photo</button>
          </div>
          <div className="two-fields">
            <label>
              Full name
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
              />
            </label>
            <label>
              Email address
              <input
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </label>
          </div>
          {message && (
            <p
              className={isSuccess ? 'form-success' : 'form-error'}
              style={isSuccess ? { color: '#3cb99b', marginTop: 10 } : { marginTop: 10 }}
            >
              {message}
            </p>
          )}
          <button className="btn primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save changes'}
          </button>
        </section>

        <section className="panel setting-block">
          <h2>Learning preferences</h2>
          <p>Fine-tune StudyMeta to suit how you learn best.</p>
          <label className="language-select">
            Language
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
            >
              <option value="English">English</option>
              <option value="Hindi">Hindi</option>
              <option value="Marathi">Marathi</option>
            </select>
          </label>
          <div className="setting-toggle">
            <div>
              <b>Daily study reminder</b>
              <span>Get a gentle reminder to keep your streak going.</span>
            </div>
            <button
              type="button"
              className={`toggle ${dailyReminder ? 'on' : ''}`}
              onClick={() => setDailyReminder(!dailyReminder)}
              aria-label="Toggle daily study reminder"
            >
              <i />
            </button>
          </div>
          <div className="setting-toggle">
            <div>
              <b>Weekly progress report</b>
              <span>Receive a summary of your learning activity.</span>
            </div>
            <button
              type="button"
              className={`toggle ${weeklyReport ? 'on' : ''}`}
              onClick={() => setWeeklyReport(!weeklyReport)}
              aria-label="Toggle weekly progress report"
            >
              <i />
            </button>
          </div>
          <div style={{ marginTop: 16 }}>
            <button className="btn primary" onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : 'Save preferences'}
            </button>
          </div>
        </section>

        <section className="panel setting-block danger">
          <h2>Danger zone</h2>
          <p>These actions are permanent and cannot be undone.</p>
          <button className="btn danger-btn" onClick={() => setConfirm(true)}>
            <LogOut size={16} /> Delete account
          </button>
        </section>
      </div>

      {confirm && (
        <Modal title="Delete account?" onClose={() => !deleting && setConfirm(false)}>
          <p className="modal-copy">
            Are you sure you want to delete your account? All of your saved notes, quizzes,
            subjects, and learning progress will be permanently erased from the database.
          </p>
          <div className="modal-actions">
            <button className="btn outline" onClick={() => setConfirm(false)} disabled={deleting}>
              Cancel
            </button>
            <button className="btn danger-btn" onClick={handleDeleteAccount} disabled={deleting}>
              {deleting ? 'Deleting account...' : 'Yes, delete my account'}
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
