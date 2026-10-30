import mongoose from "mongoose";

const pauseEventSchema = new mongoose.Schema(
  {
    pausedAt: {
      type: Date,
      required: true,
    },
    resumedAt: {
      type: Date,
      default: null,
    },
    durationSeconds: {
      type: Number,
      default: null,
      min: 0,
    },
  },
  { _id: false }
);

const studySessionSchema = new mongoose.Schema(
  {
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      immutable: true,
    },

    subjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subject",
      required: true,
    },

    subjectNameSnapshot: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50,
    },

    taskId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Task",
      default: null,
    },

    taskTitleSnapshot: {
      type: String,
      default: null,
      trim: true,
      maxlength: 120,
    },

    // Reference to the timer that generated this session.
    // Manual sessions do not have this field.
    sourceTimerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ActiveTimer",
      default: undefined,
    },

    startAt: {
      type: Date,
      required: true,
    },

    endAt: {
      type: Date,
      required: true,
    },

    durationSeconds: {
      type: Number,
      required: true,
      min: 1,
      max: 43200,
    },

    activityType: {
      type: String,
      required: true,
      enum: [
        "Reading",
        "Lecture",
        "Practice questions",
        "Revision",
        "Mock test",
        "Other",
      ],
    },

    pauseEvents: {
      type: [pauseEventSchema],
      default: [],
    },

    sessionDate: {
      type: String,
      required: true,
      match: /^\d{4}-\d{2}-\d{2}$/,
    },

    topic: {
      type: String,
      default: null,
      trim: true,
      maxlength: 100,
    },

    notes: {
      type: String,
      default: null,
      trim: true,
      maxlength: 1000,
    },

    source: {
      type: String,
      required: true,
      enum: ["timer", "manual"],
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Session history indexes
studySessionSchema.index({
  ownerId: 1,
  sessionDate: -1,
});

studySessionSchema.index({
  ownerId: 1,
  subjectId: 1,
  sessionDate: -1,
});

studySessionSchema.index({
  ownerId: 1,
  taskId: 1,
  sessionDate: -1,
});

studySessionSchema.index({
  ownerId: 1,
  activityType: 1,
  sessionDate: -1,
});

// Prevent duplicate sessions from the same timer.
studySessionSchema.index(
  { sourceTimerId: 1 },
  {
    unique: true,
    sparse: true,
  }
);

const StudySession =
  mongoose.models.StudySession ||
  mongoose.model("StudySession", studySessionSchema);

export default StudySession;