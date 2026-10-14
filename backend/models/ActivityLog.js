import mongoose from 'mongoose';

const activityLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['tutor', 'notes', 'quiz', 'subjects', 'progress', 'auth'],
      required: true,
    },
    text: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
  },
  { timestamps: true }
);

export default mongoose.model('ActivityLog', activityLogSchema);
