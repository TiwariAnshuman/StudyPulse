import {
  CalendarDays,
  ClipboardList,
  History,
  LayoutDashboard,
  Pause,
  Play,
  Settings,
  Timer,
  BookOpen,
  ChartNoAxesCombined,
} from "lucide-react";

import {
  formatClock,
  formatMinutes,
  useClock,
  useInView,
  usePrefersReducedMotion,
} from "../../hooks";
import { latestTest, plannerViews, testTrend, week } from "../../sampleData";
import { SampleBadge, StatusChip } from "./small";
import { WeeklyBars } from "./charts";

const NAV = [
  { label: "Dashboard", icon: LayoutDashboard, active: true },
  { label: "Planner", icon: CalendarDays },
  { label: "Subjects", icon: BookOpen },
  { label: "Focus Timer", icon: Timer },
  { label: "Sessions", icon: History },
  { label: "Mock Tests", icon: ClipboardList },
  { label: "Analytics", icon: ChartNoAxesCombined },
];

function Card({ title, badge, className = "", index = 0, children }) {
  return (
    <div
      data-stagger=""
      style={{ "--i": index }}
      className={`rounded-panel border border-line bg-surface p-4 ${className}`}
    >
      {(title || badge) && (
        <div className="mb-3 flex items-center justify-between gap-2">
          <p className="text-xs font-medium text-muted">{title}</p>
          {badge}
        </div>
      )}

      {children}
    </div>
  );
}

// Static timer card with ticking digits, used inside the dashboard preview.
function PreviewTimer({ index }) {
  const reducedMotion = usePrefersReducedMotion();
  const [ref, inView] = useInView({ once: false, threshold: 0.3 });
  const [seconds] = useClock(25 * 60, inView && !reducedMotion);

  return (
    <div
      ref={ref}
      data-stagger=""
      style={{ "--i": index }}
      className="rounded-panel border border-attention/40 bg-attention-subtle p-4 md:col-span-2"
    >
      <div className="flex items-center gap-2">
        <span className="h-2 w-2 rounded-full bg-attention motion-safe:animate-pulse" />
        <span className="text-xs font-semibold text-attention-ink">Timer running</span>
      </div>

      <p className="mt-2 text-sm font-semibold text-ink">Physics</p>
      <p className="text-xs text-muted">Task: Rotational motion: practice set</p>

      <p className="mt-3 font-mono text-[25px] font-semibold leading-none text-ink">
        {formatClock(seconds)}
      </p>

      <div className="mt-3 flex gap-2">
        <span className="inline-flex min-h-9 items-center gap-1.5 rounded-control bg-ink px-3 text-xs font-medium text-white">
          <Pause size={14} />
          Pause
        </span>
        <span className="inline-flex min-h-9 items-center gap-1.5 rounded-control border border-attention/50 bg-white/70 px-3 text-xs font-medium text-ink">
          Finish
        </span>
      </div>
    </div>
  );
}

// The latest mock-test card is also used as a floating card in the hero.
export function LatestTestCard({ className = "" }) {
  return (
    <div className={`rounded-panel border border-line bg-surface p-4 ${className}`}>
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium text-muted">Latest mock test</p>
        <SampleBadge />
      </div>

      <p className="mt-2 text-sm font-semibold text-ink">
        {latestTest.name} · {latestTest.date}
      </p>

      <div className="mt-2 flex items-end justify-between gap-3">
        <div>
          <p className="text-[25px] font-semibold leading-none text-ink">
            {latestTest.percent}%
          </p>
          <p className="mt-1 text-xs text-muted">
            {latestTest.marks} / {latestTest.max} marks
          </p>
        </div>

        <svg viewBox="0 0 80 32" className="h-8 w-20" aria-hidden="true">
          <polyline
            fill="none"
            stroke="#426B57"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={testTrend
              .map((point, index) => `${6 + index * 22.7},${30 - (point.percent - 50) * 1.6}`)
              .join(" ")}
          />
        </svg>
      </div>
    </div>
  );
}

export function SessionSavedCard({ className = "" }) {
  return (
    <div className={`rounded-panel border border-line bg-surface p-4 ${className}`}>
      <p className="text-xs font-semibold text-primary">Session saved</p>
      <p className="mt-1 text-sm font-medium text-ink">25 minutes · Physics</p>
      <p className="mt-2 flex flex-wrap items-center gap-1.5 text-xs text-muted">
        Task status <StatusChip status="In progress" /> unchanged
      </p>
    </div>
  );
}

