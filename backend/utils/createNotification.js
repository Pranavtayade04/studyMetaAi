import mongoose from 'mongoose';
import Notification from '../models/Notification.js';

export default async function createNotification(userId, type, text) {
  if (!mongoose.isValidObjectId(userId)) {
    return null;
  }
  try {
    return await Notification.create({
      userId,
      type,
      text: text.trim(),
    });
  } catch (error) {
    console.error('Failed to create notification:', error.message);
    return null;
  }
}
