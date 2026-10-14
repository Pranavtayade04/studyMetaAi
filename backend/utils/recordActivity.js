import ActivityLog from '../models/ActivityLog.js';

export default async function recordActivity(userId, type, text) {
  try {
    await ActivityLog.create({ userId, type, text });
  } catch (error) {
    console.error('Activity logging failed:', { type, error });
  }
}
