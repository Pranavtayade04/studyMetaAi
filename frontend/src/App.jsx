import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';
import Landing from './pages/Landing.jsx';
import Auth from './pages/Auth.jsx';
import AppShell from './components/AppShell.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Tutor from './pages/Tutor.jsx';
import Notes from './pages/Notes.jsx';
import Quiz from './pages/Quiz.jsx';
import Subjects from './pages/Subjects.jsx';
import Progress from './pages/Progress.jsx';
import SettingsPage from './pages/Settings.jsx';
import Admin from './pages/Admin.jsx';

// Guards every route nested inside it. While we're still checking an
// existing token (on page load/refresh) we show nothing rather than
// flashing a redirect. Once that check finishes, no user means "send
// them to the login page".
function RequireAuth({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div style={{ padding: 40, textAlign: 'center' }}>Loading...</div>;
  }
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

function RequireAdmin({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div style={{ padding: 40, textAlign: 'center' }}>Loading...</div>;
  }
  if (user?.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
}

export default function App() {
  return (
    <Routes>
      {/* Public pages */}
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Auth type="Login" />} />
      <Route path="/signup" element={<Auth type="Signup" />} />

      {/* App pages — all share the AppShell (sidebar + topbar) layout,
          and all require a logged-in user. */}
      <Route
        element={
          <RequireAuth>
            <AppShell />
          </RequireAuth>
        }
      >
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/tutor" element={<Tutor />} />
        <Route path="/notes" element={<Notes />} />
        <Route path="/quiz" element={<Quiz />} />
        <Route path="/subjects" element={<Subjects />} />
        <Route path="/progress" element={<Progress />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route
          path="/admin"
          element={
            <RequireAdmin>
              <Admin />
            </RequireAdmin>
          }
        />
      </Route>

      {/* Any unknown URL falls back to the landing page */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
