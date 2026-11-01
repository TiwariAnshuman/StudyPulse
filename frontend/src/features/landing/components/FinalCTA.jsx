
import { Link } from "react-router-dom";
import {
  ArrowRight,
  MoveUpRight,
  CheckCircle2,
} from "lucide-react";

export default function FinalCTA() {
  return (
    <section
      className="final-cta-section"
      aria-labelledby="final-cta-heading"
    >
      <div className="landing-container">
        <div className="final-cta-content">

          <span className="final-cta-eyebrow">
            YOUR PREPARATION, YOUR RECORD
          </span>

          <h2
            id="final-cta-heading"
            className="final-cta-heading"
          >
            Make your preparation
            <span> easier to understand.</span>
          </h2>

          <p className="final-cta-description">
            Start keeping a clear record of what you plan,
            what you study and how you perform.
            Bring your preparation into one place with StudyPulse.
          </p>

          <div className="final-cta-actions">
            <Link
              to="/register"
              className="final-cta-primary-button"
            >
              Get started
              <ArrowRight size={18} aria-hidden="true" />
            </Link>

            <span className="final-cta-supporting-text">
              <CheckCircle2 size={16} aria-hidden="true" />
              Your personal study workspace
            </span>
          </div>

        </div>

        <div className="final-cta-decoration" aria-hidden="true">
          <div className="final-cta-decoration-circle">
            <MoveUpRight size={30} />
          </div>
        </div>

      </div>
    </section>
  );
}
