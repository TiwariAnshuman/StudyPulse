
import { z } from "zod";

import {
  isValidDateOnly,
} from "./utils/dateRange.js";

// Analytics date range is limited to 90 inclusive
// calendar days in the initial implementation.
const MAX_ANALYTICS_RANGE_DAYS = 90;

// Convert YYYY-MM-DD into a UTC calendar-day number.
// This is for date comparison only, not timezone conversion.
const getCalendarDayNumber = (dateOnly) => {
  const [year, month, day] = dateOnly
    .split("-")
    .map(Number);

  const date = new Date(0);

  date.setUTCFullYear(year, month - 1, day);
  date.setUTCHours(0, 0, 0, 0);

  return Math.floor(date.getTime() / 86400000);
};

// Shared validation for all Analytics endpoints.
export const analyticsDateRangeSchema = z
  .object({
    from: z
      .string({
        error: "from is required.",
      })
      .refine(isValidDateOnly, {
        message: "from must be a valid YYYY-MM-DD date.",
      }),

    to: z
      .string({
        error: "to is required.",
      })
      .refine(isValidDateOnly, {
        message: "to must be a valid YYYY-MM-DD date.",
      }),
  })
  .strict()
  .superRefine((range, ctx) => {
    // Avoid date calculations when either date is invalid.
    if (
      !isValidDateOnly(range.from) ||
      !isValidDateOnly(range.to)
    ) {
      return;
    }

    if (range.from > range.to) {
      ctx.addIssue({
        code: "custom",
        path: ["to"],
        message: "to cannot be before from.",
      });

      return;
    }

    const fromDay = getCalendarDayNumber(range.from);
    const toDay = getCalendarDayNumber(range.to);

    const inclusiveRangeDays = toDay - fromDay + 1;

    if (inclusiveRangeDays > MAX_ANALYTICS_RANGE_DAYS) {
      ctx.addIssue({
        code: "custom",
        path: ["to"],
        message: `Analytics date range cannot exceed ${MAX_ANALYTICS_RANGE_DAYS} calendar days.`,
      });
    }
  });
