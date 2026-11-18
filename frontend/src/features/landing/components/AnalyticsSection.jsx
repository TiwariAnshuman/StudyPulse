import {
  plannedVsRecorded,
  subjectTime,
  taskStatusCounts,
  testTrend,
  week,
} from "../sampleData";
import Reveal from "./Reveal";
import HeatmapGrid, { HeatmapLegend } from "./previews/HeatmapGrid";
import {
  PlannedVsRecorded,
  SubjectBar,
  TaskStatusBar,
  TrendLine,
  WeeklyBars,
} from "./previews/charts";
import { SampleBadge } from "./previews/small";

function ChartCard({ title, caption, span, delay = 0, children }) {
  return (
    <Reveal delay={delay} className={span}>
      <article className="lp-card h-full rounded-panel border border-line bg-surface p-5">
        <h3 className="text-base font-semibold text-ink">{title}</h3>

        <div className="mt-4">{children}</div>

        <p className="mt-4 border-t border-line pt-3 text-xs leading-5 text-muted">
          {caption}
        </p>
      </article>
    </Reveal>
  );
}

export default function AnalyticsSection() {
  return (
    <section
      id="analytics"
      aria-labelledby="analytics-heading"
      className="border-y border-line bg-canvas"
    >
      <div className="mx-auto w-full max-w-[1200px] px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        <Reveal className="max-w-2xl">
          <h2
            id="analytics-heading"
            className="text-[32px] font-semibold leading-tight tracking-tight text-ink sm:text-[40px]"
          >
            Look beyond the numbers.
          </h2>

          <p className="mt-4 text-base leading-7 text-muted sm:text-lg">
            StudyPulse shows what your recorded data supports, with the formula
            behind every number. No productivity scores, no predictions.
          </p>

          <p className="mt-4 flex items-center gap-2 text-sm text-muted">
            <SampleBadge />
            Every chart below uses illustrative sample data.
          </p>
        </Reveal>

        <div className="mt-10 grid gap-4 lg:grid-cols-12">
          <ChartCard
            title="Weekly study duration"
            caption="Recorded study time for seven days. A day with no recorded session is shown as empty, not as a failure."
            span="lg:col-span-7"
          >
            <WeeklyBars data={week} height={170} />
          </ChartCard>

          <ChartCard
            title="Subject-wise distribution"
            caption="Share of recorded time. This is allocation, not mastery."
            span="lg:col-span-5"
            delay={80}
          >
            <SubjectBar data={subjectTime} />
          </ChartCard>

          <ChartCard
            title="Estimated versus recorded time"
            caption="Estimates and recorded time are separate values. A gap is information, not a verdict."
            span="lg:col-span-5"
          >
            <PlannedVsRecorded rows={plannedVsRecorded} />
          </ChartCard>

          <ChartCard
            title="Mock-test score trend"
            caption="Four tests is a small sample. This shows a pattern in the records, not a cause."
            span="lg:col-span-7"
            delay={80}
          >
            <div className="pt-6">
              <TrendLine points={testTrend} />
            </div>
          </ChartCard>

          <ChartCard
            title="Task completion"
            caption="Status is set by you and stays independent of recorded study time."
            span="lg:col-span-5"
          >
            <TaskStatusBar data={taskStatusCounts} />
          </ChartCard>

          <ChartCard
            title="Study activity heatmap"
            caption="Squares marked No entry do not mean you did not study. Days may simply be unlogged."
            span="lg:col-span-7"
            delay={80}
          >
            <HeatmapGrid />

            <div className="mt-4">
              <HeatmapLegend />
            </div>
          </ChartCard>
        </div>
      </div>
    </section>
  );
}
