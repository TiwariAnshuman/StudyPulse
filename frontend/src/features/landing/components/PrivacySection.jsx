import { Check, X } from "lucide-react";

import Reveal from "./Reveal";

const PRIVATE_BY_DESIGN = [
  {
    title: "Personal accounts",
    text: "Every account sees only its own records.",
  },
  {
    title: "Private study records",
    text: "Your tasks, sessions and test results belong to you.",
  },
  {
    title: "You stay in control",
    text: "Edit or delete your records. Data export and account deletion are part of the privacy design.",
  },
];

const NOT_INCLUDED = [
  "Social leaderboards",
  "Public sharing of personal study data",
  "Rankings against other students",
];

export default function PrivacySection() {
  return (
    <section
      id="privacy"
      aria-labelledby="privacy-heading"
      className="mx-auto w-full max-w-[1200px] px-4 py-16 sm:px-6 sm:py-24 lg:px-8"
    >
      <div className="grid gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-16">
        <Reveal>
          <h2
            id="privacy-heading"
            className="text-[32px] font-semibold leading-tight tracking-tight text-ink sm:text-[40px]"
          >
            Your preparation. Your data. Your control.
          </h2>

          <p className="mt-4 text-base leading-7 text-muted sm:text-lg">
            StudyPulse is a personal record, not a social network. It is built
            so the honest picture of your preparation stays yours.
          </p>
        </Reveal>

        <Reveal className="grid gap-4 sm:grid-cols-2">
          <div
            data-stagger=""
            style={{ "--i": 0 }}
            className="rounded-panel border border-line bg-surface p-5"
          >
            <h3 className="text-base font-semibold text-ink">Private by design</h3>

            <ul className="mt-4 space-y-4">
              {PRIVATE_BY_DESIGN.map((item) => (
                <li key={item.title} className="flex gap-3">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary-subtle text-primary">
                    <Check size={13} strokeWidth={2.5} />
                  </span>

                  <div>
                    <p className="text-sm font-semibold text-ink">{item.title}</p>
                    <p className="mt-0.5 text-sm leading-6 text-muted">{item.text}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div
            data-stagger=""
            style={{ "--i": 1 }}
            className="rounded-panel border border-line bg-surface p-5"
          >
            <h3 className="text-base font-semibold text-ink">Not part of StudyPulse</h3>

            <ul className="mt-4 space-y-4">
              {NOT_INCLUDED.map((item) => (
                <li key={item} className="flex gap-3">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-tint text-muted">
                    <X size={13} strokeWidth={2.5} />
                  </span>

                  <p className="text-sm font-semibold text-ink">{item}</p>
                </li>
              ))}
            </ul>

            <p className="mt-5 text-sm leading-6 text-muted">
              There is no feed and nobody to compare yourself with. Only your
              own records.
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
