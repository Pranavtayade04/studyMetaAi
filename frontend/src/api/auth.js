import request from './client.js';

export const signupRequest = ({ name, email, password }) =>
  request('/auth/signup', { method: 'POST', body: { name, email, password } });

export const loginRequest = ({ email, password }) =>
  request('/auth/login', { method: 'POST', body: { email, password } });

export const meRequest = (token) => request('/auth/me', { token });

export const updateProfileRequest = ({ name, email }, token) =>
  request('/auth/profile', { method: 'PUT', body: { name, email }, token });

export const updatePreferencesRequest = (preferences, token) =>
  request('/auth/preferences', { method: 'PUT', body: preferences, token });

export const deleteAccountRequest = (token) =>
  request('/auth/account', { method: 'DELETE', token });
