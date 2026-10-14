import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  BrainCircuit, Check, CircleHelp, Copy, Menu, Plus, Send, Sparkles, Trash2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { tutorChatRequest } from '../api/tutor.js';
import './Tutor.css';

function timestamp() {
  return new Date().toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
  });
}

export default function Tutor() {
  const navigate = useNavigate();
  const location = useLocation();
  const { token } = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [historyOpen, setHistoryOpen] = useState(false);
  const [copiedMessage, setCopiedMessage] = useState(null);
  const endOfChatRef = useRef(null);

  useEffect(() => {
    if (location.state?.question) {
      const q = location.state.question;
      window.history.replaceState({}, document.title);
      sendMessage(q);
    }
  }, [location.state]);

  async function sendMessage(text = input, followUp = '') {
    const question = text.trim();
    if (!question || sending) return;

    const userText = followUp ? `${followUp}\n\n${question}` : question;
    const nextMessages = [...messages, { role: 'user', content: userText }];
    setMessages(nextMessages);
    setInput('');
    setError('');
    setSending(true);

    try {
      const data = await tutorChatRequest(nextMessages, token);
      setMessages([
        ...nextMessages,
        { role: 'model', content: data.answer, timestamp: timestamp() },
      ]);
      requestAnimationFrame(() => {
        endOfChatRef.current?.scrollIntoView({ behavior: 'smooth' });
      });
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSending(false);
    }
  }

  function handleSubmit(event) {
    event.preventDefault();
    sendMessage();
  }

  async function copyAnswer(message, index) {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopiedMessage(index);
      window.setTimeout(() => setCopiedMessage(null), 1500);
    } catch {
      setError('Could not copy the answer. Check your browser clipboard permissions.');
    }
  }

  function startNewChat() {
    setMessages([]);
    setInput('');
    setError('');
    setHistoryOpen(false);
  }

  return (
    <div className="tutor-page">
      <section className="page-title">
        <div>
          <p className="eyebrow">
            <Sparkles size={14} /> YOUR AI LEARNING PARTNER
          </p>
          <h1>How can I help you learn?</h1>
          <span>Ask anything, get clarity, and make progress.</span>
        </div>
        <div className="tutor-title-actions">
          <button
            className="btn outline mobile-history-toggle"
            onClick={() => setHistoryOpen(!historyOpen)}
            aria-expanded={historyOpen}
            aria-controls="chat-history"
          >
            <Menu size={16} /> History
          </button>
          <button className="btn outline" onClick={startNewChat}>
            <Plus size={16} /> New chat
          </button>
          <button
            className="btn outline"
            onClick={() => {
              setMessages([]);
              setError('');
            }}
            disabled={messages.length === 0}
          >
            <Trash2 size={16} /> Clear chat
          </button>
        </div>
      </section>

      <div className="tutor-layout">
        <aside
          id="chat-history"
          className={`chat-history ${historyOpen ? 'mobile-open' : ''}`}
        >
          <b>Chat history</b>
          <span>This session</span>
          {messages.length ? (
            <button onClick={() => setHistoryOpen(false)}>
              {messages.find((message) => message.role === 'user')?.content}
            </button>
          ) : (
            <p className="tutor-history-empty">Your current conversation will appear here.</p>
          )}
        </aside>

        <section className="chat-panel tutor-chat-panel" aria-label="AI Tutor conversation">
          <div className="tutor-messages" aria-live="polite">
            {messages.length === 0 && (
              <div className="chat-empty">
                <BrainCircuit size={30} />
                <h3>Start a new conversation</h3>
                <p>Ask StudyMeta anything you want to learn.</p>
              </div>
            )}

            {messages.map((message, index) => (
              message.role === 'user' ? (
                <div className="message user-message tutor-user-message" key={`${index}-${message.role}`}>
                  <p>{message.content}</p>
                  <small>{message.timestamp || 'Just now'}</small>
                </div>
              ) : (
                <div className="ai-message tutor-ai-message" key={`${index}-${message.role}`}>
                  <div className="ai-avatar">
                    <BrainCircuit size={17} />
                  </div>
                  <div className="tutor-answer">
                    <div className="message-head">
                      <b>StudyMeta AI</b>
                      <small>{message.timestamp}</small>
                    </div>
                    <div className="ai-bubble tutor-ai-bubble">
                      {message.content}
                    </div>
                    <div className="message-tools tutor-message-tools">
                      <button onClick={() => copyAnswer(message, index)}>
                        {copiedMessage === index ? <Check size={14} /> : <Copy size={14} />}
                        {copiedMessage === index ? 'Copied' : 'Copy'}
                      </button>
                      <button
                        onClick={() =>
                          sendMessage(
                            messages[index - 1]?.content || 'Explain the last topic',
                            'Explain this more simply, using a short example.'
                          )
                        }
                        disabled={sending}
                      >
                        <Sparkles size={14} /> Explain simply
                      </button>
                      <button onClick={() => navigate('/quiz')}>
                        <CircleHelp size={14} /> Generate quiz
                      </button>
                    </div>
                  </div>
                </div>
              )
            ))}

            {sending && (
              <div className="ai-message tutor-ai-message tutor-thinking" role="status">
                <div className="ai-avatar">
                  <BrainCircuit size={17} />
                </div>
                <div className="ai-bubble">StudyMeta is thinking...</div>
              </div>
            )}
            <div ref={endOfChatRef} />
          </div>

          {error && <p className="tutor-error" role="alert">{error}</p>}

          <form className="chat-compose tutor-compose" onSubmit={handleSubmit}>
            <input
              aria-label="Ask StudyMeta anything"
              placeholder="Ask StudyMeta anything..."
              value={input}
              onChange={(event) => setInput(event.target.value)}
              disabled={sending}
              maxLength={3000}
            />
            <button
              className="send"
              type="submit"
              aria-label="Send message"
              disabled={sending || !input.trim()}
            >
              <Send size={18} />
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}
