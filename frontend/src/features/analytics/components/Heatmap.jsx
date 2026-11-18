import { Fragment, useMemo, useRef, useState } from "react";
import { CalendarDays, CheckCircle2 } from "lucide-react";
import { formatDurationFromMinutes } from "../analytics.utils";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

// Intensity ramp (levels 1 to 4) comes from the primary green; see tailwind.config.js.
// Light cells use dark day numbers and dark cells use white ones.
const LEVEL_STYLES = {
  0: "border-line bg-tint text-muted",
  1: "border-heat-1 bg-heat-1 text-ink",
  2: "border-heat-2 bg-heat-2 text-ink",
  3: "border-heat-3 bg-heat-3 text-white",
  4: "border-heat-4 bg-heat-4 text-white",
};

const SWATCH_STYLES = {
  0: "border-line bg-tint",
  1: "border-heat-1 bg-heat-1",
  2: "border-heat-2 bg-heat-2",
  3: "border-heat-3 bg-heat-3",
  4: "border-heat-4 bg-heat-4",
};

const STATE_STYLES = {
  future: "border-dashed border-line-strong bg-transparent text-muted",
  unavailable:
    "border-dashed border-line-strong bg-canvas text-muted [background-image:repeating-linear-gradient(135deg,transparent_0_4px,#DDE2DC_4px_5px)]",
  "no-entry": "border-line bg-tint text-muted",
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

function formatMonthShort(date) {
  return date.toLocaleDateString("en-IN", { month: "short" });
}

function formatCellState(cell) {
  switch (cell.state) {
    case "recorded":
      return `${cell.durationMinutes ?? 0} minutes recorded`;

    case "no-entry":
      return "No entry";

    case "unavailable":
      return "Unavailable, before your account was created";

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

  return `${date}. ${state}. ${cell.sessionCount ?? 0} sessions.`;
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
      { label: "1–29 min", level: 1 },
      { label: "30–89 min", level: 2 },
      { label: "90–179 min", level: 3 },
      { label: "180+ min", level: 4 },
    ];
  }

  return legend
    .map((item, index) => ({
      label: item.label ?? item.description ?? `Level ${item.level ?? index}`,
      level: item.level ?? index,
    }))
    .filter((item) => item.level > 0);
}

function HeatmapCell({ cell, selected, tabIndex, onSelect, cellRef, onKeyDown }) {
  const day = parseLocalDate(cell.date)?.getDate();

  return (
    <button
      ref={cellRef}
      type="button"
      tabIndex={tabIndex}
      onClick={() => onSelect(cell)}
      onKeyDown={onKeyDown}
      aria-label={getCellLabel(cell)}
      aria-pressed={selected}
      className={`flex aspect-square w-full items-center justify-center rounded-control border text-xs font-medium transition-colors hover:border-ink ${getCellStyle(
        cell
      )} ${selected ? "ring-2 ring-ink ring-offset-2 ring-offset-surface" : ""}`}
    >
      <span aria-hidden="true">{day}</span>
    </button>
  );
}

