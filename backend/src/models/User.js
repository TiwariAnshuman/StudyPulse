
import mongoose from "mongoose";
import argon2 from "argon2";

// Heatmap levels use upper boundaries.
// L1: 1–29, L2: 30–89, L3: 90–179, L4: 180+
const heatmapThresholdSchema = new mongoose.Schema(
  {
    level1MaxMinutes: {
      type: Number,
      required: true,
      min: 1,
      default: 29,
      validate: {
        validator: Number.isInteger,
        message: "level1MaxMinutes must be a whole number.",
      },
    },

    level2MaxMinutes: {
      type: Number,
      required: true,
      min: 2,
      default: 89,
      validate: {
        validator: Number.isInteger,
        message: "level2MaxMinutes must be a whole number.",
      },
    },

    level3MaxMinutes: {
      type: Number,
      required: true,
      min: 3,
      default: 179,
      validate: {
        validator: Number.isInteger,
        message: "level3MaxMinutes must be a whole number.",
      },
    },
  },
  {
    _id: false,
  }
);

// Boundaries must be strictly increasing.
heatmapThresholdSchema.pre("validate", function () {
  if (
    this.level1MaxMinutes >= this.level2MaxMinutes ||
    this.level2MaxMinutes >= this.level3MaxMinutes
  ) {
    this.invalidate(
      "level3MaxMinutes",
      "Heatmap thresholds must be strictly increasing."
    );
  }
});

const userSchema = new mongoose.Schema(
  {
    displayName: {
      type: String,
      required: true,
      trim: true,
    },

    emailNormalized: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      unique: true,
      index: true,
    },

    passwordHash: {
      type: String,
      required: true,
      select: false,
    },

    timezone: {
      type: String,
      required: true,
      default: "Asia/Kolkata",
    },

    examPreset: {
      type: String,
      trim: true,
      default: undefined,
    },

    dailyTargetMinutes: {
      type: Number,
      min: 1,
      validate: {
        validator: Number.isInteger,
        message: "dailyTargetMinutes must be a whole number",
      },
      default: undefined,
    },

    heatmapThresholds: {
      type: heatmapThresholdSchema,
      default: () => ({}),
    },

    onboardingCompletedAt: {
      type: Date,
      default: undefined,
    },

    tokenVersion: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,

    toJSON: {
      transform(_document, returnedObject) {
        delete returnedObject.passwordHash;
        delete returnedObject.tokenVersion;
        delete returnedObject.__v;
        return returnedObject;
      },
    },
  }
);

// Password verification: caller must load passwordHash explicitly.
userSchema.methods.comparePassword = function (candidatePassword) {
  return argon2.verify(this.passwordHash, candidatePassword);
};

const User = mongoose.model("User", userSchema);

export default User;
