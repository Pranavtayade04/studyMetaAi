import request from './client.js';

export const listSubjectsRequest = (token) => request('/subjects', { token });

export const createSubjectRequest = (subject, token) =>
  request('/subjects', { method: 'POST', body: subject, token });

export const updateSubjectRequest = (id, subject, token) =>
  request(`/subjects/${encodeURIComponent(id)}`, { method: 'PUT', body: subject, token });

export const deleteSubjectRequest = (id, token) =>
  request(`/subjects/${encodeURIComponent(id)}`, { method: 'DELETE', token });
