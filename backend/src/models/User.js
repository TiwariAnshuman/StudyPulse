
import mongoose from "mongoose";
import argon2 from "argon2";

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
  },
);

// Password verification: caller must load passwordHash explicitly.
userSchema.methods.comparePassword = function (candidatePassword) {
  return argon2.verify(this.passwordHash, candidatePassword);
};

const User = mongoose.model("User", userSchema);

export default User;
