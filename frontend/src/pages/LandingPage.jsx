
import LandingNavbar from "../features/landing/components/LandingNavbar";
import HeroSection from "../features/landing/components/HeroSection";
import ProblemSection from "../features/landing/components/ProblemSection";
import WorkflowSection from "../features/landing/components/WorkflowSection";
import FeaturesSection from "../features/landing/components/FeaturesSection";
import PhilosophySection from "../features/landing/components/PhilosophySection";
import FinalCTA from "../features/landing/components/FinalCTA";
import LandingFooter from "../features/landing/components/LandingFooter";

import "../styles/landing.css";

export default function LandingPage() {
  return (
    <div className="landing-page">
      {/* Skip navigation for keyboard and screen-reader users */}
      <a href="#main-content" className="landing-skip-link">
        Skip to content
      </a>

      {/* Navigation */}
      <LandingNavbar />

      {/* Main landing page content */}
      <main id="main-content">
        <HeroSection />

        <ProblemSection />

        <WorkflowSection />

        <FeaturesSection />

        <PhilosophySection />

        <FinalCTA />
      </main>

      {/* Footer */}
      <LandingFooter />
    </div>
  );
}
