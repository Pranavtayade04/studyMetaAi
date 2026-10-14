import mongoose from 'mongoose';

const noteSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    body: {
      type: String,
      required: true,
      trim: true,
      maxlength: 10000,
    },
    subject: {
      type: String,
      required: true,
      trim: true,
      maxlength: 80,
    },
    color: {
      type: String,
      default: '#796bff',
      match: /^#[0-9a-fA-F]{6}$/,
    },
  },
  { timestamps: true }
);

noteSchema.index({ userId: 1, updatedAt: -1 });

export default mongoose.model('Note', noteSchema);
