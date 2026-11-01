
import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Activity,
  ArrowUpRight,
  Menu,
  X,
} from "lucide-react";

const navigationLinks = [
  {
    label: "How it works",
    href: "#workflow",
  },
  {
    label: "Features",
    href: "#features",
  },
];

export default function LandingNavbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  function closeMenu() {
    setIsMenuOpen(false);
  }

  return (
    <header className="landing-navbar">
      <div className="landing-container">
        <nav
          className="landing-nav"
          aria-label="Main navigation"
        >
          {/* Brand */}
          <Link
            to="/"
            className="landing-brand"
            aria-label="StudyPulse home"
            onClick={closeMenu}
          >
            <span className="landing-brand-icon">
              <Activity size={21} aria-hidden="true" />
            </span>

            <span className="landing-brand-name">
              Study<span>Pulse</span>
            </span>
          </Link>

          {/* Desktop navigation */}
          <div className="landing-nav-desktop">
            <div className="landing-nav-links">
              {navigationLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="landing-nav-link"
                >
                  {link.label}
                </a>
              ))}
            </div>

            <div className="landing-nav-actions">
              <Link
                to="/login"
                className="landing-nav-login"
              >
                Sign in
              </Link>

              <Link
                to="/register"
                className="landing-nav-cta"
              >
                Get started
                <ArrowUpRight
                  size={16}
                  aria-hidden="true"
                />
              </Link>
            </div>
          </div>

          {/* Mobile menu button */}
          <button
            type="button"
            className="landing-mobile-menu-button"
            aria-label={
              isMenuOpen
                ? "Close navigation menu"
                : "Open navigation menu"
            }
            aria-expanded={isMenuOpen}
            aria-controls="landing-mobile-menu"
            onClick={() => setIsMenuOpen((previous) => !previous)}
          >
            {isMenuOpen ? (
              <X size={22} aria-hidden="true" />
            ) : (
              <Menu size={22} aria-hidden="true" />
            )}
          </button>
        </nav>

        {/* Mobile navigation */}
        <div
          id="landing-mobile-menu"
          className={`landing-mobile-menu ${
            isMenuOpen ? "is-open" : ""
          }`}
          hidden={!isMenuOpen}
        >
          <div className="landing-mobile-links">
            {navigationLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="landing-mobile-link"
                onClick={closeMenu}
              >
                {link.label}
                <ArrowUpRight
                  size={16}
                  aria-hidden="true"
                />
              </a>
            ))}
          </div>

          <div className="landing-mobile-actions">
            <Link
              to="/login"
              className="landing-mobile-login"
              onClick={closeMenu}
            >
              Sign in
            </Link>

            <Link
              to="/register"
              className="landing-mobile-cta"
              onClick={closeMenu}
            >
              Get started
              <ArrowUpRight
                size={16}
                aria-hidden="true"
              />
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
