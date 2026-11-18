import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Menu, X } from "lucide-react";

import Brand from "../../../components/ui/Brand";
import { scrollToId } from "../scroll";

const NAV_LINKS = [
  { label: "Features", id: "features" },
  { label: "How It Works", id: "how-it-works" },
  { label: "Analytics", id: "analytics" },
  { label: "About", id: "about" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeId, setActiveId] = useState(null);

  const sentinelRef = useRef(null);
  const menuButtonRef = useRef(null);

  // The bar gets a border and background once the page moves.
  // An invisible marker at the top is watched instead of a scroll listener.
  useEffect(() => {
    const sentinel = sentinelRef.current;

    if (!sentinel || typeof IntersectionObserver === "undefined") {
      return undefined;
    }

    const observer = new IntersectionObserver(([entry]) =>
      setScrolled(!entry.isIntersecting)
    );

    observer.observe(sentinel);

    return () => observer.disconnect();
  }, []);

  // Highlights the link of the section that is in the middle of the screen.
  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActiveId(entry.target.id);
        });
      },
      { rootMargin: "-45% 0px -50% 0px" }
    );

    NAV_LINKS.forEach(({ id }) => {
      const element = document.getElementById(id);

      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, []);

  // Escape closes the mobile menu.
  useEffect(() => {
    if (!menuOpen) return undefined;

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setMenuOpen(false);
        menuButtonRef.current?.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [menuOpen]);

  function handleAnchorClick(event, id) {
    event.preventDefault();
    setMenuOpen(false);
    scrollToId(id);
  }

  return (
    <>
      <div
        ref={sentinelRef}
        aria-hidden="true"
        className="pointer-events-none absolute left-0 top-0 h-8 w-px"
      />

      <header
        className={`sticky top-0 z-50 border-b transition-colors duration-300 ${
          scrolled || menuOpen
            ? "border-line bg-canvas"
            : "border-transparent bg-transparent"
        }`}
      >
        <div className="mx-auto flex h-16 w-full max-w-[1200px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <a
            href="#top"
            onClick={(event) => {
              event.preventDefault();
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            aria-label="StudyPulse, back to top"
            className="rounded-control"
          >
            <Brand />
          </a>

          <nav aria-label="Primary" className="hidden md:block">
            <ul className="flex items-center gap-1">
              {NAV_LINKS.map((link) => (
                <li key={link.id}>
                  <a
                    href={`#${link.id}`}
                    onClick={(event) => handleAnchorClick(event, link.id)}
                    aria-current={activeId === link.id ? "location" : undefined}
                    className={`relative inline-flex min-h-11 items-center px-3 text-sm font-medium transition-colors after:absolute after:inset-x-3 after:bottom-2 after:h-px after:origin-left after:bg-ink after:transition-transform after:duration-300 ${
                      activeId === link.id
                        ? "text-ink after:scale-x-100"
                        : "text-muted after:scale-x-0 hover:text-ink hover:after:scale-x-100 focus-visible:after:scale-x-100"
                    }`}
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div className="flex items-center gap-1 sm:gap-2">
            <Link to="/login" className="btn btn-quiet hidden md:inline-flex">
              Log in
            </Link>

            <Link to="/register" className="btn btn-primary">
              Get Started
            </Link>

            <button
              ref={menuButtonRef}
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
              aria-expanded={menuOpen}
              aria-controls="mobile-menu"
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              className="btn btn-quiet h-11 w-11 px-0 md:hidden"
            >
              {menuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {/* Mobile menu: fades and slides, never animates height */}
        <div
          id="mobile-menu"
          className={`absolute inset-x-0 top-full border-b border-line bg-canvas px-4 pb-4 pt-1 transition-[opacity,transform,visibility] duration-200 md:hidden ${
            menuOpen
              ? "visible translate-y-0 opacity-100"
              : "invisible -translate-y-2 opacity-0"
          }`}
        >
          <ul>
            {NAV_LINKS.map((link) => (
              <li key={link.id}>
                <a
                  href={`#${link.id}`}
                  onClick={(event) => handleAnchorClick(event, link.id)}
                  className="flex min-h-12 items-center rounded-control px-3 text-base font-medium text-ink active:bg-tint"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>

          <Link
            to="/login"
            className="btn btn-secondary mt-2 w-full"
            onClick={() => setMenuOpen(false)}
          >
            Log in
          </Link>
        </div>
      </header>
    </>
  );
}
