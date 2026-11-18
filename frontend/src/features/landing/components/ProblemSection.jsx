import { ClipboardList, ListChecks, Timer } from "lucide-react";

import Reveal from "./Reveal";

function ProblemCard({ icon: Icon, tone, title, text, children }) {
  return (
    <div className="lp-card flex h-full flex-col rounded-panel border border-line bg-surface p-5">
      <span
        className={`flex h-10 w-10 items-center justify-center rounded-control ${tone}`}
      >
        <Icon size={20} />
      </span>

      <h3 className="mt-4 text-xl font-semibold text-ink">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-muted">{text}</p>

      <div className="mt-5 flex-1 rounded-control border border-line bg-canvas p-4">
        {children}
      </div>
    </div>
  );
}

function Concept({ title, text, index }) {
  return (
    <div
      data-stagger=""
      style={{ "--i": index }}
      className="relative z-10 rounded-panel border border-line bg-surface p-4"
    >
      <p className="text-sm font-semibold text-ink">{title}</p>
      <p className="mt-1 text-sm text-muted">{text}</p>
    </div>
  );
}

export default function ProblemSection() {
  return (
    <section
      id="why"
      aria-labelledby="why-heading"
      className="border-y border-line bg-surface"
    >
      <div className="mx-auto w-full max-w-[1200px] px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        <Reveal className="max-w-2xl">
          <h2
            id="why-heading"
            className="text-[32px] font-semibold leading-tight tracking-tight text-ink sm:text-[40px]"
          >
            Your preparation is connected. Your tools should be too.
          </h2>

          <p className="mt-4 text-base leading-7 text-muted sm:text-lg">
            Most students keep a notebook for plans, a stopwatch for time and a
            spreadsheet for mock tests. The records never meet, so patterns are
            hard to see.
          </p>
        </Reveal>

        <Reveal className="mt-10 grid gap-4 md:grid-cols-3">
          <div data-stagger="" style={{ "--i": 0 }}>
            <ProblemCard
              icon={ListChecks}
              tone="bg-tint text-ink"
              title="Planning without clarity"
              text="Study tasks and priorities become difficult to manage when they live in scattered notes."
            >
              <ul className="space-y-2 text-sm text-ink">
                {[
                  ["physics revise?", "No date"],
                  ["chem notes", "No subject"],
                  ["bio chapter 5", "Priority?"],
                  ["test on saturday", "No plan"],
                ].map(([line, tag]) => (
                  <li key={line} className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-2">
                      <span
                        aria-hidden="true"
                        className="h-3.5 w-3.5 rounded-sm border border-line-strong"
                      />
                      {line}
                    </span>
                    <span className="rounded-control bg-tint px-2 py-0.5 text-xs text-muted">
                      {tag}
                    </span>
                  </li>
                ))}
              </ul>
            </ProblemCard>
          </div>

          <div data-stagger="" style={{ "--i": 1 }}>
            <ProblemCard
              icon={Timer}
              tone="bg-attention-subtle text-attention-ink"
              title="Tracking without accuracy"
              text="Planned hours do not necessarily represent the time you actually studied."
            >
              <div className="space-y-3">
                <div>
                  <p className="mb-1 flex justify-between text-xs text-muted">
                    <span>Planned</span>
                    <span>6h 00m</span>
                  </p>
                  <div className="h-2.5 rounded-full bg-line-strong" />
                </div>

                <div>
                  <p className="mb-1 flex justify-between text-xs text-muted">
                    <span>Actually studied</span>
                    <span>Not recorded</span>
                  </p>
                  <div className="h-2.5 rounded-full border border-dashed border-line-strong" />
                </div>

                <p className="text-xs text-muted">Forgot to start the stopwatch.</p>
              </div>
            </ProblemCard>
          </div>

          <div data-stagger="" style={{ "--i": 2 }}>
            <ProblemCard
              icon={ClipboardList}
              tone="bg-primary-subtle text-primary"
              title="Performance without context"
              text="Mock-test marks alone do not explain the complete preparation pattern."
            >
              <div className="flex items-end justify-between gap-3">
                <div>
                  <p className="text-[32px] font-semibold leading-none text-ink">65%</p>
                  <p className="mt-1 text-xs text-muted">Mock test score</p>
                </div>

                <ul className="flex flex-wrap justify-end gap-1.5">
                  {["Time spent?", "Which subjects?", "Pattern?"].map((question) => (
                    <li
                      key={question}
                      className="rounded-control border border-dashed border-line-strong px-2 py-0.5 text-xs text-muted"
                    >
                      {question}
                    </li>
                  ))}
                </ul>
              </div>
            </ProblemCard>
          </div>
        </Reveal>

        {/* Transition: StudyPulse connects them, keeping each one separate */}
        <Reveal className="mx-auto mt-14 max-w-4xl text-center">
          <h3 className="text-xl font-semibold text-ink sm:text-[25px]">
            StudyPulse connects them, and keeps each one separate.
          </h3>

          <div className="relative mt-8">
            <div
              aria-hidden="true"
              className="absolute inset-x-[16%] top-1/2 hidden border-t border-dashed border-line-strong md:block"
            />

            <div className="grid gap-3 text-left md:grid-cols-3 md:gap-8">
              <Concept
                index={0}
                title="Task status"
                text="What you completed. Set by you."
              />
              <Concept
                index={1}
                title="Recorded study time"
                text="What you actually studied, from timestamps."
              />
              <Concept
                index={2}
                title="Exam performance"
                text="How you scored. Entered from your tests."
              />
            </div>
          </div>

          <p className="mx-auto mt-6 max-w-2xl text-sm leading-6 text-muted">
            Optional links connect them. Nothing is inferred from another:
            finishing a timer does not complete a task, and a test result never
            creates a study session.
          </p>
        </Reveal>
      </div>
    </section>
  );
}
