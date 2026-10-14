// Base URL of the Express backend. Overridable via frontend/.env
// (VITE_API_URL) if the backend runs somewhere other than localhost —
// this is just an address, not a secret, so it's fine on the frontend.
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default async function request(path, { method = 'GET', body, token } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;

  let res;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch (networkError) {
    // The backend server isn't reachable at all (not running, wrong URL, etc.)
    throw new Error('Could not reach the server. Is the backend running?');
  }

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    // Use the backend's specific error message when it sent one
    // (e.g. "Invalid email or password."), otherwise fall back to something generic.
    throw new Error(data.message || 'Something went wrong. Please try again.');
  }

  return data;
}
