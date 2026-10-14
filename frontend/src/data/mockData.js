// TEMPORARY MOCK DATA
// This file exists only until the backend is connected (Phase 3 onward).
// Once real API endpoints exist, these exports will be replaced by data
// fetched from the server — the component code that uses them won't
// need to change shape, only where the data comes from.
//
// NOTE: as of Phase 1, 'profile' now comes from useAuth() (real logged-in
// user data) instead of from here — see AppShell.jsx and Settings.jsx.

export const subjects = [
  ['Mathematics', '12 lessons', '78%', '#796bff'],
  ['Computer Science', '9 lessons', '65%', '#3cb99b'],
  ['English', '7 lessons', '82%', '#f09b5b'],
  ['Database Systems', '10 lessons', '54%', '#e06b91'],
];
