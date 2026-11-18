import { Link } from "react-router-dom";

import Brand from "../../../components/ui/Brand";
import { scrollToId } from "../scroll";

function AnchorLink({ id, children }) {
  return (
    <a
      href={`#${id}`}
      onClick={(event) => {
        event.preventDefault();
        scrollToId(id);
      }}
      className="inline-flex min-h-11 items-center text-sm text-muted transition-colors hover:text-ink"
    >
      {children}
    </a>
  );
}

export default function Footer() {
  return (
    <footer className="border-t border-line bg-surface">
      <div className="mx-auto w-full max-w-[1200px] px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-[minmax(0,2fr)_repeat(3,minmax(0,1fr))]">
          {/* About */}
          <section id="about" aria-labelledby="about-heading">
            <h2 id="about-heading" className="sr-only">
              About StudyPulse
            </h2>

            <Brand />

            <p className="mt-4 max-w-sm text-sm leading-6 text-muted">
              StudyPulse is a study planner, focus timer and exam tracker. It
              links what you planned, how long you actually studied and how you
              performed in mock tests, and shows what your records support.
            </p>

            <p className="mt-3 max-w-sm text-sm leading-6 text-muted">
              Our aim: every exam aspirant has an honest, private and
              easy-to-keep record of their preparation.
            </p>
          </section>

          <nav aria-label="Product">
            <h2 className="text-sm font-semibold text-ink">Product</h2>

            <ul className="mt-2">
              <li>
                <AnchorLink id="features">Features</AnchorLink>
              </li>
              <li>
                <AnchorLink id="how-it-works">How It Works</AnchorLink>
              </li>
              <li>
                <AnchorLink id="analytics">Analytics</AnchorLink>
              </li>
            </ul>
          </nav>

          <nav aria-label="Account">
            <h2 className="text-sm font-semibold text-ink">Account</h2>

            <ul className="mt-2">
              <li>
                <Link
                  to="/login"
                  className="inline-flex min-h-11 items-center text-sm text-muted transition-colors hover:text-ink"
                >
                  Log in
                </Link>
              </li>
              <li>
                <Link
                  to="/register"
                  className="inline-flex min-h-11 items-center text-sm text-muted transition-colors hover:text-ink"
                >
                  Create account
                </Link>
              </li>
            </ul>
          </nav>

          <div>
            <h2 className="text-sm font-semibold text-ink">Trust</h2>

            <ul className="mt-2">
              <li>
                <AnchorLink id="privacy">Privacy</AnchorLink>
              </li>
              <li className="flex min-h-11 items-center text-sm text-muted">
                Contact: details coming soon
              </li>
            </ul>
          </div>
        </div>

        <p className="mt-10 border-t border-line pt-6 text-xs text-muted">
          © {new Date().getFullYear()} StudyPulse. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
