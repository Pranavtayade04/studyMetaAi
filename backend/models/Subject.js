import mongoose from 'mongoose';

const subjectSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 80,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 500,
      default: '',
    },
    lessonCount: {
      type: Number,
      min: 0,
      max: 10000,
      default: 0,
      validate: Number.isInteger,
    },
    progressPercent: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
      validate: Number.isInteger,
    },
    color: {
      type: String,
      required: true,
      match: /^#[0-9a-fA-F]{6}$/,
    },
  },
  { timestamps: true }
);

subjectSchema.index({ userId: 1, name: 1 }, { unique: true });
subjectSchema.index({ userId: 1, updatedAt: -1 });

export default mongoose.model('Subject', subjectSchema);
