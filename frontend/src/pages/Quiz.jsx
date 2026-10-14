import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, CheckCircle2, CircleHelp, LoaderCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { generateQuizRequest, gradeQuizRequest } from '../api/quiz.js';
import { listSubjectsRequest } from '../api/subjects.js';
import './Quiz.css';

const DIFFICULTIES = ['Easy', 'Medium', 'Hard'];
const QUESTION_COUNTS = [5, 10, 15, 20];

export default function Quiz() {
  const navigate = useNavigate();
  const { token } = useAuth();
  const [subjects, setSubjects] = useState([]);
  const [subject, setSubject] = useState('');
  const [difficulty, setDifficulty] = useState('Easy');
  const [count, setCount] = useState(10);
  const [quiz, setQuiz] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    listSubjectsRequest(token)
      .then((data) => {
        if (cancelled) return;
        const availableSubjects = data.subjects.map((item) => item.name);
        setSubjects(availableSubjects);
        setSubject((current) => current || availableSubjects[0] || '');
      })
      .catch((requestError) => {
        if (!cancelled) setError(requestError.message);
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  async function startQuiz() {
    setError('');
    setLoading(true);
    try {
      const generated = await generateQuizRequest(
        { subject, difficulty, count },
        token
      );
      setQuiz(generated);
      setAnswers(Array(generated.questions.length).fill(null));
      setQuestionIndex(0);
      setResult(null);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }

  async function submitQuiz() {
    setError('');
    setLoading(true);
    try {
      const graded = await gradeQuizRequest(quiz.quizId, answers, token);
      setResult(graded);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }

  function resetQuiz() {
    setQuiz(null);
    setAnswers([]);
    setQuestionIndex(0);
    setResult(null);
    setError('');
  }

  if (result) {
    const percentage = Math.round((result.score / result.total) * 100);
    return (
      <>
        <section className="page-title">
          <div>
            <p className="eyebrow">
              <CircleHelp size={14} /> QUIZ COMPLETE
            </p>
            <h1>{percentage >= 80 ? 'Great work!' : 'Keep practising!'}</h1>
            <span>Your answers have been checked. Review your results below.</span>
          </div>
        </section>
        <section className="panel quiz-result">
          <div className="result-score">
            <b>
              {percentage}<small>%</small>
            </b>
            <span>Your score</span>
          </div>
          <h2>{result.subject}</h2>
          <p>
            {result.score} of {result.total} correct · {result.difficulty} difficulty
          </p>
          <div className="result-stats">
            <div>
              <b>{result.score}</b>
              <span>Correct answers</span>
            </div>
            <div>
              <b>{result.total - result.score}</b>
              <span>Incorrect answers</span>
            </div>
            <div>
              <b>{result.total}</b>
              <span>Total questions</span>
            </div>
          </div>
          <div className="quiz-review-list">
            {result.questions.map((item, index) => (
              <article
                className={`quiz-review-item ${
                  item.selectedIndex === item.correctIndex ? 'correct' : 'incorrect'
                }`}
                key={`${index}-${item.question}`}
              >
                <h3>{index + 1}. {item.question}</h3>
                <p>
                  Your answer:{' '}
                  {item.selectedIndex === null
                    ? 'Not answered'
                    : item.options[item.selectedIndex]}
                </p>
                {item.selectedIndex !== item.correctIndex && (
                  <p>Correct answer: {item.options[item.correctIndex]}</p>
                )}
                <small>{item.explanation}</small>
              </article>
            ))}
          </div>
          <div className="result-actions">
            <button className="btn outline" onClick={resetQuiz}>
              Create another quiz
            </button>
            <button className="btn primary" onClick={() => navigate('/dashboard')}>
              Back to Dashboard <ArrowRight size={16} />
            </button>
          </div>
        </section>
      </>
    );
  }

  if (quiz) {
    const question = quiz.questions[questionIndex];
    const selectedAnswer = answers[questionIndex];
    const allAnswered = answers.every((answer) => answer !== null);

    return (
      <>
        <section className="page-title">
          <div>
            <p className="eyebrow">
              <CircleHelp size={14} /> {quiz.subject.toUpperCase()} · {quiz.difficulty.toUpperCase()}
            </p>
            <h1>Your quiz</h1>
            <span>Choose one answer for each question.</span>
          </div>
          <button className="btn outline" onClick={resetQuiz} disabled={loading}>
            Exit quiz
          </button>
        </section>

        <section className="panel question-preview quiz-live">
          <span className="quiz-counter">
            QUESTION {questionIndex + 1} OF {quiz.questions.length}
          </span>
          <div className="question-progress">
            <span style={{ width: `${((questionIndex + 1) / quiz.questions.length) * 100}%` }} />
          </div>
          <h2>{question.question}</h2>
          <div className="answers">
            {question.options.map((option, index) => (
              <button
                className={selectedAnswer === index ? 'selected' : ''}
                key={`${index}-${option}`}
                onClick={() =>
                  setAnswers((current) =>
                    current.map((answer, position) =>
                      position === questionIndex ? index : answer
                    )
                  )
                }
                aria-pressed={selectedAnswer === index}
              >
                <i>{'ABCD'[index]}</i>
                {option}
              </button>
            ))}
          </div>
          {error && <p className="quiz-error" role="alert">{error}</p>}
          <div className="quiz-nav">
            <button
              className="btn outline"
              onClick={() => setQuestionIndex((current) => current - 1)}
              disabled={questionIndex === 0 || loading}
            >
              Previous
            </button>
            {questionIndex < quiz.questions.length - 1 ? (
              <button
                className="btn primary"
                onClick={() => setQuestionIndex((current) => current + 1)}
                disabled={selectedAnswer === null || loading}
              >
                Next question <ArrowRight size={16} />
              </button>
            ) : (
              <button
                className="btn primary"
                onClick={submitQuiz}
                disabled={!allAnswered || loading}
              >
                {loading ? <LoaderCircle size={16} className="quiz-spinner" /> : <CheckCircle2 size={16} />}
                {loading ? 'Checking answers...' : 'Submit quiz'}
              </button>
            )}
          </div>
        </section>
      </>
    );
  }

  return (
    <>
      <section className="page-title">
        <div>
          <p className="eyebrow">
            <CircleHelp size={14} /> TEST YOUR KNOWLEDGE
          </p>
          <h1>Quiz center</h1>
          <span>Choose a topic and challenge yourself.</span>
        </div>
      </section>

      <div className="quiz-layout quiz-create-layout">
        <section className="panel quiz-setup">
          <h2>Create a quiz</h2>
          <p>Gemini will create a fresh set of questions for you.</p>
          <label>
            Choose a subject
            <select
              value={subject}
              onChange={(event) => setSubject(event.target.value)}
              disabled={subjects.length === 0}
            >
              {subjects.map((option) => <option key={option}>{option}</option>)}
            </select>
          </label>
          <label>
            Difficulty
            <div className="choice-row">
              {DIFFICULTIES.map((option) => (
                <button
                  className={difficulty === option ? 'selected' : ''}
                  key={option}
                  onClick={() => setDifficulty(option)}
                  type="button"
                  aria-pressed={difficulty === option}
                >
                  {option}
                </button>
              ))}
            </div>
          </label>
          <label>
            Number of questions
            <div className="choice-row">
              {QUESTION_COUNTS.map((option) => (
                <button
                  className={count === option ? 'selected' : ''}
                  key={option}
                  onClick={() => setCount(option)}
                  type="button"
                  aria-pressed={count === option}
                >
                  {option}
                </button>
              ))}
            </div>
          </label>
          {error && <p className="quiz-error" role="alert">{error}</p>}
          <button className="btn primary form-button" onClick={startQuiz} disabled={loading || !subject}>
            {loading ? <LoaderCircle size={16} className="quiz-spinner" /> : <ArrowRight size={16} />}
            {loading ? 'Generating quiz...' : 'Start quiz'}
          </button>
        </section>
        <section className="panel quiz-welcome">
          <div className="result-icon"><CheckCircle2 size={26} /></div>
          <h2>Ready when you are</h2>
          <p>
            Select your preferences and start a quiz. Your answers will be
            graded when you submit, with explanations for every question.
          </p>
        </section>
      </div>
    </>
  );
}
