import request from './client.js';

export const generateQuizRequest = (settings, token) =>
  request('/quiz/generate', { method: 'POST', body: settings, token });

export const gradeQuizRequest = (quizId, answers, token) =>
  request('/quiz/grade', { method: 'POST', body: { quizId, answers }, token });
