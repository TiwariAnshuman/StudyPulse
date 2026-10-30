
import { z } from "zod";

// MongoDB ObjectId validation
const objectIdSchema = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, "Invalid MongoDB ObjectId");

// ISO date-time validation
// Offset is required, e.g. +05:30 or Z
const dateTimeSchema = z
  .iso
  .datetime({
    offset: true,
  })
  .transform((value) => new Date(value));

// Allowed study activity types
const activityTypeSchema = z.enum([
  "Reading",
  "Lecture",
  "Practice questions",
  "Revision",
  "Mock test",
  "Other",
]);

// Create manual study session
export const createStudySessionSchema = z
  .object({
    subjectId: objectIdSchema.optional(),

    taskId: objectIdSchema.nullable().optional(),

    startAt: dateTimeSchema,

    endAt: dateTimeSchema,

    activityType: activityTypeSchema,

    topic: z
      .string()
      .trim()
      .max(100, "Topic cannot exceed 100 characters")
      .nullable()
      .optional(),

    notes: z
      .string()
      .trim()
      .max(1000, "Notes cannot exceed 1000 characters")
      .nullable()
      .optional(),
  })
  .strict()
  .superRefine((data, ctx) => {
    const now = Date.now();

    const startTime = data.startAt.getTime();
    const endTime = data.endAt.getTime();

    // Subject is required unless a task is linked.
    if (!data.subjectId && !data.taskId) {
      ctx.addIssue({
        code: "custom",
        path: ["subjectId"],
        message: "Subject is required when no task is linked",
      });
    }

    // Start time cannot be in the future.
    if (startTime > now) {
      ctx.addIssue({
        code: "custom",
        path: ["startAt"],
        message: "Start time cannot be in the future",
      });
    }

    // End time cannot be in the future.
    if (endTime > now) {
      ctx.addIssue({
        code: "custom",
        path: ["endAt"],
        message: "End time cannot be in the future",
      });
    }

    // End time must be after start time.
    if (endTime <= startTime) {
      ctx.addIssue({
        code: "custom",
        path: ["endAt"],
        message: "End time must be after start time",
      });

      return;
    }

    // Maximum session duration: 12 hours.
    const durationMs = endTime - startTime;
    const maxDurationMs = 12 * 60 * 60 * 1000;

    if (durationMs > maxDurationMs) {
      ctx.addIssue({
        code: "custom",
        path: ["endAt"],
        message: "Study session cannot exceed 12 hours",
      });
    }
  });
