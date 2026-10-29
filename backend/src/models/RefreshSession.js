import mongoose from "mongoose";

const refreshSessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    tokenHash: {
      type: String,
      required: true,
      unique: true,
      select: false,
    },
    previousTokenHashes: {
      type: [String],
      default: [],
      select: false,
    },
    tokenVersion: {
      type: Number,
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    revokedAt: {
      type: Date,
      default: null,
    },
    lastUsedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true },
);

refreshSessionSchema.index(
  { expiresAt: 1 },
  { expireAfterSeconds: 0 },
);

const RefreshSession = mongoose.model(
  "RefreshSession",
  refreshSessionSchema,
);

export default RefreshSession;