import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight, BookOpen, MoreHorizontal, Plus, Trash2,
} from 'lucide-react';
import ProgressBar from '../components/ProgressBar.jsx';
import Modal from '../components/Modal.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import {
  createSubjectRequest, deleteSubjectRequest, listSubjectsRequest, updateSubjectRequest,
} from '../api/subjects.js';
import './Subjects.css';

const EMPTY_FORM = {
  name: '',
  description: '',
  lessonCount: 0,
  progressPercent: 0,
};

export default function Subjects() {
  const navigate = useNavigate();
  const { token } = useAuth();
  const [subjects, setSubjects] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [activeSubject, setActiveSubject] = useState(null);
  const [modalMode, setModalMode] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    async function loadSubjects() {
      setLoading(true);
      setError('');
      try {
        const data = await listSubjectsRequest(token);
        if (!cancelled) setSubjects(data.subjects);
      } catch (requestError) {
        if (!cancelled) setError(requestError.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadSubjects();
    return () => {
      cancelled = true;
    };
  }, [token]);

  function openCreate() {
    setError('');
    setActiveSubject(null);
    setForm(EMPTY_FORM);
    setModalMode('edit');
  }

  function openEdit(subject) {
    setError('');
    setActiveSubject(subject);
    setForm({
      name: subject.name,
      description: subject.description || '',
      lessonCount: subject.lessonCount,
      progressPercent: subject.progressPercent,
    });
    setModalMode('edit');
  }

  function closeModal() {
    if (saving) return;
    setModalMode('');
    setActiveSubject(null);
  }

  async function saveSubject(event) {
    event.preventDefault();
    setError('');
    setSaving(true);
    try {
      const data = activeSubject
        ? await updateSubjectRequest(activeSubject.id, form, token)
        : await createSubjectRequest(form, token);
      setSubjects((current) => {
        const next = activeSubject
          ? current.map((subject) => subject.id === data.subject.id ? data.subject : subject)
          : [...current, data.subject];
        return next.sort((a, b) => a.name.localeCompare(b.name));
      });
      setModalMode('');
      setActiveSubject(null);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  }

  async function removeSubject() {
    setError('');
    setSaving(true);
    try {
      await deleteSubjectRequest(activeSubject.id, token);
      setSubjects((current) => current.filter((subject) => subject.id !== activeSubject.id));
      setModalMode('');
      setActiveSubject(null);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <section className="page-title">
        <div>
          <p className="eyebrow">
            <BookOpen size={14} /> YOUR LEARNING LIBRARY
          </p>
          <h1>My subjects</h1>
          <span>Pick up where you left off or explore something new.</span>
        </div>
        <button className="btn primary" onClick={openCreate}>
          <Plus size={17} /> Add subject
        </button>
      </section>

      {error && !modalMode && <p className="subjects-error" role="alert">{error}</p>}

      {loading ? (
        <div className="empty-state"><p>Loading your subjects...</p></div>
      ) : subjects.length === 0 ? (
        <div className="empty-state">
          <BookOpen size={30} />
          <h3>No subjects yet</h3>
          <p>Add a subject to organize your learning and track your progress.</p>
          <button className="btn primary" onClick={openCreate}>
            <Plus size={16} /> Add your first subject
          </button>
        </div>
      ) : (
        <div className="subjects-page-grid">
          {subjects.map((subject) => (
            <article className="subject-large" key={subject.id}>
              <div className="subject-large-head">
                <div
                  className="subject-icon"
                  style={{ background: `${subject.color}18`, color: subject.color }}
                >
                  <BookOpen size={23} />
                </div>
                <button
                  aria-label={`Edit ${subject.name}`}
                  title="Edit subject"
                  onClick={() => openEdit(subject)}
                >
                  <MoreHorizontal />
                </button>
              </div>
              <span>{subject.lessonCount} {subject.lessonCount === 1 ? 'lesson' : 'lessons'}</span>
              <h2>{subject.name}</h2>
              {subject.description && <p className="subject-description">{subject.description}</p>}
              <ProgressBar value={`${subject.progressPercent}%`} color={subject.color} />
              <p><b>{subject.progressPercent}%</b> complete</p>
              <button onClick={() => navigate(`/notes?subject=${encodeURIComponent(subject.name)}`)}>
                Continue learning <ArrowRight size={15} />
              </button>
              <button
                className="subject-delete"
                aria-label={`Delete ${subject.name}`}
                title="Delete subject"
                onClick={() => {
                  setActiveSubject(subject);
                  setError('');
                  setModalMode('delete');
                }}
              >
                <Trash2 size={15} />
              </button>
            </article>
          ))}
        </div>
      )}

      {modalMode === 'edit' && (
        <Modal title={activeSubject ? 'Edit subject' : 'Add a subject'} onClose={closeModal}>
          <form className="subject-form" onSubmit={saveSubject}>
            {error && <p className="form-error" role="alert">{error}</p>}
            <label>
              Subject name
              <input
                autoFocus
                maxLength={80}
                value={form.name}
                onChange={(event) => setForm({ ...form, name: event.target.value })}
                placeholder="e.g. Web Development"
                required
              />
            </label>
            <label>
              Description
              <textarea
                maxLength={500}
                rows={3}
                value={form.description}
                onChange={(event) => setForm({ ...form, description: event.target.value })}
                placeholder="A short description of this subject"
              />
            </label>
            <div className="subject-form-numbers">
              <label>
                Lessons
                <input
                  type="number"
                  min="0"
                  max="10000"
                  step="1"
                  value={form.lessonCount}
                  onChange={(event) => setForm({ ...form, lessonCount: Number(event.target.value) })}
                />
              </label>
              <label>
                Progress (%)
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="1"
                  value={form.progressPercent}
                  onChange={(event) => setForm({ ...form, progressPercent: Number(event.target.value) })}
                />
              </label>
            </div>
            <div className="modal-actions">
              <button className="btn outline" type="button" onClick={closeModal} disabled={saving}>
                Cancel
              </button>
              <button className="btn primary" type="submit" disabled={saving}>
                {saving ? 'Saving...' : activeSubject ? 'Save changes' : 'Save subject'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {modalMode === 'delete' && (
        <Modal title="Delete subject?" onClose={closeModal}>
          <p className="modal-copy">
            “{activeSubject?.name}” will be removed from your learning library.
            Existing notes tagged with this subject will not be deleted.
          </p>
          {error && <p className="form-error" role="alert">{error}</p>}
          <div className="modal-actions">
            <button className="btn outline" onClick={closeModal} disabled={saving}>Cancel</button>
            <button className="btn danger-btn" onClick={removeSubject} disabled={saving}>
              {saving ? 'Deleting...' : 'Delete subject'}
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
