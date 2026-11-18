import { useState } from "react";

import { SUBJECT_COLORS, plannerViews } from "../../sampleData";
import { StatusChip, SubjectDot } from "./small";

function TaskRow({ task }) {
  return (
    <li className="rounded-control border border-line bg-surface p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-ink">{task.title}</p>

          <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
            <span className="inline-flex items-center gap-1.5">
              <SubjectDot color={SUBJECT_COLORS[task.subject]} />
              {task.subject}
            </span>
            <span>{task.priority} priority</span>
            <span>{task.estimate}</span>
          </p>

          <p className="mt-1 text-xs text-muted">
            Planned {task.planned}
            {task.due ? ` · Due ${task.due}` : ""}
          </p>
        </div>

        <StatusChip status={task.status} />
      </div>

      {(task.overdue || task.carried) && (
        <div className="mt-2 flex items-center justify-between gap-2 border-t border-line pt-2 text-xs">
          {task.overdue ? (
            <span className="font-medium text-ink">Overdue: due {task.due}</span>
          ) : (
            <span className="text-muted">Carried over from {task.planned}</span>
          )}

          <span className="rounded-control border border-line-strong px-2 py-1 font-medium text-ink">
            Reschedule
          </span>
        </div>
      )}
    </li>
  );
}

// Planner sample: choose a view to see how tasks are grouped.
export default function PlannerPreview() {
  const [viewId, setViewId] = useState("today");
  const view = plannerViews.find((item) => item.id === viewId) ?? plannerViews[0];

  return (
    <div>
      <div
        role="group"
        aria-label="Task views, sample data"
        className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1"
      >
        {plannerViews.map((item) => (
          <button
            key={item.id}
            type="button"
            aria-pressed={item.id === viewId}
            onClick={() => setViewId(item.id)}
            className={`btn shrink-0 border px-3 ${
              item.id === viewId
                ? "border-primary bg-primary text-white"
                : "border-line-strong bg-surface text-ink hover:bg-tint"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      <ul key={view.id} className="lp-swap mt-3 space-y-2">
        {view.tasks.map((task) => (
          <TaskRow key={task.id} task={task} />
        ))}
      </ul>

      <p className="mt-3 text-xs text-muted">
        Statuses are set by you. Recording study time never changes a task's
        status.
      </p>
    </div>
  );
}

// A smaller, static planner used inside the pillar card.
export function MiniPlanner() {
  const rows = plannerViews[0].tasks;

  return (
    <ul className="space-y-2">
      {rows.map((task) => (
        <li
          key={task.id}
          className="flex items-center justify-between gap-3 rounded-control border border-line bg-surface p-3"
        >
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-ink">{task.title}</p>
            <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted">
              <SubjectDot color={SUBJECT_COLORS[task.subject]} />
              {task.subject} · {task.estimate}
            </p>
          </div>

          <StatusChip status={task.status} />
        </li>
      ))}
    </ul>
  );
}