function SelectedDayDetails({ cell }) {
  if (!cell) {
    return (
      <div className="rounded-panel bg-canvas p-4">
        <p className="text-sm text-muted">
          Select a day to see its study details.
        </p>
      </div>
    );
  }

  let statusMessage = "Study activity recorded.";

  if (cell.state === "no-entry") {
    statusMessage =
      "No entry for this date. This does not mean you did not study.";
  } else if (cell.state === "unavailable") {
    statusMessage = "This date is before your account was created.";
  } else if (cell.state === "future") {
    statusMessage = "This date is in the future.";
  }

  return (
    <div className="rounded-panel border border-line p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs text-muted">Selected day</p>

          <h3 className="mt-1 font-semibold text-ink">
            {formatFullDate(cell.date)}
          </h3>
        </div>

        {cell.state === "recorded" && (
          <span className="inline-flex items-center gap-1 rounded-control bg-primary-subtle px-2 py-1 text-xs font-medium text-primary">
            <CheckCircle2 size={14} />
            Recorded
          </span>
        )}
      </div>

      <p className="mt-3 text-sm text-muted">{statusMessage}</p>

      {cell.state === "recorded" && (
        <dl className="mt-4 grid grid-cols-2 gap-3">
          <div className="rounded-control bg-canvas p-3">
            <dt className="text-xs text-muted">Study time</dt>
            <dd className="mt-1 font-semibold text-ink">
              {formatDurationFromMinutes(cell.durationMinutes ?? 0)}
            </dd>
          </div>

          <div className="rounded-control bg-canvas p-3">
            <dt className="text-xs text-muted">Sessions</dt>
            <dd className="mt-1 font-semibold text-ink">
              {cell.sessionCount ?? 0}
            </dd>
          </div>

          {typeof cell.goalReached === "boolean" && (
            <div className="col-span-2 rounded-control bg-canvas p-3">
              <dt className="text-xs text-muted">Daily target</dt>
              <dd className="mt-1 font-semibold text-ink">
                {cell.goalReached ? "Reached" : "Not reached"}
              </dd>
            </div>
          )}
        </dl>
      )}
    </div>
  );
}

