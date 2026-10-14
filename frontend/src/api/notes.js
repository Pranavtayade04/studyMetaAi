import request from './client.js';

export const listNotesRequest = (token, { search = '', subject = '' } = {}) => {
  const params = new URLSearchParams();
  if (search) params.set('search', search);
  if (subject) params.set('subject', subject);
  const query = params.toString();
  return request(`/notes${query ? `?${query}` : ''}`, { token });
};

export const createNoteRequest = (note, token) =>
  request('/notes', { method: 'POST', body: note, token });

export const updateNoteRequest = (id, note, token) =>
  request(`/notes/${encodeURIComponent(id)}`, { method: 'PUT', body: note, token });

export const deleteNoteRequest = (id, token) =>
  request(`/notes/${encodeURIComponent(id)}`, { method: 'DELETE', token });
