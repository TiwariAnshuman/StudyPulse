import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

import { scrollToId } from "../scroll";
import Reveal from "./Reveal";
import DashboardPreview, {
  LatestTestCard,
  SessionSavedCard,
} from "./previews/DashboardPreview";

export default function HeroSection() {
  return (
    <section aria-labelledby="hero-heading" className="relative overflow-x-clip">
      {/* Quiet background: faint lines and one soft green accent */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-[620px] overflow-hidden"
      >
        <div className="lp-lines lp-lines-bg absolute inset-y-0 -left-12 -right-12 [mask-image:linear-gradient(to_bottom,black,transparent_85%)]" />
        <div className="absolute -right-32 -top-32 h-[420px] w-[420px] rounded-full bg-primary-subtle opacity-80 blur-3xl" />
      </div>

      <div className="relative mx-auto w-full max-w-[1200px] px-4 pb-16 pt-10 sm:px-6 sm:pt-16 lg:px-8 lg:pb-24 lg:pt-20">
        <h1
          id="hero-heading"
          className="max-w-3xl text-[40px] font-semibold leading-[1.06] tracking-tight text-ink sm:text-[56px] lg:text-[64px]"
        >
          <span className="lp-rise block" style={{ "--d": "60ms" }}>
            Your preparation deserves
          </span>
          <span className="lp-rise block text-primary" style={{ "--d": "160ms" }}>
            more than a checklist.
          </span>
        </h1>

        <p
          className="lp-rise mt-6 max-w-2xl text-base leading-7 text-muted sm:text-xl sm:leading-8"
          style={{ "--d": "280ms" }}
        >
          Plan your study, track your actual effort and understand your exam
          performance — all in one place.
        </p>

        <div
          className="lp-rise mt-8 flex flex-col gap-3 sm:flex-row sm:items-center"
          style={{ "--d": "380ms" }}
        >
          <Link to="/register" className="btn btn-primary min-h-12 px-6 text-base">
            Get Started
            <ArrowRight size={18} />
          </Link>

          <a
            href="#features"
            onClick={(event) => {
              event.preventDefault();
              scrollToId("features");
            }}
            className="btn btn-secondary min-h-12 px-6 text-base"
          >
            Explore Features
          </a>
        </div>

        <p
          className="lp-rise mt-4 text-sm text-muted"
          style={{ "--d": "460ms" }}
        >
          Built for focused preparation. Designed around your progress.
        </p>

        {/* Product preview with layered cards */}
        <Reveal delay={250} className="relative mt-12 sm:mt-16">
          <DashboardPreview />

          <div
            data-stagger=""
            style={{ "--i": 5 }}
            className="mt-4 lg:absolute lg:-right-8 lg:-top-10 lg:mt-0 lg:w-64"
          >
            <div className="lp-float lp-shadow-sm rounded-panel">
              <LatestTestCard />
            </div>
          </div>

          <div
            data-stagger=""
            style={{ "--i": 6 }}
            className="absolute -bottom-8 -left-6 hidden w-60 lg:block"
          >
            <div className="lp-float-slow lp-shadow-sm rounded-panel">
              <SessionSavedCard />
            </div>
          </div>

          <p className="mt-4 text-xs text-muted lg:mt-6">
            Illustrative sample data. Your own dashboard shows only your
            recorded data.
          </p>
        </Reveal>
      </div>
    </section>
  );
}
