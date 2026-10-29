
import { z } from "zod";

const subjectNameSchema = z
  .string()
  .trim()
  .min(1, "Subject name is required")
  .max(50, "Subject name cannot exceed 50 characters");

const subjectColorSchema = z
  .string()
  .regex(
    /^#[0-9A-Fa-f]{6}$/,
    "Color must be a valid hex color, such as #426B57"
  );

export const createSubjectSchema = z
  .object({
    name: subjectNameSchema,
    color: subjectColorSchema.optional(),
  })
  .strict();

export const updateSubjectSchema = z
  .object({
    name: subjectNameSchema.optional(),
    color: subjectColorSchema.optional(),
    archived: z.boolean().optional(),
  })
  .strict()
  .refine(
    (data) => Object.keys(data).length > 0,
    "At least one field must be provided"
  );
