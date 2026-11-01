
import { Link } from "react-router-dom";
import { ArrowRight, ArrowDown } from "lucide-react";

import ProductWalkthrough from "./ProductWalkthrough";

export default function HeroSection() {
  return (
    <section
      className="landing-hero"
      aria-labelledby="hero-heading"
    >
      <div className="landing-container">
        <div className="hero-layout">

          {/* Hero content */}
          <div className="hero-content">

            <span className="hero-eyebrow">
              A CLEARER WAY TO PREPARE
            </span>

            <h1
              id="hero-heading"
              className="hero-heading"
            >
              Your preparation,
              <span> clearly in view.</span>
            </h1>

            <p className="hero-description">
              Bring your study tasks, actual study time and
              mock-test results together. Build a clearer
              picture of your preparation through the data
              you record.
            </p>

            {/* Primary and secondary actions */}
            <div className="hero-actions">

              <Link
                to="/register"
                className="hero-primary-button"
              >
                Get started
                <ArrowRight size={18} aria-hidden="true" />
              </Link>

              <a
                href="#workflow"
                className="hero-secondary-button"
              >
                See how it works
                <ArrowDown size={17} aria-hidden="true" />
              </a>

            </div>

            <p className="hero-supporting-text">
              A personal record of your preparation,
              built one session at a time.
            </p>

          </div>

          {/* Product preview */}
          <div className="hero-preview">
            <ProductWalkthrough />
          </div>

        </div>
      </div>
    </section>
  );
}
