import Reveal from "./Reveal";
import TimerCard from "./previews/TimerCard";
import HeatmapGrid, { HeatmapLegend } from "./previews/HeatmapGrid";
import { MiniPlanner } from "./previews/PlannerPreview";
import { TrendLine } from "./previews/charts";
import { testTrend } from "../sampleData";
import { SampleBadge } from "./previews/small";

function Pillar({ number, title, text, index, children, previewClass }) {
  return (
    <div data-stagger="" style={{ "--i": index }} className="h-full">
      <article className="lp-card flex h-full flex-col overflow-hidden rounded-panel border border-line bg-surface">
        <div className="p-5 sm:p-6">
          <p className="text-sm font-medium text-primary">{number}</p>
          <h3 className="mt-1 text-[25px] font-semibold leading-tight text-ink">
            {title}
          </h3>
          <p className="mt-2 text-sm leading-6 text-muted">{text}</p>
        </div>

        <div className={`mt-auto flex-1 border-t border-line p-4 sm:p-5 ${previewClass}`}>
          {children}
        </div>
      </article>
    </div>
  );
}

export default function FeaturePillars() {
  return (
    <section
      id="features"
      aria-labelledby="features-heading"
      className="mx-auto w-full max-w-[1200px] px-4 py-16 sm:px-6 sm:py-24 lg:px-8"
    >
      <Reveal className="max-w-2xl">
        <h2
          id="features-heading"
          className="text-[32px] font-semibold leading-tight tracking-tight text-ink sm:text-[40px]"
        >
          Plan it. Track it. Understand it.
        </h2>

        <p className="mt-4 text-base leading-7 text-muted sm:text-lg">
          Three parts of the same workflow. Each keeps its own record, and
          together they show your preparation clearly.
        </p>
      </Reveal>

      <Reveal className="mt-10 grid gap-4 lg:grid-cols-3">
        <Pillar
          index={0}
          number="Plan your study"
          title="Know what is next"
          text="Organize subjects, create study tasks, set priorities and manage your daily preparation."
          previewClass="bg-canvas"
        >
          <div className="mb-3 flex items-center justify-between gap-2">
            <p className="text-xs font-medium text-muted">Today's tasks</p>
            <SampleBadge />
          </div>

          <MiniPlanner />
        </Pillar>

        <Pillar
          index={1}
          number="Track your effort"
          title="Record what you studied"
          text="Record actual study time using the focus timer or manual study sessions."
          previewClass="bg-attention-subtle/40"
        >
          <TimerCard className="shadow-sm" />
        </Pillar>

        <Pillar
          index={2}
          number="Understand your progress"
          title="See the pattern"
          text="Explore study patterns, subject allocation, consistency and mock-test performance through meaningful analytics."
          previewClass="bg-surface"
        >
          <div className="mb-3 flex items-center justify-between gap-2">
            <p className="text-xs font-medium text-muted">Consistency</p>
            <SampleBadge />
          </div>

          <HeatmapGrid weeks={8} />

          <div className="mt-4">
            <HeatmapLegend />
          </div>

          <p className="mb-6 mt-5 text-xs font-medium text-muted">Mock-test trend</p>
          <TrendLine points={testTrend} />
        </Pillar>
      </Reveal>
    </section>
  );
}
