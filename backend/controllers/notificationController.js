import mongoose from 'mongoose';
import Notification from '../models/Notification.js';

export async function listNotifications(req, res) {
  try {
    const notifications = await Notification.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(30)
      .lean();

    const unreadCount = await Notification.countDocuments({
      userId: req.user._id,
      read: false,
    });

    res.json({
      notifications: notifications.map((n) => ({
        id: n._id,
        type: n.type,
        text: n.text,
        read: n.read,
        createdAt: n.createdAt,
      })),
      unreadCount,
    });
  } catch (error) {
    console.error('List notifications error:', error);
    res.status(500).json({ message: 'Could not load notifications.' });
  }
}

export async function markAsRead(req, res) {
  try {
    const { id } = req.params;
    if (id === 'all') {
      await Notification.updateMany({ userId: req.user._id, read: false }, { $set: { read: true } });
      return res.json({ message: 'All notifications marked as read.' });
    }

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: 'Invalid notification ID.' });
    }

    const notification = await Notification.findOneAndUpdate(
      { _id: id, userId: req.user._id },
      { $set: { read: true } },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found.' });
    }

    res.json({ message: 'Notification marked as read.' });
  } catch (error) {
    console.error('Mark notification read error:', error);
    res.status(500).json({ message: 'Could not update notification.' });
  }
}

export async function clearNotifications(req, res) {
  try {
    await Notification.deleteMany({ userId: req.user._id });
    res.json({ message: 'Notifications cleared.' });
  } catch (error) {
    console.error('Clear notifications error:', error);
    res.status(500).json({ message: 'Could not clear notifications.' });
  }
}
