import "./landing.css";

import { usePrefersReducedMotion } from "./hooks";

import Navbar from "./components/Navbar";
import HeroSection from "./components/HeroSection";
import ProblemSection from "./components/ProblemSection";
import FeaturePillars from "./components/FeaturePillars";
import ProductShowcase from "./components/ProductShowcase";
import HowItWorks from "./components/HowItWorks";
import AnalyticsSection from "./components/AnalyticsSection";
import PrivacySection from "./components/PrivacySection";
import FinalCTA from "./components/FinalCTA";
import Footer from "./components/Footer";

// StudyPulse marketing page. Shown at "/".
// data-motion="ok" switches on every animation in landing.css. Visitors who
// prefer reduced motion get "reduced", and all content simply appears.
export default function LandingPage() {
  const reducedMotion = usePrefersReducedMotion();

  return (
    <div
      className="landing-root relative min-h-[100dvh] bg-canvas text-ink"
      data-motion={reducedMotion ? "reduced" : "ok"}
    >
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[60] focus:rounded-control focus:bg-surface focus:px-4 focus:py-3 focus:text-sm focus:font-medium focus:shadow-lg"
      >
        Skip to content
      </a>

      <Navbar />

      <main id="main-content" tabIndex={-1} className="outline-none">
        <HeroSection />
        <ProblemSection />
        <FeaturePillars />
        <ProductShowcase />
        <HowItWorks />
        <AnalyticsSection />
        <PrivacySection />
        <FinalCTA />
      </main>

      <Footer />
    </div>
  );
}
