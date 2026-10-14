import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema(
  {
    question: { type: String, required: true },
    options: {
      type: [String],
      required: true,
      validate: (options) => options.length === 4,
    },
    correctIndex: { type: Number, required: true, min: 0, max: 3 },
    explanation: { type: String, required: true },
  },
  { _id: false }
);

const quizSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    subject: { type: String, required: true },
    difficulty: { type: String, required: true },
    questions: { type: [questionSchema], required: true },
    answers: { type: [Number], default: [] },
    score: { type: Number, default: 0 },
    totalQuestions: { type: Number, default: 0 },
    completedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

quizSchema.index({ userId: 1, completedAt: -1 });

export default mongoose.model('Quiz', quizSchema);
