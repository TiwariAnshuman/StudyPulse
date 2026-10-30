
import mongoose from "mongoose";

// Allowed task priorities
const TASK_PRIORITIES = ["Low", "Medium", "High"];

// Allowed task statuses
const TASK_STATUSES = ["To do", "In progress", "Completed"];

/**
 * Validates a date-only string in YYYY-MM-DD format.
 *
 * Example:
 * 2026-10-30 → valid
 * 2026-02-30 → invalid
 */
const isValidDateOnly = (value) => {
  if (typeof value !== "string") {
    return false;
  }

  const datePattern = /^\d{4}-\d{2}-\d{2}$/;

  if (!datePattern.test(value)) {
    return false;
  }

  const [year, month, day] = value.split("-").map(Number);

  if (year < 1 || month < 1 || month > 12) {
    return false;
  }

  const isLeapYear =
    year % 4 === 0 &&
    (year % 100 !== 0 || year % 400 === 0);

  const daysInMonth = [
    31,
    isLeapYear ? 29 : 28,
    31,
    30,
    31,
    30,
    31,
    31,
    30,
    31,
    30,
    31,
  ];

  return day >= 1 && day <= daysInMonth[month - 1];
};

// Task schema
const taskSchema = new mongoose.Schema(
  {
    // User who owns this task
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Task owner is required"],
      immutable: true,
    },

    // Subject associated with this task
    subjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subject",
      required: [true, "Subject is required"],
    },

    // Task title
    title: {
      type: String,
      required: [true, "Task title is required"],
      trim: true,
      minlength: [1, "Task title cannot be empty"],
      maxlength: [120, "Task title cannot exceed 120 characters"],
    },

    // Optional chapter or topic
    topic: {
      type: String,
      trim: true,
      default: null,
    },

    // Planned duration in minutes
    estimateMinutes: {
      type: Number,
      default: null,
      min: [1, "Estimated duration must be at least 1 minute"],
      validate: {
        validator: Number.isInteger,
        message: "Estimated duration must be a whole number",
      },
    },

    // Task priority
    priority: {
      type: String,
      enum: {
        values: TASK_PRIORITIES,
        message: "Priority must be Low, Medium, or High",
      },
      default: "Medium",
    },

    // Planned calendar date (YYYY-MM-DD)
    plannedDate: {
      type: String,
      required: [true, "Planned date is required"],
      validate: {
        validator: isValidDateOnly,
        message: "Planned date must be a valid YYYY-MM-DD date",
      },
    },

    // Optional deadline
    dueDate: {
      type: String,
      default: null,
      validate: {
        validator: function (value) {
          if (value === null || value === undefined) {
            return true;
          }

          if (!isValidDateOnly(value)) {
            return false;
          }

          // For document validation, compare valid ISO date strings.
          // Service validation will also enforce this on updates.
          if (
            this.plannedDate &&
            isValidDateOnly(this.plannedDate)
          ) {
            return value >= this.plannedDate;
          }

          return true;
        },
        message:
          "Due date must be valid and cannot be before the planned date",
      },
    },

    // Current task status
    status: {
      type: String,
      enum: {
        values: TASK_STATUSES,
        message: "Invalid task status",
      },
      default: "To do",
    },

    // Set when task becomes Completed
    // Cleared when task is reopened
    completedAt: {
      type: Date,
      default: null,
    },

    // Optional task notes
    notes: {
      type: String,
      trim: true,
      default: null,
      maxlength: [1000, "Notes cannot exceed 1000 characters"],
    },
  },
  {
    timestamps: true,
  }
);

// Index for today's and upcoming task queries
taskSchema.index({
  ownerId: 1,
  plannedDate: 1,
  status: 1,
});

// Index for overdue task queries
taskSchema.index({
  ownerId: 1,
  dueDate: 1,
  status: 1,
});

// Export Task model
const Task =
  mongoose.models.Task || mongoose.model("Task", taskSchema);

export default Task;
