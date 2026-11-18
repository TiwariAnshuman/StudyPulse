import { useRef, useState } from "react";
import {
  Activity,
  CalendarDays,
  ChartNoAxesCombined,
  Check,
  ClipboardList,
  Timer,
} from "lucide-react";

import { useMediaQuery } from "../hooks";
import {
  sessions,
  subjectTime,
  taskStatusCounts,
  week,
} from "../sampleData";
import Reveal from "./Reveal";
import HeatmapGrid, { HeatmapLegend } from "./previews/HeatmapGrid";
import MockTestPreview from "./previews/MockTestPreview";
import PlannerPreview from "./previews/PlannerPreview";
import TimerCard from "./previews/TimerCard";
import { SubjectBar, TaskStatusBar, WeeklyBars } from "./previews/charts";
import { SampleBadge } from "./previews/small";

function TimerPanel() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <TimerCard />

      <div className="space-y-4">
        <div className="rounded-panel border border-line bg-surface p-4">
          <p className="text-sm font-semibold text-ink">Session history</p>

          <ul className="mt-3 divide-y divide-line">
            {sessions.map((session) => (
              <li key={session.when} className="flex items-center justify-between gap-3 py-2.5">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-ink">
                    {session.subject} · {session.activity}
                  </p>
                  <p className="text-xs text-muted">
                    {session.when} ·{" "}
                    <span className="rounded-control bg-tint px-1.5 py-0.5">
                      {session.source}
                    </span>
                  </p>
                </div>

                <p className="shrink-0 text-sm font-semibold text-ink">
                  {session.duration}
                </p>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-panel border border-line bg-surface p-4">
          <p className="text-sm font-semibold text-ink">Forgot to start the timer?</p>
          <p className="mt-1 text-sm text-muted">
            Add the session by hand: date, start, end, subject and activity.
            It is labelled Manual and counted once.
          </p>
        </div>
      </div>
    </div>
  );
}

function AnalyticsPanel() {
  const tiles = [
    ["Total study time", "18h 45m"],
    ["Daily average", "2h 41m"],
    ["Active days", "6"],
    ["Tasks completed", "5 of 12"],
  ];

  return (
    <div className="space-y-4">
      <ul className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {tiles.map(([label, value]) => (
          <li key={label} className="rounded-panel border border-line bg-surface p-4">
            <p className="text-xs text-muted">{label}</p>
            <p className="mt-1.5 text-[25px] font-semibold leading-none text-ink">{value}</p>
          </li>
        ))}
      </ul>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-panel border border-line bg-surface p-4">
          <p className="mb-3 text-sm font-semibold text-ink">Weekly study</p>
          <WeeklyBars data={week} height={130} />
        </div>

        <div className="rounded-panel border border-line bg-surface p-4">
          <p className="mb-3 text-sm font-semibold text-ink">Subject allocation</p>
          <SubjectBar data={subjectTime} />
        </div>
      </div>

      <div className="rounded-panel border border-line bg-surface p-4">
        <p className="mb-3 text-sm font-semibold text-ink">Task status</p>
        <TaskStatusBar data={taskStatusCounts} />
      </div>
    </div>
  );
}

function HeatmapPanel() {
  return (
    <div className="rounded-panel border border-line bg-surface p-4 sm:p-5">
      <HeatmapGrid interactive />

      <div className="mt-4">
        <HeatmapLegend />
      </div>

      <p className="mt-3 text-xs text-muted">
        Choose a day with a tap, a click or the arrow keys. Squares marked No
        entry do not mean you did not study.
      </p>
    </div>
  );
}

const TABS = [
  {
    id: "planner",
    label: "Study Planner",
    icon: CalendarDays,
    summary: "Tasks by subject, with their own statuses.",
    bullets: [
      "Subject-wise tasks",
      "To do, In progress and Completed statuses",
      "Planned and due dates",
      "Priority management",
      "Overdue and carried-over views",
    ],
    Panel: PlannerPreview,
  },
  {
    id: "timer",
    label: "Focus Timer",
    icon: Timer,
    summary: "Actual study time, recorded from timestamps.",
    bullets: [
      "Start, pause, resume and finish",
      "Actual study duration",
      "Session history",
      "Manual session entry",
    ],
    Panel: TimerPanel,
  },
  {
    id: "tests",
    label: "Mock Test Tracking",
    icon: ClipboardList,
    summary: "Reported marks, with derived values only when valid.",
    bullets: [
      "Test name and date",
      "Obtained marks and maximum marks",
      "Subject-wise performance",
      "Accuracy and attempt rate when valid data is available",
    ],
    Panel: MockTestPreview,
  },
  {
    id: "analytics",
    label: "Study Analytics",
    icon: ChartNoAxesCombined,
    summary: "Totals, averages and allocation from your records.",
    bullets: [
      "Total study time",
      "Daily averages",
      "Subject-wise time allocation",
      "Task completion analytics",
      "Exam performance trends",
    ],
    Panel: AnalyticsPanel,
  },
  {
    id: "heatmap",
    label: "Consistency Heatmap",
    icon: Activity,
    summary: "A calendar of recorded study, without judgement.",
    bullets: [
      "Calendar-based activity visualization",
      "Multiple intensity levels",
      "Interactive date details",
      "Neutral no-entry states",
    ],
    Panel: HeatmapPanel,
  },
];

export default function ProductShowcase() {
  const [activeId, setActiveId] = useState(TABS[0].id);
  const tabRefs = useRef([]);
  const vertical = useMediaQuery("(min-width: 1024px)");

  const activeIndex = TABS.findIndex((tab) => tab.id === activeId);
  const active = TABS[activeIndex];

  // Arrow keys, Home and End move between tabs (standard tab pattern).
  function handleKeyDown(event) {
    const forward = vertical ? "ArrowDown" : "ArrowRight";
    const back = vertical ? "ArrowUp" : "ArrowLeft";
    let next = activeIndex;

    if (event.key === forward) next = (activeIndex + 1) % TABS.length;
    else if (event.key === back) next = (activeIndex - 1 + TABS.length) % TABS.length;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = TABS.length - 1;
    else return;

    event.preventDefault();
    setActiveId(TABS[next].id);
    tabRefs.current[next]?.focus();
  }

  const ActivePanel = active.Panel;

  return (
    <section
      id="showcase"
      aria-labelledby="showcase-heading"
      className="border-y border-line bg-surface"
    >
      <div className="mx-auto w-full max-w-[1200px] px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        <Reveal className="max-w-2xl">
          <h2
            id="showcase-heading"
            className="text-[32px] font-semibold leading-tight tracking-tight text-ink sm:text-[40px]"
          >
            Everything about your preparation, in one view.
          </h2>

          <p className="mt-4 text-base leading-7 text-muted sm:text-lg">
            Explore the parts of StudyPulse. These are working samples with
            made-up data.
          </p>
        </Reveal>

        <Reveal className="mt-10 lg:grid lg:grid-cols-[280px_minmax(0,1fr)] lg:gap-8">
          <div
            role="tablist"
            aria-label="StudyPulse features"
            aria-orientation={vertical ? "vertical" : "horizontal"}
            onKeyDown={handleKeyDown}
            className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-3 sm:-mx-6 sm:px-6 lg:mx-0 lg:flex-col lg:gap-1 lg:overflow-visible lg:px-0 lg:pb-0"
          >
            {TABS.map((tab, index) => {
              const Icon = tab.icon;
              const selected = tab.id === activeId;

              return (
                <button
                  key={tab.id}
                  ref={(element) => {
                    tabRefs.current[index] = element;
                  }}
                  type="button"
                  role="tab"
                  id={`tab-${tab.id}`}
                  aria-selected={selected}
                  aria-controls={`panel-${tab.id}`}
                  tabIndex={selected ? 0 : -1}
                  onClick={() => setActiveId(tab.id)}
                  className={`flex min-h-11 shrink-0 items-start gap-3 rounded-control border px-3 py-2.5 text-left transition-colors lg:w-full ${
                    selected
                      ? "border-primary/40 bg-primary-subtle text-primary"
                      : "border-line bg-surface text-ink hover:bg-tint lg:border-transparent lg:bg-transparent"
                  }`}
                >
                  <Icon size={20} className="mt-0.5 shrink-0" />

                  <span>
                    <span className="block text-sm font-semibold">{tab.label}</span>
                    <span
                      className={`mt-0.5 hidden text-xs leading-5 lg:block ${
                        selected ? "text-primary" : "text-muted"
                      }`}
                    >
                      {tab.summary}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>

          <div
            key={active.id}
            role="tabpanel"
            id={`panel-${active.id}`}
            aria-labelledby={`tab-${active.id}`}
            tabIndex={0}
            className="lp-swap mt-3 min-w-0 rounded-panel border border-line bg-canvas p-4 sm:p-5 lg:mt-0"
          >
            <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
              <ul className="grid gap-x-6 gap-y-1.5 sm:grid-cols-2">
                {active.bullets.map((bullet) => (
                  <li key={bullet} className="flex items-start gap-2 text-sm text-ink">
                    <Check size={16} className="mt-0.5 shrink-0 text-primary" />
                    {bullet}
                  </li>
                ))}
              </ul>

              <SampleBadge />
            </div>

            <ActivePanel />
          </div>
        </Reveal>
      </div>
    </section>
  );
}