export default function DashboardPreview() {
  const todayTasks = plannerViews[0].tasks;

  // Estimated minutes of the tasks planned for today (separate from recorded time).
  const estimate = todayTasks.reduce((sum, task) => sum + parseInt(task.estimate, 10), 0);
  const recorded = 155;
  const longest = Math.max(estimate, recorded);

  return (
    <div
      role="img"
      aria-label="Preview of the StudyPulse dashboard with sample data: study time today, estimated versus recorded time, a running focus timer, today's tasks with their statuses, and weekly study time."
      className="lp-shadow overflow-hidden rounded-panel border border-line bg-surface"
    >
      <div
        aria-hidden="true"
        className="flex items-center justify-between border-b border-line bg-surface px-4 py-2.5"
      >
        <p className="text-xs text-muted">Dashboard preview</p>
        <SampleBadge />
      </div>

      <div aria-hidden="true" className="md:grid md:grid-cols-[176px_minmax(0,1fr)]">
        {/* Sidebar */}
        <aside className="hidden border-r border-line bg-surface p-3 md:block">
          <p className="flex items-center gap-2 px-2 pb-3 text-sm font-semibold text-ink">
            <span className="flex h-6 w-6 items-center justify-center rounded-control bg-primary text-xs text-white">
              S
            </span>
            StudyPulse
          </p>

          <ul className="space-y-0.5">
            {NAV.map(({ label, icon: Icon, active }) => (
              <li
                key={label}
                className={`flex items-center gap-2.5 rounded-control px-2 py-1.5 text-xs font-medium ${
                  active ? "bg-primary-subtle text-primary" : "text-muted"
                }`}
              >
                <Icon size={15} />
                {label}
              </li>
            ))}
          </ul>

          <p className="mt-4 flex items-center gap-2.5 border-t border-line px-2 pt-3 text-xs font-medium text-muted">
            <Settings size={15} />
            Settings
          </p>
        </aside>

        {/* Main area: cards appear one after another */}
        <div className="bg-canvas p-4 sm:p-5">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <p className="text-xs text-muted">Wednesday, 28 October</p>
              <p className="text-xl font-semibold text-ink">Good morning, Riya</p>
            </div>

            <span className="hidden items-center gap-1.5 rounded-control bg-primary px-3 py-2 text-xs font-medium text-white sm:inline-flex">
              <Play size={13} />
              Start studying
            </span>
          </div>

          <div className="grid gap-3 md:grid-cols-6">
            <Card
              title="Study time today"
              badge={
                <span className="rounded-control bg-primary-subtle px-2 py-0.5 text-xs font-medium text-primary">
                  Recorded
                </span>
              }
              className="md:col-span-2"
              index={0}
            >
              <p className="text-[25px] font-semibold leading-none text-ink">2h 35m</p>

              <div className="mt-3 flex justify-between text-xs text-muted">
                <span>Target: 4h 0m</span>
                <span>65%</span>
              </div>

              <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-tint">
                <div className="lp-hbar h-full w-[65%] rounded-full bg-primary" />
              </div>
            </Card>

            <Card title="Estimated vs recorded" className="md:col-span-2" index={1}>
              <div className="space-y-2.5">
                <div>
                  <div className="flex justify-between text-xs text-muted">
                    <span>Task estimates</span>
                    <span>{formatMinutes(estimate)}</span>
                  </div>
                  <div className="mt-1 h-2 overflow-hidden rounded-full bg-tint">
                    <div
                      className="lp-hbar h-full rounded-full bg-line-strong"
                      style={{ width: `${(estimate / longest) * 100}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs text-muted">
                    <span>Recorded sessions</span>
                    <span>2h 35m</span>
                  </div>
                  <div className="mt-1 h-2 overflow-hidden rounded-full bg-tint">
                    <div
                      className="lp-hbar h-full rounded-full bg-primary"
                      style={{ width: `${(recorded / longest) * 100}%` }}
                    />
                  </div>
                </div>
              </div>

              <p className="mt-3 text-xs text-muted">Tracked as separate values.</p>
            </Card>

            <PreviewTimer index={2} />

            <Card title="Today's tasks" className="md:col-span-3" index={3}>
              <ul className="space-y-2.5">
                {todayTasks.map((task) => (
                  <li key={task.id} className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-xs font-medium text-ink">{task.title}</p>
                      <p className="text-xs text-muted">{task.subject}</p>
                    </div>
                    <StatusChip status={task.status} />
                  </li>
                ))}
              </ul>
            </Card>

            <Card title="Weekly study" className="md:col-span-3" index={4}>
              <WeeklyBars data={week} height={112} />
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
