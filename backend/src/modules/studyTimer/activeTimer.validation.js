
import { z } from "zod";

// MongoDB ObjectId validation.
const objectIdSchema = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, "Invalid MongoDB ObjectId");

// Allowed study activity types.
const activityTypeSchema = z.enum([
  "Reading",
  "Lecture",
  "Practice questions",
  "Revision",
  "Mock test",
  "Other",
]);

// Start Timer request validation.
export const startTimerSchema = z
  .object({
    // Required for a general study timer.
    // Optional when a task is selected.
    subjectId: objectIdSchema.optional(),

    // Optional task link.
    taskId: objectIdSchema.optional(),

    // Activity type is required.
    activityType: activityTypeSchema,
  })
  .strict()
  .superRefine((data, ctx) => {
    // At least one ID must be provided.
    if (!data.subjectId && !data.taskId) {
      ctx.addIssue({
        code: "custom",
        message: "Either subjectId or taskId is required.",
        path: ["subjectId"],
      });
    }
  });
