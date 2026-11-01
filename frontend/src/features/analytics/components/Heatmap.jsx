
import { useMemo, useRef, useState } from "react";
import { CalendarDays, CheckCircle2, Clock3 } from "lucide-react";
import { formatDurationFromMinutes } from "../analytics.utils";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const LEVEL_STYLES = {
  0: "bg-muted border-border",
  1: "bg-emerald-200 border-emerald-200",
  2: "bg-emerald-400 border-emerald-400",
  3: "bg-emerald-600 border-emerald-600",
  4: "bg-emerald-800 border-emerald-800",
};

const STATE_STYLES = {
  future: "bg-muted/40 border-dashed border-border",
  unavailable: "bg-muted/20 border-dashed border-border",
  "no-entry": "bg-muted border-border",
};

function parseLocalDate(dateString) {
  if (!dateString) return null;

  const [year, month, day] = dateString.split("-").map(Number);

  if (!year || !month || !day) return null;

  return new Date(year, month - 1, day);
}

function getMondayFirstDay(date) {
  return (date.getDay() + 6) % 7;
}

function formatFullDate(dateString) {
  const date = parseLocalDate(dateString);

  if (!date) return "Unknown date";

  return date.toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatMonth(dateString) {
  const date = parseLocalDate(dateString);

  if (!date) return "";

  return date.toLocaleDateString("en-IN", {
    month: "short",
    year: "numeric",
  });
}

function formatCellState(cell) {
  switch (cell.state) {
    case "recorded":
      return `${cell.durationMinutes ?? 0} minutes recorded`;

    case "no-entry":
      return "No study session recorded";

    case "unavailable":
      return "Study data unavailable";

    case "future":
      return "Future date";

    default:
      return "Unknown status";
  }
}

function getCellLabel(cell) {
  const date = formatFullDate(cell.date);
  const state = formatCellState(cell);

  if (cell.state !== "recorded") {
    return `${date}. ${state}.`;
  }

  return `${date}. ${state}. ${
    cell.sessionCount ?? 0
  } sessions.`;
}

function getCellStyle(cell) {
  if (cell.state !== "recorded") {
    return STATE_STYLES[cell.state] || STATE_STYLES["no-entry"];
  }

  return LEVEL_STYLES[cell.level] || LEVEL_STYLES[0];
}

function getThresholdLegend(legend) {
  if (!Array.isArray(legend) || legend.length === 0) {
    return [
      { label: "No recorded study", style: LEVEL_STYLES[0] },
      { label: "1–29 min", style: LEVEL_STYLES[1] },
      { label: "30–89 min", style: LEVEL_STYLES[2] },
      { label: "90–179 min", style: LEVEL_STYLES[3] },
      { label: "180+ min", style: LEVEL_STYLES[4] },
    ];
  }

  return legend.map((item, index) => {
    const level = item.level ?? index;

    return {
      label:
        item.label ??
        item.description ??
        `Level ${level}`,
      style: LEVEL_STYLES[level] || LEVEL_STYLES[0],
    };
  });
}

function HeatmapCell({ cell, selected, onSelect, cellRef, onKeyDown }) {
  return (
    <button
      ref={cellRef}
      type="button"
      onClick={() => onSelect(cell)}
      onKeyDown={onKeyDown}
      aria-label={getCellLabel(cell)}
      aria-pressed={selected}
      title={getCellLabel(cell)}
      className={`
        h-7 w-7 sm:h-8 sm:w-8
        rounded-md border
        transition-all duration-150
        hover:ring-2 hover:ring-primary/40
        focus-visible:outline-none
        focus-visible:ring-2 focus-visible:ring-primary
        focus-visible:ring-offset-2
        ${getCellStyle(cell)}
        ${selected ? "ring-2 ring-primary ring-offset-2" : ""}
      `}
    >
      {cell.state === "recorded" && (
        <span className="sr-only">
          Level {cell.level}
        </span>
      )}

      {cell.state === "unavailable" && (
        <span className="sr-only">Unavailable</span>
      )}

      {cell.state === "future" && (
        <span className="sr-only">Future</span>
      )}
    </button>
  );
}

function SelectedDayDetails({ cell }) {
  if (!cell) {
    return (
      <div className="rounded-xl border border-border bg-muted/20 p-4">
        <p className="text-sm text-muted-foreground">
          Select a date to view its study details.
        </p>
      </div>
    );
  }

  const dateLabel = formatFullDate(cell.date);

  let statusMessage = "";

  if (cell.state === "no-entry") {
    statusMessage = "No study session was recorded for this date.";
  } else if (cell.state === "unavailable") {
    statusMessage = "Study data is unavailable for this date.";
  } else if (cell.state === "future") {
    statusMessage = "This date is in the future.";
  } else {
    statusMessage = "Study activity recorded.";
  }

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">
            Selected date
          </p>

          <h3 className="mt-1 font-semibold text-foreground">
            {dateLabel}
          </h3>
        </div>

        {cell.state === "recorded" && (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-400">
            <CheckCircle2 size={13} />
            Recorded
          </span>
        )}
      </div>

      <p className="mt-3 text-sm text-muted-foreground">
        {statusMessage}
      </p>

      {cell.state === "recorded" && (
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <div className="rounded-lg bg-muted/40 p-3">
            <p className="text-xs text-muted-foreground">
              Study duration
            </p>

            <p className="mt-1 font-semibold text-foreground">
              {formatDurationFromMinutes(cell.durationMinutes ?? 0)}
            </p>
          </div>

          <div className="rounded-lg bg-muted/40 p-3">
            <p className="text-xs text-muted-foreground">
              Sessions
            </p>

            <p className="mt-1 font-semibold text-foreground">
              {cell.sessionCount ?? 0}
            </p>
          </div>

          {typeof cell.goalReached === "boolean" && (
            <div className="rounded-lg bg-muted/40 p-3">
              <p className="text-xs text-muted-foreground">
                Daily goal
              </p>

              <p className="mt-1 font-semibold text-foreground">
                {cell.goalReached ? "Reached" : "Not reached"}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function Heatmap({ data }) {
  const [selectedCell, setSelectedCell] = useState(null);

  const cellRefs = useRef([]);

  const cells = Array.isArray(data?.cells) ? data.cells : [];

  const legend = useMemo(
    () => getThresholdLegend(data?.legend),
    [data?.legend]
  );

  const calendarCells = useMemo(() => {
    if (!cells.length) return [];

    const firstDate = parseLocalDate(cells[0].date);

    if (!firstDate) return cells;

    const leadingEmptyCells = getMondayFirstDay(firstDate);

    return [
      ...Array.from({ length: leadingEmptyCells }, (_, index) => ({
        type: "empty",
        id: `empty-${index}`,
      })),
      ...cells.map((cell) => ({
        ...cell,
        type: "date",
      })),
    ];
  }, [cells]);

  const handleKeyDown = (event, index) => {
    const columns = 7;
    let nextIndex = index;

    switch (event.key) {
      case "ArrowRight":
        nextIndex = index + 1;
        break;

      case "ArrowLeft":
        nextIndex = index - 1;
        break;

      case "ArrowDown":
        nextIndex = index + columns;
        break;

      case "ArrowUp":
        nextIndex = index - columns;
        break;

      default:
        return;
    }

    event.preventDefault();

    const nextCell = calendarCells[nextIndex];

    if (nextCell?.type === "date") {
      cellRefs.current[nextIndex]?.focus();
    }
  };

  if (!cells.length) {
    return (
      <section className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-center gap-2">
          <CalendarDays size={19} className="text-muted-foreground" />

          <h2 className="font-semibold text-foreground">
            Study consistency
          </h2>
        </div>

        <div className="mt-6 rounded-lg bg-muted/20 px-4 py-8 text-center">
          <CalendarDays
            size={28}
            className="mx-auto text-muted-foreground"
          />

          <p className="mt-3 font-medium text-foreground">
            No heatmap data available
          </p>

          <p className="mt-1 text-sm text-muted-foreground">
            Study activity will appear here when calendar data is available.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-xl border border-border bg-card p-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <CalendarDays
              size={19}
              className="text-muted-foreground"
            />

            <h2 className="font-semibold text-foreground">
              Study consistency
            </h2>
          </div>

          <p className="mt-1 text-sm text-muted-foreground">
            Your recorded study activity across the selected period.
          </p>
        </div>

        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Clock3 size={14} />
          <span>{cells.length} days</span>
        </div>
      </div>

      {/* Calendar */}
      <div className="mt-6 overflow-x-auto pb-2">
        <div className="min-w-[310px]">
          {/* Weekday labels */}
          <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
            {WEEKDAYS.map((day) => (
              <div
                key={day}
                className="pb-2 text-center text-xs text-muted-foreground"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar cells */}
          <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
            {calendarCells.map((cell, index) => {
              if (cell.type === "empty") {
                return (
                  <div
                    key={cell.id}
                    aria-hidden="true"
                    className="h-7 w-7 sm:h-8 sm:w-8"
                  />
                );
              }

              return (
                <HeatmapCell
                  key={cell.date}
                  cell={cell}
                  selected={selectedCell?.date === cell.date}
                  onSelect={setSelectedCell}
                  cellRef={(element) => {
                    cellRefs.current[index] = element;
                  }}
                  onKeyDown={(event) => handleKeyDown(event, index)}
                />
              );
            })}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="mt-5 border-t border-border pt-4">
        <p className="mb-3 text-xs font-medium text-muted-foreground">
          Study duration levels
        </p>

        <div className="flex flex-wrap gap-x-4 gap-y-2">
          {legend.map((item, index) => (
            <div
              key={`${item.label}-${index}`}
              className="flex items-center gap-2"
            >
              <span
                className={`h-3.5 w-3.5 rounded-sm border ${item.style}`}
                aria-hidden="true"
              />

              <span className="text-xs text-muted-foreground">
                {item.label}
              </span>
            </div>
          ))}
        </div>

        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2">
          {[
            ["No entry", STATE_STYLES["no-entry"]],
            ["Unavailable", STATE_STYLES.unavailable],
            ["Future", STATE_STYLES.future],
          ].map(([label, style]) => (
            <div key={label} className="flex items-center gap-2">
              <span
                className={`h-3.5 w-3.5 rounded-sm border ${style}`}
                aria-hidden="true"
              />

              <span className="text-xs text-muted-foreground">
                {label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Selected day details */}
      <div className="mt-5">
        <SelectedDayDetails cell={selectedCell} />
      </div>
    </section>
  );
}
