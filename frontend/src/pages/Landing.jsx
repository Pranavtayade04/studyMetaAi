import { useNavigate } from 'react-router-dom';
import {
  ArrowRight, BrainCircuit, CircleHelp, Flame, LayoutDashboard, NotebookPen,
  Send, Sparkles, Target,
} from 'lucide-react';
import Logo from '../components/Logo.jsx';
import ProgressBar from '../components/ProgressBar.jsx';
import Feature from '../components/Feature.jsx';

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="landing">
      <header className="public-header">
        <Logo />
        <nav>
          <a href="#features">Features</a>
          <a href="#how">How it works</a>
          <a href="#about">About</a>
        </nav>
        <div className="public-actions">
          <button className="btn ghost" onClick={() => navigate('/login')}>
            Log in
          </button>
          <button className="btn primary" onClick={() => navigate('/signup')}>
            Get started <ArrowRight size={16} />
          </button>
        </div>
      </header>
      <main>
        <section className="hero">
          <div className="eyebrow">
            <Sparkles size={15} /> Your personal learning companion
          </div>
          <h1>
            Study smarter.
            <br />
            <em>Achieve more.</em>
          </h1>
          <p>
            StudyMeta AI helps you understand difficult topics, organize your
            notes, and build study habits that stick.
          </p>
          <div className="hero-actions">
            <button
              className="btn primary large"
              onClick={() => navigate('/signup')}
            >
              Start learning for free <ArrowRight size={17} />
            </button>
            <button
              className="btn outline large"
              onClick={() => navigate('/dashboard')}
            >
              Explore dashboard
            </button>
          </div>
          <div className="hero-note">
            <div className="avatars">
              <i>R</i>
              <i>A</i>
              <i>S</i>
            </div>
            Trusted by 10,000+ curious learners
          </div>
        </section>
        <section className="hero-visual" aria-label="Study dashboard preview">
          <div className="preview-card preview-sidebar">
            <Logo />
            <span className="mini-active">
              <LayoutDashboard size={14} /> Dashboard
            </span>
            <span>
              <BrainCircuit size={14} /> AI Tutor
            </span>
            <span>
              <NotebookPen size={14} /> Notes
            </span>
            <span>
              <CircleHelp size={14} /> Quiz
            </span>
          </div>
          <div className="preview-card preview-main">
            <p>
              Good morning, Student <span>✦</span>
            </p>
            <h3>Ready to learn something new?</h3>
            <div className="preview-ask">
              Ask StudyMeta anything... <Send size={15} />
            </div>
            <div className="preview-stats">
              <div>
                <small>Study streak</small>
                <strong>
                  12 <Flame size={15} />
                </strong>
              </div>
              <div>
                <small>Weekly progress</small>
                <strong>74%</strong>
                <ProgressBar value="74%" color="#7267ef" />
              </div>
            </div>
          </div>
          <div className="floating-card floating-score">
            <span className="green-dot" /> Quiz score <b>92%</b>
          </div>
          <div className="floating-card floating-tutor">
            <div className="tiny-mark">
              <BrainCircuit size={16} />
            </div>
            <span>
              AI Tutor is ready
              <br />
              <b>What shall we learn?</b>
            </span>
          </div>
        </section>
        <section id="features" className="features">
          <div>
            <span className="section-label">BUILT FOR BETTER LEARNING</span>
            <h2>Everything you need to stay on track</h2>
          </div>
          <div className="feature-grid">
            <Feature
              icon={<BrainCircuit />}
              title="Your AI study partner"
              text="Ask questions anytime and get clear, helpful explanations."
            />
            <Feature
              icon={<NotebookPen />}
              title="Notes, made simple"
              text="Keep all your ideas and study material in one focused place."
            />
            <Feature
              icon={<Target />}
              title="See your progress"
              text="Build momentum with friendly insights and milestones."
            />
          </div>
        </section>
      </main>
    </div>
  );
}
