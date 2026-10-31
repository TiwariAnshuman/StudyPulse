
const DATE_ONLY_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const SEARCH_WINDOW_MS = 36 * 60 * 60 * 1000;

const createDateRangeError = (message, code) => {
  const error = new Error(message);
  error.statusCode = 400;
  error.code = code;
  return error;
};

// Validate YYYY-MM-DD as an actual calendar date.
export const isValidDateOnly = (value) => {
  if (
    typeof value !== "string" ||
    !DATE_ONLY_REGEX.test(value)
  ) {
    return false;
  }

  const [year, month, day] = value.split("-").map(Number);

  // Avoid Date.UTC's special handling of years 0–99.
  const date = new Date(0);
  date.setUTCFullYear(year, month - 1, day);
  date.setUTCHours(0, 0, 0, 0);

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
};

const assertValidTimezone = (timezone) => {
  if (typeof timezone !== "string" || !timezone.trim()) {
    throw createDateRangeError(
      "A valid IANA timezone is required.",
      "INVALID_TIMEZONE"
    );
  }

  try {
    new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
    });
  } catch {
    throw createDateRangeError(
      "Timezone must be a valid IANA timezone.",
      "INVALID_TIMEZONE"
    );
  }
};

const getLocalDateAt = (instant, timezone, formatter) => {
  const parts = formatter.formatToParts(instant);
  const values = {};

  for (const part of parts) {
    if (part.type !== "literal") {
      values[part.type] = part.value;
    }
  }

  return `${values.year}-${values.month}-${values.day}`;
};

// Add calendar days, not fixed 24-hour durations.
export const addCalendarDays = (dateOnly, days) => {
  if (!isValidDateOnly(dateOnly) || !Number.isInteger(days)) {
    throw createDateRangeError(
      "A valid date and integer day offset are required.",
      "INVALID_DATE_OPERATION"
    );
  }

  const [year, month, day] = dateOnly.split("-").map(Number);

  const date = new Date(0);
  date.setUTCFullYear(year, month - 1, day);
  date.setUTCHours(0, 0, 0, 0);
  date.setUTCDate(date.getUTCDate() + days);

  const result = [
    String(date.getUTCFullYear()).padStart(4, "0"),
    String(date.getUTCMonth() + 1).padStart(2, "0"),
    String(date.getUTCDate()).padStart(2, "0"),
  ].join("-");

  if (!isValidDateOnly(result)) {
    throw createDateRangeError(
      "Date is outside the supported YYYY-MM-DD range.",
      "DATE_OUT_OF_RANGE"
    );
  }

  return result;
};

// Find the first UTC millisecond belonging to a local calendar date.
// Binary search avoids assuming that every local day is exactly 24 hours.
export const getStartOfLocalDateUtc = (
  dateOnly,
  timezone,
  { allowSkippedDate = false } = {}
) => {
  if (!isValidDateOnly(dateOnly)) {
    throw createDateRangeError(
      "Date must be a valid YYYY-MM-DD calendar date.",
      "INVALID_DATE"
    );
  }

  assertValidTimezone(timezone);

  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  const [year, month, day] = dateOnly.split("-").map(Number);

  const nominalUtc = new Date(0);
  nominalUtc.setUTCFullYear(year, month - 1, day);
  nominalUtc.setUTCHours(0, 0, 0, 0);

  let low = nominalUtc.getTime() - SEARCH_WINDOW_MS;
  let high = nominalUtc.getTime() + SEARCH_WINDOW_MS;

  // The lower boundary must be before the requested local date.
  if (getLocalDateAt(new Date(low), timezone, formatter) >= dateOnly) {
    throw createDateRangeError(
      "Could not resolve the beginning of this local date.",
      "DATE_BOUNDARY_RESOLUTION_FAILED"
    );
  }

  // The upper boundary must be on or after the requested local date.
  if (getLocalDateAt(new Date(high), timezone, formatter) < dateOnly) {
    throw createDateRangeError(
      "Could not resolve the beginning of this local date.",
      "DATE_BOUNDARY_RESOLUTION_FAILED"
    );
  }

  // Find the first instant whose local calendar date is >= dateOnly.
  while (low + 1 < high) {
    const middle = Math.floor((low + high) / 2);
    const localDate = getLocalDateAt(
      new Date(middle),
      timezone,
      formatter
    );

    if (localDate >= dateOnly) {
      high = middle;
    } else {
      low = middle;
    }
  }

  const boundary = new Date(high);
  const resolvedLocalDate = getLocalDateAt(
    boundary,
    timezone,
    formatter
  );

  // Some timezones have historically skipped an entire calendar date.
  if (
    resolvedLocalDate !== dateOnly &&
    !allowSkippedDate
  ) {
    throw createDateRangeError(
      `${dateOnly} does not exist in timezone ${timezone}.`,
      "DATE_NOT_EXIST_IN_TIMEZONE"
    );
  }

  return boundary;
};

// Resolve an inclusive local date range into UTC boundaries.
// Database queries should use: date >= startUtc AND date < endUtcExclusive.
export const resolveAnalyticsDateRange = ({
  from,
  to,
  timezone,
}) => {
  if (!isValidDateOnly(from)) {
    throw createDateRangeError(
      "from must be a valid YYYY-MM-DD date.",
      "INVALID_FROM_DATE"
    );
  }

  if (!isValidDateOnly(to)) {
    throw createDateRangeError(
      "to must be a valid YYYY-MM-DD date.",
      "INVALID_TO_DATE"
    );
  }

  if (from > to) {
    throw createDateRangeError(
      "from cannot be after to.",
      "INVALID_DATE_RANGE"
    );
  }

  assertValidTimezone(timezone);

  const nextDay = addCalendarDays(to, 1);

  const startUtc = getStartOfLocalDateUtc(
    from,
    timezone
  );

  const endUtcExclusive = getStartOfLocalDateUtc(
    nextDay,
    timezone,
    { allowSkippedDate: true }
  );

  return {
    from,
    to,
    timezone,
    startUtc,
    endUtcExclusive,
  };
};
