
import mongoose from "mongoose";

const subjectSchema = new mongoose.Schema(
  {
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50,
    },

    key: {
      type: String,
      required: true,
      trim: true,
    },

    color: {
      type: String,
      required: true,
      default: "#426B57",
      match: /^#[0-9A-Fa-f]{6}$/,
    },

    archivedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Same user cannot create duplicate normalized subjects.
subjectSchema.index(
  { ownerId: 1, key: 1 },
  { unique: true }
);

const Subject =
  mongoose.models.Subject ||
  mongoose.model("Subject", subjectSchema);

export default Subject;