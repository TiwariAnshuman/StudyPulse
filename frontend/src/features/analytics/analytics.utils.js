
/**
 * StudyPulse Analytics Utilities
 *
 * Common formatting helpers used across analytics components.
 */

// --------------------------------------------------
// NUMBER FORMATTING
// --------------------------------------------------

/**
 * Format a valid number.
 *
 * Example:
 * 1250 -> "1,250"
 * null -> "—"
 */
export function formatNumber(value, maximumFractionDigits = 0) {
  if (!Number.isFinite(value)) {
    return "—";
  }

  return new Intl.NumberFormat(undefined, {
    maximumFractionDigits,
  }).format(value);
}

// --------------------------------------------------
// PERCENTAGE FORMATTING
// --------------------------------------------------

/**
 * Format a percentage value.
 *
 * Example:
 * 75.456 -> "75.5%"
 * 0 -> "0%"
 * null -> "—"
 */
export function formatPercentage(value, decimals = 1) {
  if (!Number.isFinite(value)) {
    return "—";
  }

  return `${formatNumber(value, decimals)}%`;
}

// --------------------------------------------------
// DURATION FORMATTING
// --------------------------------------------------

/**
 * Convert seconds into readable hours and minutes.
 *
 * Example:
 * 3660 -> "1h 1m"
 * 3600 -> "1h"
 * 1800 -> "30m"
 */
export function formatDurationFromSeconds(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) {
    return "—";
  }

  const totalMinutes = Math.round(seconds / 60);

  return formatDurationFromMinutes(totalMinutes);
}

/**
 * Convert minutes into readable hours and minutes.
 *
 * Example:
 * 125 -> "2h 5m"
 * 60 -> "1h"
 * 45 -> "45m"
 * 0 -> "0m"
 */
export function formatDurationFromMinutes(minutes) {
  if (!Number.isFinite(minutes) || minutes < 0) {
    return "—";
  }

  const totalMinutes = Math.round(minutes);

  const hours = Math.floor(totalMinutes / 60);
  const remainingMinutes = totalMinutes % 60;

  if (hours === 0) {
    return `${remainingMinutes}m`;
  }

  if (remainingMinutes === 0) {
    return `${hours}h`;
  }

  return `${hours}h ${remainingMinutes}m`;
}

// --------------------------------------------------
// DATE FORMATTING
// --------------------------------------------------

/**
 * Safely parse a date.
 *
 * Date-only values are parsed as local calendar dates
 * to avoid unexpected timezone date shifts.
 */
function parseDate(value) {
  if (!value) {
    return null;
  }

  if (typeof value !== "string" && !(value instanceof Date)) {
    return null;
  }

  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split("-").map(Number);

    const date = new Date(year, month - 1, day);

    // Reject invalid calendar dates.
    if (
      date.getFullYear() !== year ||
      date.getMonth() !== month - 1 ||
      date.getDate() !== day
    ) {
      return null;
    }

    return date;
  }

  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? null : date;
}

/**
 * Format a date according to the user's locale.
 *
 * Example:
 * "2026-10-31" -> "31 Oct 2026"
 */
export function formatDate(value, options = {}) {
  const date = parseDate(value);

  if (!date) {
    return "—";
  }

  return new Intl.DateTimeFormat(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    ...options,
  }).format(date);
}

/**
 * Format a date range.
 *
 * Example:
 * "2026-10-01", "2026-10-31"
 * -> "01 Oct 2026 – 31 Oct 2026"
 */
export function formatDateRange(from, to) {
  if (!from || !to) {
    return "—";
  }

  const formattedFrom = formatDate(from);
  const formattedTo = formatDate(to);

  if (formattedFrom === "—" || formattedTo === "—") {
    return "—";
  }

  return `${formattedFrom} – ${formattedTo}`;
}

// --------------------------------------------------
// METRIC DISPLAY HELPERS
// --------------------------------------------------

/**
 * Return a display-friendly metric value.
 *
 * Important:
 * null and undefined mean unavailable.
 * Zero is a valid value and must remain visible.
 */
export function getMetricValue(value, formatter = formatNumber) {
  if (value === null || value === undefined) {
    return "—";
  }

  return formatter(value);
}

/**
 * Check whether a metric contains valid numeric data.
 */
export function hasValidMetric(value) {
  return Number.isFinite(value);
}
