# StudyMeta AI

An AI-powered study assistant — React frontend + Express backend + MongoDB.

## Project structure

```
studymeta-ai/
├── frontend/          React + Vite app (the UI)
│   └── src/
│       ├── main.jsx        Entry point — mounts <App/>
│       ├── App.jsx         All routes (react-router-dom)
│       ├── styles.css      All styling (unchanged from original design)
│       ├── components/     Reusable pieces (Logo, Modal, AppShell, etc.)
│       ├── pages/          One file per page (Dashboard, Tutor, Quiz, etc.)
│       └── data/           Temporary mock data (replaced by API calls in later phases)
│
└── backend/           Express API server
    ├── server.js          App entry point
    ├── routes/            API route definitions (added from Phase 1 onward)
    ├── controllers/       Route handler logic (added from Phase 1 onward)
    ├── models/            Mongoose schemas (added from Phase 1 onward)
    └── .env.example       Documents required environment variables
```

## Current status

- **Phase 0 (done):** original UI fully preserved, split into readable files, real client-side routing (react-router-dom).
- **Phase 1 (done):** real authentication — signup, login, JWT sessions, protected routes, and role-based authorization, with MongoDB connected via Mongoose.
- **Phase 2 (done):** AI Tutor chat is connected to Gemini through an authenticated backend endpoint.
- **Phase 3 (done):** AI Quiz generates questions with Gemini, keeps answer keys server-side, grades submissions, and records quiz activity.
- **Phase 4 (done):** Notes and Subjects are stored per user in MongoDB, with authenticated create, edit, delete, search, and subject filtering. Subjects are available in Quiz setup, and subject cards link to subject-filtered Notes.
- **Phase 5 (done):** Progress is calculated from completed quiz results and recent activity history, including per-subject quiz performance.
- **Phase 6 (done):** Admins can view platform totals, the latest user accounts, and recent activity through an admin-only dashboard and API. The dashboard is read-only; admin roles must be provisioned directly in the database.
- **Phase 7 (in progress):** Admin role provisioning is easier through a dedicated bootstrap script, and the backend test suite continues to cover authorization and local setup helpers.

## Running the frontend

```bash
cd frontend
npm install
npm run dev
```
Runs at http://localhost:5173

## Running the backend

```bash
cd backend
npm install
copy .env.example .env # then set JWT_SECRET and a valid GEMINI_API_KEY
npm run dev
```
Runs at http://localhost:5000

By default, the backend uses the local MongoDB database `studymate` at
`mongodb://127.0.0.1:27017/studymate`. Set `MONGODB_URI` in `backend/.env` to
your Atlas URI if you use Atlas instead. MongoDB Compass must connect to the
same server or cluster as `MONGODB_URI`; for the local default, connect to
`mongodb://127.0.0.1:27017` and refresh the `studymate` database. Collections
are created when records are first saved, so an empty collection list before
a successful registration or other write is expected.

The AI Tutor uses `GEMINI_API_KEY` only on the backend. The default model is
`gemini-3.8-flash`; set `GEMINI_MODEL` in `backend/.env` to use another model
available to your Gemini API key.

## Testing

Run backend unit tests with:

```bash
cd backend
npm test
```

Create or upgrade an admin account locally with:

```bash
cd backend
npm run make-admin -- admin@example.com "Study Admin" "ChangeMe123!"
```

Build the frontend production bundle with:

```bash
cd frontend
npm run build
```

## Deployment readiness

Use the example env files before starting the app anywhere outside local development:

```bash
cd backend
copy .env.example .env

cd ../frontend
copy .env.example .env
```

Required backend values:
- `MONGODB_URI` — MongoDB connection string
- `JWT_SECRET` — long secret used for auth tokens
- `GEMINI_API_KEY` — Google Gemini API key used only in the backend
- `PORT` — optional backend port; defaults to 5000

Frontend value:
- `VITE_API_URL` — optional override if the backend is not served from `http://localhost:5000/api`

This repo also includes a GitHub Actions CI workflow that runs the backend tests and frontend build automatically on push and pull requests.

## Roadmap

See project notes for the full phase-by-phase plan:
Auth → Dashboard → AI Tutor (Gemini) → AI Quiz (Gemini) → Notes/Subjects →
Progress tracking → Basic Admin → Settings (minimal) → Testing & polish.
