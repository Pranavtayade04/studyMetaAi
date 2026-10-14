import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import tutorRoutes from './routes/tutorRoutes.js';
import quizRoutes from './routes/quizRoutes.js';
import noteRoutes from './routes/noteRoutes.js';
import subjectRoutes from './routes/subjectRoutes.js';
import adminRoutes from './routes/adminRoutes.js';

import path from 'path';
import { fileURLToPath } from 'url';
import notificationRoutes from './routes/notificationRoutes.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '.env') });
dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// Simple health-check route so we can confirm the server is running
// independently of the database/auth logic.
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'StudyMeta AI backend is running' });
});

app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/tutor', tutorRoutes);
app.use('/api/quiz', quizRoutes);
app.use('/api/notes', noteRoutes);
app.use('/api/subjects', subjectRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/notifications', notificationRoutes);

const PORT = process.env.PORT || 5000;

// Connect to MongoDB first, then start listening for requests —
// this avoids the server accepting traffic before the database is ready.
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`StudyMeta AI backend listening on port ${PORT}`);
  });
});

export default app;
