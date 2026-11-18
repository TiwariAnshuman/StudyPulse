import { useMemo, useRef, useState } from "react";

import { HEATMAP_TARGET_MINUTES, buildHeatmap } from "../../sampleData";
import { formatMinutes, useMediaQuery } from "../../hooks";

const CELL_STYLES = {
  1: "border-heat-1 bg-heat-1 text-ink",
  2: "border-heat-2 bg-heat-2 text-ink",
  3: "border-heat-3 bg-heat-3 text-white",
  4: "border-heat-4 bg-heat-4 text-white",
  "no-entry": "border-line bg-tint text-muted",
  future: "border-dashed border-line-strong bg-transparent text-muted",
  unavailable:
    "border-dashed border-line-strong bg-canvas text-muted [background-image:repeating-linear-gradient(135deg,transparent_0_4px,#DDE2DC_4px_5px)]",
};

function cellStyle(cell) {
  return cell.state === "recorded" ? CELL_STYLES[cell.level] : CELL_STYLES[cell.state];
}

function longDate(date) {
  return date.toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

function describe(cell) {
  switch (cell.state) {
    case "recorded":
      return `${formatMinutes(cell.minutes)} recorded in ${cell.sessions} ${
        cell.sessions === 1 ? "session" : "sessions"
      }`;
    case "no-entry":
      return "No entry";
    case "unavailable":
      return "Unavailable, before the account was created";
    default:
      return "Future date";
  }
}

const LEGEND = [
  { label: "No entry", className: CELL_STYLES["no-entry"] },
  { label: "1–29 min", className: CELL_STYLES[1] },
  { label: "30–89 min", className: CELL_STYLES[2] },
  { label: "90–179 min", className: CELL_STYLES[3] },
  { label: "180+ min", className: CELL_STYLES[4] },
  { label: "Unavailable", className: CELL_STYLES.unavailable },
  { label: "Future", className: CELL_STYLES.future },
];

export function HeatmapLegend() {
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-2">
      {LEGEND.map((item) => (
        <li key={item.label} className="flex items-center gap-2">
          <span
            aria-hidden="true"
            className={`h-3.5 w-3.5 rounded-sm border ${item.className}`}
          />
          <span className="text-xs text-muted">{item.label}</span>
        </li>
      ))}
    </ul>
  );
}

// Calendar grid: one column per week, Monday to Sunday down each column.
// interactive=true: day buttons with arrow-key movement (one tab stop).
// interactive=false: a quiet, decorative version of the same grid.
export default function HeatmapGrid({ interactive = false, weeks: weeksProp }) {
  const wide = useMediaQuery("(min-width: 640px)");
  const weeks = weeksProp ?? (wide ? 12 : 8);

  const cells = useMemo(() => buildHeatmap(weeks), [weeks]);

  const lastRecorded = useMemo(() => {
    for (let index = cells.length - 1; index >= 0; index -= 1) {
      if (cells[index].state === "recorded") return index;
    }

    return 0;
  }, [cells]);

  const [selected, setSelected] = useState(null);
  const [tabStop, setTabStop] = useState(null);
  const refs = useRef([]);

  const selectedIndex = Math.min(selected ?? lastRecorded, cells.length - 1);
  const focusIndex = Math.min(tabStop ?? selectedIndex, cells.length - 1);
  const selectedCell = cells[selectedIndex];

  function move(event, index) {
    const steps = { ArrowUp: -1, ArrowDown: 1, ArrowLeft: -7, ArrowRight: 7 };

    if (!(event.key in steps)) return;

    event.preventDefault();

    const next = Math.min(Math.max(index + steps[event.key], 0), cells.length - 1);

    setTabStop(next);
    refs.current[next]?.focus();
  }

  const columnStyle = { gridTemplateColumns: `repeat(${weeks}, minmax(0, 1fr))` };

  return (
    <div>
      {/* Month labels */}
      <div className="grid gap-1 sm:gap-1.5" style={columnStyle} aria-hidden="true">
        {Array.from({ length: weeks }, (_, column) => {
          const monday = cells[column * 7].date;
          const showMonth = column === 0 || monday.getDate() <= 7;

          return (
            <span key={column} className="whitespace-nowrap text-xs text-muted">
              {showMonth ? monday.toLocaleDateString("en-IN", { month: "short" }) : ""}
            </span>
          );
        })}
      </div>

      <div
        className="mt-1 grid grid-flow-col grid-rows-7 gap-1 sm:gap-1.5"
        style={columnStyle}
      >
        {cells.map((cell, index) => {
          const classes = `lp-cell flex aspect-square w-full items-center justify-center rounded-control border text-xs font-medium ${cellStyle(
            cell
          )}`;

          if (!interactive) {
            return (
              <div
                key={index}
                aria-hidden="true"
                className={classes}
                style={{ "--i": index }}
              />
            );
          }

          return (
            <button
              key={index}
              ref={(element) => {
                refs.current[index] = element;
              }}
              type="button"
              tabIndex={index === focusIndex ? 0 : -1}
              aria-pressed={index === selectedIndex}
              aria-label={`${longDate(cell.date)}. ${describe(cell)}.`}
              onClick={() => {
                setSelected(index);
                setTabStop(index);
              }}
              onKeyDown={(event) => move(event, index)}
              style={{ "--i": index }}
              className={`${classes} transition-transform duration-150 hover:scale-110 hover:border-ink ${
                index === selectedIndex
                  ? "ring-2 ring-ink ring-offset-2 ring-offset-surface"
                  : ""
              }`}
            >
              <span aria-hidden="true">{cell.date.getDate()}</span>
            </button>
          );
        })}
      </div>

      {interactive && (
        <div className="mt-4 rounded-panel border border-line p-4" aria-live="polite">
          <p className="text-xs text-muted">Selected day</p>

          <p className="mt-1 font-semibold text-ink">{longDate(selectedCell.date)}</p>

          <p className="mt-2 text-sm text-muted">
            {selectedCell.state === "recorded" &&
              `${describe(selectedCell)}. Daily target of ${formatMinutes(
                HEATMAP_TARGET_MINUTES
              )}: ${selectedCell.goalReached ? "reached" : "not reached"}.`}
            {selectedCell.state === "no-entry" &&
              "No entry for this date. This does not mean you did not study."}
            {selectedCell.state === "unavailable" &&
              "This date is before the account was created."}
            {selectedCell.state === "future" && "This date is in the future."}
          </p>
        </div>
      )}
    </div>
  );
}
