import { ChartNoAxesCombined, ClipboardCheck, ListChecks, Timer } from "lucide-react";

import Reveal from "./Reveal";

const STEPS = [
  {
    number: "01",
    icon: ListChecks,
    title: "Create your plan",
    text: "Add subjects and organize your study tasks.",
  },
  {
    number: "02",
    icon: Timer,
    title: "Start studying",
    text: "Use the focus timer or manually record a session.",
  },
  {
    number: "03",
    icon: ClipboardCheck,
    title: "Record your tests",
    text: "Save mock-test results and subject-wise marks.",
  },
  {
    number: "04",
    icon: ChartNoAxesCombined,
    title: "Review your preparation",
    text: "Understand study patterns and performance through analytics.",
  },
];

export default function HowItWorks() {
  return (
    <section
      id="how-it-works"
      aria-labelledby="how-heading"
      className="mx-auto w-full max-w-[1200px] px-4 py-16 sm:px-6 sm:py-24 lg:px-8"
    >
      <Reveal className="max-w-2xl">
        <h2
          id="how-heading"
          className="text-[32px] font-semibold leading-tight tracking-tight text-ink sm:text-[40px]"
        >
          From daily planning to meaningful progress.
        </h2>

        <p className="mt-4 text-base leading-7 text-muted sm:text-lg">
          A simple loop you can repeat every day. Skip any step whenever you
          need to; none of them depends on another.
        </p>
      </Reveal>

      {/* One reveal drives the line and the steps, so they animate in order */}
      <Reveal className="relative mt-12">
        {/* Horizontal line (large screens) */}
        <div
          aria-hidden="true"
          className="absolute left-[12.5%] right-[12.5%] top-6 hidden h-px bg-line lg:block"
        >
          <div className="lp-draw-x h-full w-full bg-line-strong" />
        </div>

        {/* Vertical line (phones and tablets) */}
        <div
          aria-hidden="true"
          className="absolute bottom-6 left-6 top-6 w-px bg-line lg:hidden"
        >
          <div className="lp-draw-y h-full w-full bg-line-strong" />
        </div>

        <ol className="relative grid gap-8 lg:grid-cols-4 lg:gap-6">
          {STEPS.map((step, index) => {
            const Icon = step.icon;

            return (
              <li
                key={step.number}
                data-stagger=""
                style={{ "--i": index * 2 }}
                className="relative flex gap-5 lg:block"
              >
                <span className="relative z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-line-strong bg-surface text-sm font-semibold text-primary lg:mx-auto">
                  {step.number}
                </span>

                <div className="min-w-0 lg:mt-5 lg:text-center">
                  <h3 className="flex items-center gap-2 text-xl font-semibold text-ink lg:justify-center">
                    <Icon size={18} className="shrink-0 text-muted" />
                    {step.title}
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-muted">{step.text}</p>
                </div>
              </li>
            );
          })}
        </ol>
      </Reveal>
    </section>
  );
}
