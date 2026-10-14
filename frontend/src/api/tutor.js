import request from './client.js';

export const tutorChatRequest = (messages, token) =>
  request('/tutor/chat', { method: 'POST', body: { messages }, token });
