
import mongoose from "mongoose";

const { Schema } = mongoose;

const isPlainObject = (value) => {
  return (
    value !== null &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    Object.getPrototypeOf(value) === Object.prototype
  );
};

const testResultSchema = new Schema(
  {
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },

    testDate: {
      type: String,
      required: true,
      match: /^\d{4}-\d{2}-\d{2}$/,
    },

    marksObtained: {
      type: Number,
      required: true,
      validate: {
        validator(value) {
          if (!Number.isFinite(value)) return false;

          if (value < 0) {
            return (
              this.scoringScheme?.penaltyPerIncorrect < 0 &&
              this.counts?.incorrect > 0
            );
          }

          return true;
        },
        message:
          "Negative marks require a negative-marking scheme and incorrect answers.",
      },
    },

    maxMarks: {
      type: Number,
      required: true,
      min: [0.01, "maxMarks must be greater than zero."],
      validate: {
        validator: Number.isFinite,
        message: "maxMarks must be a valid number.",
      },
    },

    examType: {
      type: String,
      trim: true,
      default: undefined,
    },

    scoringScheme: {
      type: Schema.Types.Mixed,
      default: null,
      validate: {
        validator(value) {
          return value === null || isPlainObject(value);
        },
        message: "scoringScheme must be an object or null.",
      },
    },

    counts: {
      type: Schema.Types.Mixed,
      default: null,
      validate: {
        validator(value) {
          return value === null || isPlainObject(value);
        },
        message: "counts must be an object or null.",
      },
    },

    subjectResults: {
      type: Schema.Types.Mixed,
      default: null,
      validate: {
        validator(value) {
          return value === null || Array.isArray(value);
        },
        message: "subjectResults must be an array or null.",
      },
    },

    durationMinutes: {
      type: Number,
      min: [1, "durationMinutes must be at least 1."],
      validate: {
        validator(value) {
          return value === undefined || Number.isInteger(value);
        },
        message: "durationMinutes must be a whole number.",
      },
      default: undefined,
    },

    notes: {
      type: String,
      trim: true,
      default: undefined,
    },

    linkedSessionId: {
      type: Schema.Types.ObjectId,
      ref: "StudySession",
      default: null,
    },

    linkedTaskIds: {
      type: [
        {
          type: Schema.Types.ObjectId,
          ref: "Task",
        },
      ],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

// Overall obtained marks cannot exceed maximum marks.
testResultSchema.pre("validate", function () {
  if (
    Number.isFinite(this.marksObtained) &&
    Number.isFinite(this.maxMarks) &&
    this.marksObtained > this.maxMarks
  ) {
    this.invalidate(
      "marksObtained",
      "marksObtained cannot exceed maxMarks."
    );
  }
});

testResultSchema.index({
  ownerId: 1,
  testDate: -1,
});

const TestResult =
  mongoose.models.TestResult ||
  mongoose.model("TestResult", testResultSchema);

export default TestResult;
