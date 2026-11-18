import { useState } from "react";
import { Pause, Play } from "lucide-react";

import {
  formatClock,
  useClock,
  useInView,
  usePrefersReducedMotion,
} from "../../hooks";
import { StatusChip } from "./small";

// An interactive sample of the focus timer.
// It shows the product rule: finishing a timer saves a session, but it does
// NOT change the task's status.
export default function TimerCard({ className = "" }) {
  const reducedMotion = usePrefersReducedMotion();
  const [ref, inView] = useInView({ once: false, threshold: 0.2 });

  // People who prefer reduced motion start paused (no ticking digits).
  const [status, setStatus] = useState(reducedMotion ? "paused" : "running");
  const [seconds, setSeconds] = useClock(25 * 60, status === "running" && inView);

  const saved = status === "saved";

  const announcement = {
    running: "Timer running.",
    paused: "Timer paused.",
    saved: "Session saved. The task status is unchanged.",
  }[status];

  return (
    <div
      ref={ref}
      className={`rounded-panel border p-4 transition-colors duration-300 sm:p-5 ${
        saved
          ? "border-line bg-surface"
          : "border-attention/40 bg-attention-subtle"
      } ${className}`}
    >
      <p role="status" className="sr-only">
        {announcement}
      </p>

      {saved ? (
        <div>
          <p className="text-xs font-semibold text-primary">Session saved</p>

          <p className="mt-2 text-xl font-semibold text-ink">
            {Math.max(1, Math.round(seconds / 60))} minutes of Physics
          </p>

          <p className="mt-1 text-sm text-muted">
            Source: timer · Rotational motion: practice set
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-2 rounded-control bg-canvas p-3 text-sm text-ink">
            Task status
            <StatusChip status="In progress" />
            <span className="text-muted">unchanged</span>
          </div>

          <button
            type="button"
            onClick={() => {
              setSeconds(0);
              setStatus("running");
            }}
            className="btn btn-secondary mt-4"
          >
            Start another session
          </button>
        </div>
      ) : (
        <div>
          <div className="flex items-center gap-2">
            <span
              aria-hidden="true"
              className={`h-2 w-2 rounded-full ${
                status === "running"
                  ? "bg-attention motion-safe:animate-pulse"
                  : "bg-attention-ink"
              }`}
            />

            <span className="text-xs font-semibold text-attention-ink">
              {status === "running" ? "Timer running" : "Timer paused"}
            </span>
          </div>

          <p className="mt-3 text-sm font-semibold text-ink">Physics</p>
          <p className="text-sm text-muted">Task: Rotational motion: practice set</p>

          <p className="mt-4 font-mono text-[32px] font-semibold leading-none tracking-tight text-ink">
            {formatClock(seconds)}
          </p>

          <div className="mt-5 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setStatus(status === "running" ? "paused" : "running")}
              className="btn bg-ink text-white hover:bg-ink/90"
            >
              {status === "running" ? <Pause size={16} /> : <Play size={16} />}
              {status === "running" ? "Pause" : "Resume"}
            </button>

            <button
              type="button"
              onClick={() => setStatus("saved")}
              className="btn border border-attention/50 bg-white/70 text-ink hover:bg-white"
            >
              Finish
            </button>
          </div>

          <p className="mt-3 text-xs text-muted">
            Sample timer. Try Pause, Resume and Finish.
          </p>
        </div>
      )}
    </div>
  );
}
