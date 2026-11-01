
import { CalendarDays, ChevronDown } from "lucide-react";

const DAY_IN_MS = 24 * 60 * 60 * 1000;
const MAX_RANGE_DAYS = 90;

// Date ko local timezone ke according YYYY-MM-DD mein convert karta hai.
function formatDateInput(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

// Local date string ko Date object mein convert karta hai.
function parseDateInput(value) {
  if (!value) return null;

  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day);

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }

  return date;
}

function getPresetRange(preset) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const to = formatDateInput(today);
  let fromDate = new Date(today);

  switch (preset) {
    case "7days":
      fromDate.setDate(today.getDate() - 6);
      break;

    case "30days":
      fromDate.setDate(today.getDate() - 29);
      break;

    case "thisMonth":
      fromDate = new Date(today.getFullYear(), today.getMonth(), 1);
      break;

    default:
      fromDate.setDate(today.getDate() - 6);
  }

  return {
    preset,
    from: formatDateInput(fromDate),
    to,
  };
}

function getRangeDays(from, to) {
  const start = parseDateInput(from);
  const end = parseDateInput(to);

  if (!start || !end) return 0;

  return Math.floor((end - start) / DAY_IN_MS) + 1;
}

const presets = [
  { label: "Last 7 days", value: "7days" },
  { label: "Last 30 days", value: "30days" },
  { label: "This month", value: "thisMonth" },
  { label: "Custom range", value: "custom" },
];

export default function DateRangeSelector({
  value,
  onChange,
}) {
  const selectedPreset = value?.preset || "7days";
  const from = value?.from || getPresetRange("7days").from;
  const to = value?.to || getPresetRange("7days").to;

  const isCustom = selectedPreset === "custom";

  function handlePresetChange(preset) {
    if (preset === "custom") {
      onChange({
        preset: "custom",
        from,
        to,
      });
      return;
    }

    onChange(getPresetRange(preset));
  }

  function handleDateChange(field, nextValue) {
    const nextRange = {
      preset: "custom",
      from: field === "from" ? nextValue : from,
      to: field === "to" ? nextValue : to,
    };

    const start = parseDateInput(nextRange.from);
    const end = parseDateInput(nextRange.to);

    if (!start || !end) {
      onChange(nextRange);
      return;
    }

    if (end < start) return;

    if (getRangeDays(nextRange.from, nextRange.to) > MAX_RANGE_DAYS) {
      return;
    }

    onChange(nextRange);
  }

  const rangeDays = getRangeDays(from, to);
  const hasValidRange =
    Boolean(parseDateInput(from)) &&
    Boolean(parseDateInput(to)) &&
    rangeDays > 0 &&
    rangeDays <= MAX_RANGE_DAYS;

  return (
    <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <CalendarDays
              size={17}
              className="text-[var(--muted-foreground)]"
            />
            <h3 className="text-sm font-semibold text-[var(--foreground)]">
              Date range
            </h3>
          </div>

          <p className="text-xs text-[var(--muted-foreground)]">
            Choose the period for your analytics.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {presets.map((preset) => {
            const active = selectedPreset === preset.value;

            return (
              <button
                key={preset.value}
                type="button"
                onClick={() => handlePresetChange(preset.value)}
                aria-pressed={active}
                className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                  active
                    ? "border-[var(--foreground)] bg-[var(--foreground)] text-[var(--background)]"
                    : "border-[var(--border)] bg-transparent text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]"
                }`}
              >
                {preset.label}
              </button>
            );
          })}
        </div>

        {isCustom && (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="analytics-from"
                className="text-xs font-medium text-[var(--muted-foreground)]"
              >
                Start date
              </label>

              <input
                id="analytics-from"
                type="date"
                value={from}
                max={to || formatDateInput(new Date())}
                onChange={(event) =>
                  handleDateChange("from", event.target.value)
                }
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] outline-none focus:border-[var(--foreground)]"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="analytics-to"
                className="text-xs font-medium text-[var(--muted-foreground)]"
              >
                End date
              </label>

              <input
                id="analytics-to"
                type="date"
                value={to}
                min={from}
                max={formatDateInput(new Date())}
                onChange={(event) =>
                  handleDateChange("to", event.target.value)
                }
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] outline-none focus:border-[var(--foreground)]"
              />
            </div>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[var(--border)] pt-3">
          <p className="text-xs text-[var(--muted-foreground)]">
            {hasValidRange
              ? `${rangeDays} ${rangeDays === 1 ? "day" : "days"} selected`
              : "Select a valid date range"}
          </p>

          {isCustom && (
            <p className="text-xs text-[var(--muted-foreground)]">
              Maximum range: 90 days
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
