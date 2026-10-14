import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import {
  ChevronDown, MoreHorizontal, NotebookPen, PenLine, Plus, Search, Trash2,
} from 'lucide-react';
import Modal from '../components/Modal.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { listSubjectsRequest } from '../api/subjects.js';
import {
  createNoteRequest, deleteNoteRequest, listNotesRequest, updateNoteRequest,
} from '../api/notes.js';
import './Notes.css';

const EMPTY_FORM = { title: '', body: '', subject: '' };

function formatDate(value) {
  return new Date(value).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
}

export default function Notes() {
  const location = useLocation();
  const { token } = useAuth();
  const [notes, setNotes] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [search, setSearch] = useState('');
  const [subjectFilter, setSubjectFilter] = useState(
    () => new URLSearchParams(location.search).get('subject') || ''
  );
  const [modalMode, setModalMode] = useState('');
  const [activeNote, setActiveNote] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    async function loadNotes() {
      setLoading(true);
      setError('');
      try {
        const [data, subjectData] = await Promise.all([
          listNotesRequest(token),
          listSubjectsRequest(token),
        ]);
        if (cancelled) return;
        setNotes(data.notes);
        setSubjects(subjectData.subjects.map((subject) => subject.name));
      } catch (requestError) {
        if (!cancelled) setError(requestError.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadNotes();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const filteredNotes = useMemo(() => {
    const term = search.trim().toLocaleLowerCase();
    return notes.filter((note) => {
      const matchesSubject = !subjectFilter || note.subject === subjectFilter;
      const matchesSearch =
        !term ||
        note.title.toLocaleLowerCase().includes(term) ||
        note.body.toLocaleLowerCase().includes(term) ||
        note.subject.toLocaleLowerCase().includes(term);
      return matchesSubject && matchesSearch;
    });
  }, [notes, search, subjectFilter]);

  function openCreate() {
    setError('');
    setActiveNote(null);
    setForm({ ...EMPTY_FORM, subject: subjectFilter || subjects[0] || '' });
    setModalMode('edit');
  }

  function openEdit(note) {
    setError('');
    setActiveNote(note);
    setForm({ title: note.title, body: note.body, subject: note.subject });
    setModalMode('edit');
  }

  function closeModal() {
    if (saving) return;
    setModalMode('');
    setActiveNote(null);
  }

  async function saveNote(event) {
    event.preventDefault();
    setError('');
    setSaving(true);
    try {
      const data = activeNote
        ? await updateNoteRequest(activeNote.id, form, token)
        : await createNoteRequest(form, token);
      setNotes((current) => {
        const next = activeNote
          ? current.map((note) => note.id === data.note.id ? data.note : note)
          : [data.note, ...current];
        return next.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
      });
      setSubjects((current) => [...new Set([...current, data.note.subject])].sort());
      setModalMode('');
      setActiveNote(null);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  }

  async function removeNote() {
    setError('');
    setSaving(true);
    try {
      await deleteNoteRequest(activeNote.id, token);
      setNotes((current) => current.filter((note) => note.id !== activeNote.id));
      setModalMode('');
      setActiveNote(null);
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
            <NotebookPen size={14} /> YOUR KNOWLEDGE BASE
          </p>
          <h1>My notes</h1>
          <span>Keep your learning organized and easy to revisit.</span>
        </div>
        <button className="btn primary" onClick={openCreate}>
          <Plus size={17} /> Create note
        </button>
      </section>

      <div className="notes-tools">
        <div className="search">
          <Search size={18} />
          <input
            placeholder="Search your notes..."
            aria-label="Search your notes"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
        <label className="notes-filter">
          <span className="sr-only">Filter notes by subject</span>
          <select value={subjectFilter} onChange={(event) => setSubjectFilter(event.target.value)}>
            <option value="">All subjects</option>
            {subjects.map((subject) => <option key={subject} value={subject}>{subject}</option>)}
          </select>
          <ChevronDown size={16} aria-hidden="true" />
        </label>
      </div>

      {error && !modalMode && <p className="notes-error" role="alert">{error}</p>}

      {loading ? (
        <div className="empty-state"><p>Loading your notes...</p></div>
      ) : filteredNotes.length === 0 ? (
        <div className="empty-state">
          <NotebookPen size={30} />
          <h3>{notes.length ? 'No matching notes' : 'No notes yet'}</h3>
          <p>
            {notes.length
              ? 'Try a different search or subject filter.'
              : 'Create a note or save a helpful response from AI Tutor to build your knowledge base.'}
          </p>
          {notes.length === 0 && (
            <button className="btn primary" onClick={openCreate}>
              <Plus size={16} /> Create your first note
            </button>
          )}
        </div>
      ) : (
        <div className="note-grid">
          {filteredNotes.map((note) => (
            <article className="note-card" key={note.id}>
              <div className="note-card-head">
                <div className="note-color" style={{ background: note.color }} />
                <button
                  aria-label={`Edit ${note.title}`}
                  title="Edit note"
                  onClick={() => openEdit(note)}
                >
                  <MoreHorizontal size={19} />
                </button>
              </div>
              <span className="note-tag" style={{ color: note.color, background: `${note.color}18` }}>
                {note.subject}
              </span>
              <h3>{note.title}</h3>
              <p>{note.body}</p>
              <footer>
                <span>{formatDate(note.updatedAt)}</span>
                <div>
                  <button aria-label={`Edit ${note.title}`} onClick={() => openEdit(note)}>
                    <PenLine size={16} />
                  </button>
                  <button
                    aria-label={`Delete ${note.title}`}
                    onClick={() => {
                      setActiveNote(note);
                      setError('');
                      setModalMode('delete');
                    }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </footer>
            </article>
          ))}
        </div>
      )}

      {modalMode === 'edit' && (
        <Modal title={activeNote ? 'Edit note' : 'Create a note'} onClose={closeModal}>
          <form className="note-form" onSubmit={saveNote}>
            {error && <p className="form-error" role="alert">{error}</p>}
            <label>
              Title
              <input
                autoFocus
                maxLength={120}
                value={form.title}
                onChange={(event) => setForm({ ...form, title: event.target.value })}
                placeholder="e.g. Database normalization"
                required
              />
            </label>
            <label>
              Subject
              <input
                maxLength={80}
                list="note-subject-options"
                value={form.subject}
                onChange={(event) => setForm({ ...form, subject: event.target.value })}
                placeholder="e.g. Computer Science"
                required
              />
              <datalist id="note-subject-options">
                {subjects.map((subject) => <option key={subject} value={subject} />)}
              </datalist>
            </label>
            <label>
              Note
              <textarea
                maxLength={10000}
                rows={7}
                value={form.body}
                onChange={(event) => setForm({ ...form, body: event.target.value })}
                placeholder="Write your study notes..."
                required
              />
            </label>
            <div className="modal-actions">
              <button className="btn outline" type="button" onClick={closeModal} disabled={saving}>
                Cancel
              </button>
              <button className="btn primary" type="submit" disabled={saving}>
                {saving ? 'Saving...' : activeNote ? 'Save changes' : 'Create note'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {modalMode === 'delete' && (
        <Modal title="Delete note?" onClose={closeModal}>
          <p className="modal-copy">
            “{activeNote?.title}” will be permanently removed from your notes.
          </p>
          {error && <p className="form-error" role="alert">{error}</p>}
          <div className="modal-actions">
            <button className="btn outline" onClick={closeModal} disabled={saving}>Cancel</button>
            <button className="btn danger-btn" onClick={removeNote} disabled={saving}>
              {saving ? 'Deleting...' : 'Delete note'}
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