export default function Heatmap({ data }) {
  const [selectedCell, setSelectedCell] = useState(null);
  const [focusIndex, setFocusIndex] = useState(null);

  const cellRefs = useRef([]);

  const cells = useMemo(
    () => (Array.isArray(data?.cells) ? data.cells.filter((c) => c?.date) : []),
    [data?.cells]
  );

  const legend = useMemo(
    () => getThresholdLegend(data?.legend),
    [data?.legend]
  );

  // Cells are consecutive dates, so rows of seven are built from the first weekday.
  const weeks = useMemo(() => {
    if (!cells.length) return [];

    const firstDate = parseLocalDate(cells[0].date);
    const leading = firstDate ? getMondayFirstDay(firstDate) : 0;

    const slots = [
      ...Array.from({ length: leading }, () => null),
      ...cells.map((cell, index) => ({ cell, index })),
    ];

    const rows = [];

    for (let start = 0; start < slots.length; start += 7) {
      rows.push(slots.slice(start, start + 7));
    }

    return rows;
  }, [cells]);

  // Only one day is a tab stop; arrow keys move between days (roving tabindex).
  const selectedIndex = selectedCell
    ? cells.findIndex((cell) => cell.date === selectedCell.date)
    : -1;

  let fallbackIndex = cells.length - 1;

  while (fallbackIndex > 0 && cells[fallbackIndex].state === "future") {
    fallbackIndex -= 1;
  }

  const tabStopIndex = Math.min(
    Math.max(
      focusIndex ?? (selectedIndex >= 0 ? selectedIndex : fallbackIndex),
      0
    ),
    Math.max(cells.length - 1, 0)
  );

  function handleKeyDown(event, index) {
    const weekday = getMondayFirstDay(parseLocalDate(cells[index].date));
    let nextIndex = index;

    switch (event.key) {
      case "ArrowRight":
        nextIndex = index + 1;
        break;

      case "ArrowLeft":
        nextIndex = index - 1;
        break;

      case "ArrowDown":
        nextIndex = index + 7;
        break;

      case "ArrowUp":
        nextIndex = index - 7;
        break;

      case "Home":
        nextIndex = index - weekday;
        break;

      case "End":
        nextIndex = index + (6 - weekday);
        break;

      default:
        return;
    }

    event.preventDefault();

    nextIndex = Math.min(Math.max(nextIndex, 0), cells.length - 1);

    setFocusIndex(nextIndex);
    cellRefs.current[nextIndex]?.focus();
  }

  if (!cells.length) {
    return (
      <div className="card px-4 py-8 text-center">
        <CalendarDays size={24} className="mx-auto text-muted" />

        <p className="mt-3 font-medium text-ink">No calendar data yet</p>

        <p className="mt-1 text-sm text-muted">
          Study activity will appear here once calendar data is available.
        </p>
      </div>
    );
  }

  return (
    <div className="card p-4 sm:p-5">
      <div className="lg:grid lg:grid-cols-[minmax(0,460px)_minmax(0,1fr)] lg:gap-8">
        {/* Calendar: one row per week, Monday first */}
        <div>
          <p className="mb-3 text-sm text-muted">
            {cells.length} {cells.length === 1 ? "day" : "days"}, Monday to
            Sunday
          </p>

          <div className="grid grid-cols-[2.25rem_repeat(7,minmax(0,1fr))] gap-1.5 sm:gap-2">
            <div aria-hidden="true" />

            {WEEKDAYS.map((day) => (
              <div
                key={day}
                aria-hidden="true"
                className="pb-1 text-center text-xs text-muted"
              >
                {day}
              </div>
            ))}

            {weeks.map((week, weekIndex) => {
              // Month name on the first row of each new month.
              const firstSlot = week.find(Boolean);
              const rowDate = parseLocalDate(firstSlot?.cell.date);
              const previousSlot =
                weekIndex > 0 ? weeks[weekIndex - 1].find(Boolean) : null;
              const previousDate = parseLocalDate(previousSlot?.cell.date);

              const labelDate =
                rowDate &&
                (!previousDate || previousDate.getMonth() !== rowDate.getMonth())
                  ? rowDate
                  : null;

              return (
                <Fragment key={weekIndex}>
                <div
                  className="flex items-center text-xs font-medium text-muted"
                >
                  {labelDate ? formatMonthShort(labelDate) : ""}
                </div>

                {Array.from({ length: 7 }, (_, column) => {
                  const slot = week[column];

                  if (!slot) {
                    return <div key={`${weekIndex}-${column}`} aria-hidden="true" />;
                  }

                  return (
                    <HeatmapCell
                      key={slot.cell.date}
                      cell={slot.cell}
                      selected={selectedCell?.date === slot.cell.date}
                      tabIndex={slot.index === tabStopIndex ? 0 : -1}
                      onSelect={(cell) => {
                        setSelectedCell(cell);
                        setFocusIndex(slot.index);
                      }}
                      cellRef={(element) => {
                        cellRefs.current[slot.index] = element;
                      }}
                      onKeyDown={(event) => handleKeyDown(event, slot.index)}
                    />
                  );
                })}
                </Fragment>
              );
            })}
          </div>
        </div>

        {/* Selected day and legend */}
        <div className="mt-5 space-y-5 lg:mt-0">
          <div aria-live="polite">
            <SelectedDayDetails cell={selectedCell} />
          </div>

          <div>
            <p className="mb-2 text-xs font-medium text-muted">
              Study time per day
            </p>

            <ul className="flex flex-wrap gap-x-4 gap-y-2">
              {legend.map((item) => (
                <li key={item.level} className="flex items-center gap-2">
                  <span
                    aria-hidden="true"
                    className={`h-4 w-4 rounded-sm border ${SWATCH_STYLES[item.level]}`}
                  />
                  <span className="text-xs text-muted">{item.label}</span>
                </li>
              ))}
            </ul>

            <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-2">
              <li className="flex items-center gap-2">
                <span
                  aria-hidden="true"
                  className="h-4 w-4 rounded-sm border border-line bg-tint"
                />
                <span className="text-xs text-muted">No entry</span>
              </li>

              <li className="flex items-center gap-2">
                <span
                  aria-hidden="true"
                  className="h-4 w-4 rounded-sm border border-dashed border-line-strong bg-canvas [background-image:repeating-linear-gradient(135deg,transparent_0_3px,#DDE2DC_3px_4px)]"
                />
                <span className="text-xs text-muted">Unavailable</span>
              </li>

              <li className="flex items-center gap-2">
                <span
                  aria-hidden="true"
                  className="h-4 w-4 rounded-sm border border-dashed border-line-strong"
                />
                <span className="text-xs text-muted">Future</span>
              </li>
            </ul>

            <p className="mt-3 text-xs text-muted">
              Numbers in the squares are the day of the month. A square
              marked No entry does not mean you did not study.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
