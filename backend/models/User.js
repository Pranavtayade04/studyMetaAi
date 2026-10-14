import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    // Stores the bcrypt HASH of the password — never the plain text.
    // See controllers/authController.js for where the hashing happens.
    passwordHash: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ['student', 'admin'],
      default: 'student',
    },
    currentStreak: {
      type: Number,
      default: 0,
      min: 0,
    },
    lastActiveDate: {
      type: Date,
      default: null,
    },
    preferences: {
      language: {
        type: String,
        enum: ['English', 'Hindi', 'Marathi'],
        default: 'English',
      },
      dailyReminder: {
        type: Boolean,
        default: true,
      },
      weeklyReport: {
        type: Boolean,
        default: false,
      },
    },
  },
  { timestamps: true } // adds createdAt / updatedAt automatically
);

// Derives 2-letter initials from the name (e.g. "Pranav Tayade" -> "PT"),
// used by the sidebar/header avatar in the UI. Computed on the fly instead
// of stored, so it always matches the current name.
userSchema.methods.getInitials = function () {
  return this.name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('');
};

// Shapes a user document into exactly what's safe to send to the frontend.
// passwordHash is deliberately left out.
userSchema.methods.toPublicJSON = function () {
  return {
    id: this._id,
    name: this.name,
    email: this.email,
    role: this.role,
    initials: this.getInitials(),
    preferences: this.preferences || {
      language: 'English',
      dailyReminder: true,
      weeklyReport: false,
    },
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

export default mongoose.model('User', userSchema);
