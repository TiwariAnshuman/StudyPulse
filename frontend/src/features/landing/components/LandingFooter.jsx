
import { Link } from "react-router-dom";
import {
  Activity,
  ArrowUpRight,
  ArrowUp,
} from "lucide-react";

const footerLinks = [
  {
    label: "How it works",
    href: "#workflow",
  },
  {
    label: "Features",
    href: "#features",
  },
];

export default function LandingFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="landing-footer">
      <div className="landing-container">

        <div className="landing-footer-main">

          {/* Brand information */}
          <div className="landing-footer-brand">
            <Link
              to="/"
              className="landing-brand"
              aria-label="StudyPulse home"
            >
              <span className="landing-brand-icon">
                <Activity size={21} aria-hidden="true" />
              </span>

              <span className="landing-brand-name">
                Study<span>Pulse</span>
              </span>
            </Link>

            <p className="landing-footer-tagline">
              Plan your study. Track your effort.
              Understand your progress.
            </p>
          </div>

          {/* Footer navigation */}
          <div className="landing-footer-navigation">

            <div className="landing-footer-group">
              <span className="landing-footer-heading">
                EXPLORE
              </span>

              {footerLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="landing-footer-link"
                >
                  {link.label}
                </a>
              ))}
            </div>

            <div className="landing-footer-group">
              <span className="landing-footer-heading">
                ACCOUNT
              </span>

              <Link
                to="/login"
                className="landing-footer-link"
              >
                Sign in
              </Link>

              <Link
                to="/register"
                className="landing-footer-link"
              >
                Create account
                <ArrowUpRight
                  size={14}
                  aria-hidden="true"
                />
              </Link>
            </div>

          </div>
        </div>

        <div className="landing-footer-bottom">
          <p>
            © {currentYear} StudyPulse. All rights reserved.
          </p>

          <a
            href="#main-content"
            className="landing-footer-back-to-top"
          >
            Back to top
            <ArrowUp size={15} aria-hidden="true" />
          </a>
        </div>

      </div>
    </footer>
  );
}
