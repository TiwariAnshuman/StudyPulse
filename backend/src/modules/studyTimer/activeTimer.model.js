
import mongoose from "mongoose";

// Stores individual pause and resume events.
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
  {
    _id: false,
  }
);

const activeTimerSchema = new mongoose.Schema(
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

    startAt: {
      type: Date,
      required: true,
    },

    runningSince: {
      type: Date,
      default: null,
    },

    accumulatedSeconds: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
      validate: {
        validator(value) {
          return Number.isFinite(value);
        },
        message: "accumulatedSeconds must be a finite number.",
      },
    },

    status: {
      type: String,
      required: true,
      enum: ["running", "paused"],
      default: "running",
    },

    pauseEvents: {
      type: [pauseEventSchema],
      default: [],
    },

    // Stores the finish timestamp while the session is being saved.
    finishAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Validate status and runningSince relationship.
activeTimerSchema.pre("validate", function () {
  if (this.status === "running") {
    const validRunningSince =
      this.runningSince instanceof Date &&
      !Number.isNaN(this.runningSince.getTime());

    if (!validRunningSince) {
      this.invalidate(
        "runningSince",
        "runningSince must be set when running."
      );
    }
  }

  if (this.status === "paused" && this.runningSince !== null) {
    this.invalidate(
      "runningSince",
      "runningSince must be null when paused."
    );
  }
});

// Only one active timer per user.
activeTimerSchema.index(
  { ownerId: 1 },
  { unique: true }
);

const ActiveTimer =
  mongoose.models.ActiveTimer ||
  mongoose.model("ActiveTimer", activeTimerSchema);

export default ActiveTimer;
