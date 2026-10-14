import request from './client.js';

export const listNotificationsRequest = (token) =>
  request('/notifications', { token });

export const markNotificationReadRequest = (id, token) =>
  request(`/notifications/${encodeURIComponent(id)}/read`, {
    method: 'PUT',
    token,
  });

export const markAllNotificationsReadRequest = (token) =>
  request('/notifications/read-all', {
    method: 'PUT',
    token,
  });

export const clearNotificationsRequest = (token) =>
  request('/notifications', {
    method: 'DELETE',
    token,
  });
