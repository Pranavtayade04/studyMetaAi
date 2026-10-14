import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Sparkles } from 'lucide-react';
import Logo from '../components/Logo.jsx';
import { useAuth } from '../context/AuthContext.jsx';

export default function Auth({ type }) {
  const navigate = useNavigate();
  const { login, signup } = useAuth();
  const signupMode = type === 'Signup';

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    setError('');

    // Basic client-side validation before even hitting the backend —
    // the backend re-validates everything too, this just gives faster
    // feedback and avoids an unnecessary request.
    if (signupMode && !name.trim()) {
      setError('Please enter your full name.');
      return;
    }
    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }
    if (!password) {
      setError('Please enter your password.');
      return;
    }

    setSubmitting(true);
    try {
      if (signupMode) {
        await signup({ name, email, password });
      } else {
        await login({ email, password });
      }
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-art">
        <Logo />
        <div>
          <div className="eyebrow">
            <Sparkles size={15} /> Learn at your own pace
          </div>
          <h1>
            Your study space,
            <br />
            <em>made brighter.</em>
          </h1>
          <p>
            Break down complex ideas, keep organized notes, and make every
            study session count.
          </p>
        </div>
        <div className="auth-quote">
          <div className="avatars">
            <i>R</i>
            <i>A</i>
            <i>S</i>
          </div>
          <span>Join thousands of students learning with confidence.</span>
        </div>
      </div>
      <section className="auth-card">
        <div className="auth-mobile-logo">
          <Logo />
        </div>
        <div>
          <h2>{signupMode ? 'Create your account' : 'Welcome back'}</h2>
          <p>
            {signupMode
              ? 'Start building better study habits today.'
              : 'Log in to continue your learning journey.'}
          </p>
        </div>
        <div className="form">
          {error && <p className="form-error">{error}</p>}
          {signupMode && (
            <label>
              Full name
              <input
                placeholder="Enter your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </label>
          )}
          <label>
            Email address
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
          <label>
            Password
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>
          {!signupMode && (
            <a className="forgot" href="#forgot">
              Forgot password?
            </a>
          )}
          <button
            className="btn primary form-button"
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting
              ? 'Please wait...'
              : signupMode
              ? 'Create account'
              : 'Log in'}{' '}
            <ArrowRight size={16} />
          </button>
        </div>
        <div className="or">
          <span />
          or continue with
          <span />
        </div>
        <button className="google-btn">
          <b>G</b> Continue with Google
        </button>
        <p className="switch-auth">
          {signupMode ? 'Already have an account?' : "Don't have an account?"}{' '}
          <button onClick={() => navigate(signupMode ? '/login' : '/signup')}>
            {signupMode ? 'Log in' : 'Sign up'}
          </button>
        </p>
      </section>
    </div>
  );
}
