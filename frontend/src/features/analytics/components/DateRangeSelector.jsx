import { useState } from "react";

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

export default function DateRangeSelector({ value, onChange }) {
  const selectedPreset = value?.preset || "7days";
  const from = value?.from || getPresetRange("7days").from;
  const to = value?.to || getPresetRange("7days").to;

  const isCustom = selectedPreset === "custom";

  // Message shown when a chosen custom range is refused (display only).
  const [rangeMessage, setRangeMessage] = useState("");

  function handlePresetChange(preset) {
    setRangeMessage("");

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
      setRangeMessage("");
      onChange(nextRange);
      return;
    }

    if (end < start) {
      setRangeMessage("The end date must be on or after the start date.");
      return;
    }

    if (getRangeDays(nextRange.from, nextRange.to) > MAX_RANGE_DAYS) {
      setRangeMessage(`Choose a range of ${MAX_RANGE_DAYS} days or fewer.`);
      return;
    }

    setRangeMessage("");
    onChange(nextRange);
  }

  const rangeDays = getRangeDays(from, to);
  const hasValidRange =
    Boolean(parseDateInput(from)) &&
    Boolean(parseDateInput(to)) &&
    rangeDays > 0 &&
    rangeDays <= MAX_RANGE_DAYS;

  return (
    <section aria-label="Date range" className="card p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div
          role="group"
          aria-label="Choose the period for your analytics"
          className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap"
        >
          {presets.map((preset) => {
            const active = selectedPreset === preset.value;

            return (
              <button
                key={preset.value}
                type="button"
                onClick={() => handlePresetChange(preset.value)}
                aria-pressed={active}
                className={`btn border ${
                  active
                    ? "border-primary bg-primary text-white"
                    : "border-line-strong bg-surface text-ink hover:bg-tint"
                }`}
              >
                {preset.label}
              </button>
            );
          })}
        </div>

        <p className="text-sm text-muted" aria-live="polite">
          {hasValidRange
            ? `${rangeDays} ${rangeDays === 1 ? "day" : "days"} selected`
            : "Select a valid date range"}
          {isCustom && ` · up to ${MAX_RANGE_DAYS} days`}
        </p>
      </div>

      {isCustom && (
        <div className="mt-4 border-t border-line pt-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="analytics-from" className="field-label">
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
                className="field"
              />
            </div>

            <div>
              <label htmlFor="analytics-to" className="field-label">
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
                className="field"
              />
            </div>
          </div>

          {rangeMessage && (
            <p role="alert" className="mt-3 text-sm text-danger">
              {rangeMessage}
            </p>
          )}
        </div>
      )}
    </section>
  );
}
