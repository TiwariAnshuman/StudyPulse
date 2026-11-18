import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

import Reveal from "./Reveal";

export default function FinalCTA() {
  return (
    <section
      id="start"
      aria-labelledby="cta-heading"
      className="mx-auto w-full max-w-[1200px] px-4 pb-16 sm:px-6 sm:pb-24 lg:px-8"
    >
      <Reveal>
        <div className="relative overflow-hidden rounded-panel bg-primary px-6 py-14 text-center sm:px-12 sm:py-20">
          {/* Quiet texture, hidden from assistive technology */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 [background-image:repeating-linear-gradient(90deg,rgba(255,255,255,0.07)_0,rgba(255,255,255,0.07)_1px,transparent_1px,transparent_48px)] [mask-image:linear-gradient(to_bottom,black,transparent)]"
          />

          <div className="relative">
            <h2
              id="cta-heading"
              className="mx-auto max-w-2xl text-[32px] font-semibold leading-tight tracking-tight text-white sm:text-[44px]"
            >
              Make your preparation easier to understand.
            </h2>

            <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-white/85 sm:text-lg">
              Bring your plans, study sessions and mock-test performance
              together with StudyPulse.
            </p>

            <div className="mt-8 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
              <Link
                to="/register"
                className="btn min-h-12 bg-white px-6 text-base text-primary hover:bg-primary-subtle"
              >
                Start Your Journey
                <ArrowRight size={18} />
              </Link>

              <Link
                to="/login"
                className="btn min-h-12 border border-white/50 px-6 text-base text-white hover:bg-white/10"
              >
                Log in
              </Link>
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
