import { formatMinutes } from "../../hooks";
import { SUBJECT_COLORS } from "../../sampleData";

// Hand-built charts for the landing page. They use only the approved colours
// and animate with transform/opacity when their parent is revealed.

function compact(minutes) {
  return minutes < 60 ? `${minutes}m` : `${(minutes / 60).toFixed(1)}h`;
}

// ---------------------------------------------------------------- Weekly bars
export function WeeklyBars({ data, height = 140 }) {
  const max = Math.max(...data.map((item) => item.minutes), 1);

  const summary = data
    .map((item) => `${item.day} ${formatMinutes(item.minutes)}`)
    .join(", ");

  return (
    <div
      role="img"
      aria-label={`Weekly study time, sample data: ${summary}`}
      className="flex items-end justify-between gap-1.5 sm:gap-2"
      style={{ height }}
    >
      {data.map((item, index) => {
        const barHeight = Math.max(item.minutes > 0 ? 4 : 0, (item.minutes / max) * 100);

        return (
          <div
            key={item.day}
            className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1.5"
          >
            <span className="text-xs text-muted">
              {item.minutes > 0 ? compact(item.minutes) : ""}
            </span>

            <div className="flex w-full flex-1 items-end justify-center">
              <div
                className="lp-bar w-full max-w-8 rounded-t-control bg-primary"
                style={{ height: `${barHeight}%`, "--i": index }}
              />
            </div>

            <span className="text-xs text-muted">{item.day}</span>
          </div>
        );
      })}
    </div>
  );
}

// ------------------------------------------------------ Subject distribution
export function SubjectBar({ data }) {
  const total = data.reduce((sum, item) => sum + item.minutes, 0);

  const summary = data
    .map((item) => `${item.subject} ${Math.round((item.minutes / total) * 100)}%`)
    .join(", ");

  return (
    <div>
      <div
        role="img"
        aria-label={`Subject allocation of recorded time, sample data: ${summary}`}
        className="flex h-3 gap-1 overflow-hidden rounded-control"
      >
        {data.map((item, index) => (
          <div
            key={item.subject}
            className="lp-hbar h-full rounded-sm"
            style={{
              width: `${(item.minutes / total) * 100}%`,
              backgroundColor: SUBJECT_COLORS[item.subject],
              "--i": index,
            }}
          />
        ))}
      </div>

      <ul className="mt-4 space-y-2">
        {data.map((item) => (
          <li
            key={item.subject}
            className="flex items-center justify-between gap-3 text-sm"
          >
            <span className="flex items-center gap-2 text-ink">
              <span
                aria-hidden="true"
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: SUBJECT_COLORS[item.subject] }}
              />
              {item.subject}
            </span>

            <span className="text-muted">
              <span className="font-medium text-ink">
                {Math.round((item.minutes / total) * 100)}%
              </span>{" "}
              · {formatMinutes(item.minutes)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// -------------------------------------------- Estimated vs recorded (separate)
export function PlannedVsRecorded({ rows }) {
  const max = Math.max(...rows.flatMap((row) => [row.estimate, row.recorded]), 1);

  return (
    <div>
      <ul className="mb-4 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
        <li className="flex items-center gap-2">
          <span aria-hidden="true" className="h-2.5 w-2.5 rounded-sm bg-line-strong" />
          Estimated in tasks
        </li>
        <li className="flex items-center gap-2">
          <span aria-hidden="true" className="h-2.5 w-2.5 rounded-sm bg-primary" />
          Recorded in sessions
        </li>
      </ul>

      <ul className="space-y-4">
        {rows.map((row, index) => (
          <li key={row.subject}>
            <p className="mb-1.5 text-sm font-medium text-ink">{row.subject}</p>

            {[
              { label: "Estimated", value: row.estimate, className: "bg-line-strong" },
              { label: "Recorded", value: row.recorded, className: "bg-primary" },
            ].map((bar, barIndex) => (
              <div key={bar.label} className="mb-1.5 flex items-center gap-3">
                <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-tint">
                  <div
                    className={`lp-hbar h-full rounded-full ${bar.className}`}
                    style={{
                      width: `${(bar.value / max) * 100}%`,
                      "--i": index * 2 + barIndex,
                    }}
                  />
                </div>

                <span className="w-24 shrink-0 text-right text-xs text-muted">
                  <span className="sr-only">{bar.label}: </span>
                  {formatMinutes(bar.value)}
                </span>
              </div>
            ))}
          </li>
        ))}
      </ul>
    </div>
  );
}

// ------------------------------------------------------------- Task statuses
const STATUS_COLORS = {
  Completed: "#426B57",
  "In progress": "#B7793E",
  "To do": "#8A948E",
};

export function TaskStatusBar({ data }) {
  const total = data.reduce((sum, item) => sum + item.count, 0);

  return (
    <div>
      <div className="flex h-3 gap-1 overflow-hidden rounded-control" aria-hidden="true">
        {data.map((item, index) => (
          <div
            key={item.status}
            className="lp-hbar h-full rounded-sm"
            style={{
              width: `${(item.count / total) * 100}%`,
              backgroundColor: STATUS_COLORS[item.status],
              "--i": index,
            }}
          />
        ))}
      </div>

      <ul className="mt-4 grid grid-cols-3 gap-2">
        {data.map((item) => (
          <li key={item.status} className="rounded-control bg-canvas p-3">
            <p className="text-[25px] font-semibold leading-none text-ink">{item.count}</p>
            <p className="mt-1.5 flex items-center gap-1.5 text-xs text-muted">
              <span
                aria-hidden="true"
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: STATUS_COLORS[item.status] }}
              />
              {item.status}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ----------------------------------------------- Mock-test percentage trend
// Axis runs 0 to 100% on purpose, so a small change is not exaggerated.
export function TrendLine({ points }) {
  const count = points.length;
  const x = (index) => ((index + 0.5) / count) * 100;
  const y = (percent) => 100 - percent;

  const summary = points
    .map((point) => `${point.label} ${point.percent}%`)
    .join(", ");

  return (
    <div
      role="img"
      aria-label={`Mock-test percentage over time, sample data: ${summary}`}
    >
      <div className="relative ml-9 h-40">
        {[0, 50, 100].map((tick) => (
          <div
            key={tick}
            className="absolute inset-x-0 border-t border-dashed border-line"
            style={{ top: `${100 - tick}%` }}
          >
            <span className="absolute -left-9 w-7 -translate-y-1/2 text-right text-xs text-muted">
              {tick}%
            </span>
          </div>
        ))}

        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          className="absolute inset-0 h-full w-full overflow-visible"
          aria-hidden="true"
        >
          <polyline
            className="lp-line"
            pathLength="1"
            fill="none"
            stroke="#426B57"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
            points={points.map((point, index) => `${x(index)},${y(point.percent)}`).join(" ")}
          />
        </svg>

        {points.map((point, index) => (
          <div
            key={point.label}
            className="lp-dot absolute"
            style={{
              left: `${x(index)}%`,
              top: `${y(point.percent)}%`,
              "--i": index,
            }}
          >
            <span className="absolute -left-[5px] -top-[5px] h-2.5 w-2.5 rounded-full border-2 border-surface bg-primary" />
            <span className="absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap text-xs font-medium text-ink">
              {point.percent}%
            </span>
          </div>
        ))}
      </div>

      <div className="ml-9 mt-2 grid" style={{ gridTemplateColumns: `repeat(${count}, minmax(0, 1fr))` }}>
        {points.map((point) => (
          <div key={point.label} className="text-center">
            <p className="text-xs font-medium text-ink">{point.label}</p>
            <p className="text-xs text-muted">{point.date}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
