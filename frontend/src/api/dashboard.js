import request from './client.js';

export const dashboardSummaryRequest = (token) =>
  request('/dashboard/summary', { token });

export const dashboardProgressRequest = (token) =>
  request('/dashboard/progress', { token });
