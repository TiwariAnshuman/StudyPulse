
import { z } from "zod";

// ------------------------------------
// 1. Constants
// ------------------------------------

const TASK_PRIORITIES = ["Low", "Medium", "High"];

const TASK_STATUSES = [
  "To do",
  "In progress",
  "Completed",
];

// ------------------------------------
// 2. Date-only validation helper
// ------------------------------------

const dateOnlySchema = z
  .string()
  .regex(
    /^\d{4}-\d{2}-\d{2}$/,
    "Date must be in YYYY-MM-DD format"
  )
  .refine((value) => {
    const [year, month, day] = value.split("-").map(Number);

    const date = new Date(Date.UTC(year, month - 1, day));

    return (
      date.getUTCFullYear() === year &&
      date.getUTCMonth() === month - 1 &&
      date.getUTCDate() === day
    );
  }, "Please provide a valid calendar date");

// ------------------------------------
// 3. Reusable task fields
// ------------------------------------

const taskFields = {
  title: z
    .string()
    .trim()
    .min(1, "Task title is required")
    .max(120, "Task title cannot exceed 120 characters"),

  subjectId: z
    .string()
    .regex(
      /^[0-9a-fA-F]{24}$/,
      "Please provide a valid subject ID"
    ),

  topic: z
    .string()
    .trim()
    .nullable()
    .optional(),

  estimateMinutes: z
    .number()
    .int("Estimated duration must be a whole number")
    .min(1, "Estimated duration must be at least 1 minute")
    .nullable()
    .optional(),

  priority: z
    .enum(TASK_PRIORITIES)
    .optional(),

  plannedDate: dateOnlySchema.optional(),

  dueDate: dateOnlySchema
    .nullable()
    .optional(),

  status: z
    .enum(TASK_STATUSES)
    .optional(),

  notes: z
    .string()
    .trim()
    .max(1000, "Notes cannot exceed 1000 characters")
    .nullable()
    .optional(),
};

// ------------------------------------
// 4. Create Task Schema
// ------------------------------------

export const createTaskSchema = z
  .object(taskFields)
  .strict()
  .superRefine((data, ctx) => {
    if (
      data.dueDate &&
      data.plannedDate &&
      data.dueDate < data.plannedDate
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["dueDate"],
        message: "Due date cannot be before planned date",
      });
    }
  });

// ------------------------------------
// 5. Update Task Schema
// ------------------------------------

export const updateTaskSchema = z
  .object(taskFields)
  .partial()
  .strict()
  .superRefine((data, ctx) => {
    if (Object.keys(data).length === 0) {
      ctx.addIssue({
        code: "custom",
        message: "At least one field is required for update",
      });
    }

    if (
      data.dueDate &&
      data.plannedDate &&
      data.dueDate < data.plannedDate
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["dueDate"],
        message: "Due date cannot be before planned date",
      });
    }
  });
