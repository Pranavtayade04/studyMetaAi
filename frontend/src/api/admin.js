import request from './client.js';

export const adminOverviewRequest = (token) =>
  request('/admin/overview', { token });
