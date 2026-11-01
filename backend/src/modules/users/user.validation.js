
import { z } from "zod";

// Validate supported IANA timezone.
export const isValidIanaTimezone = (timezone) => {
  if (typeof timezone !== "string" || !timezone.trim()) {
    return false;
  }

  try {
    new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
    });

    return true;
  } catch {
    return false;
  }
};

// All three boundaries are required when thresholds are updated.
const heatmapThresholdsSchema = z
  .object({
    level1MaxMinutes: z.number().int().min(1),
    level2MaxMinutes: z.number().int().min(2),
    level3MaxMinutes: z.number().int().min(3),
  })
  .strict()
  .superRefine((thresholds, ctx) => {
    if (
      thresholds.level1MaxMinutes >=
      thresholds.level2MaxMinutes
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["level2MaxMinutes"],
        message: "Level 2 must be greater than Level 1.",
      });
    }

    if (
      thresholds.level2MaxMinutes >=
      thresholds.level3MaxMinutes
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["level3MaxMinutes"],
        message: "Level 3 must be greater than Level 2.",
      });
    }
  });

export const updateUserSettingsSchema = z
  .object({
    displayName: z
      .string()
      .trim()
      .min(2, "Name must be at least 2 characters.")
      .max(50, "Name cannot exceed 50 characters.")
      .optional(),

    timezone: z
      .string()
      .trim()
      .min(1, "Timezone is required.")
      .max(100, "Timezone is too long.")
      .refine(isValidIanaTimezone, {
        message: "Timezone must be a valid IANA timezone.",
      })
      .optional(),

    examPreset: z
      .string()
      .trim()
      .min(1, "Exam preset cannot be empty.")
      .optional(),

    dailyTargetMinutes: z
      .number()
      .int("Daily target must be an integer.")
      .positive("Daily target must be greater than zero.")
      .nullable()
      .optional(),

    heatmapThresholds: heatmapThresholdsSchema.optional(),
  })
  .strict()
  .refine(
    (data) =>
      data.displayName !== undefined ||
      data.timezone !== undefined ||
      data.examPreset !== undefined ||
      data.dailyTargetMinutes !== undefined ||
      data.heatmapThresholds !== undefined,
    {
      message: "At least one setting must be provided.",
    }
  );
