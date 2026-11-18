import { useEffect, useRef, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  CalendarDays,
  Timer,
  ChartNoAxesCombined,
  MoreHorizontal,
  BookOpen,
  History,
  ClipboardList,
  Settings,
} from "lucide-react";

const mainLinks = [
  { label: "Home", path: "/dashboard", icon: LayoutDashboard },
  { label: "Planner", path: "/tasks", icon: CalendarDays },
  { label: "Timer", path: "/timer", icon: Timer },
  { label: "Analytics", path: "/analytics", icon: ChartNoAxesCombined },
];

const moreLinks = [
  { label: "Subjects", path: "/subjects", icon: BookOpen },
  { label: "Sessions", path: "/sessions", icon: History },
  { label: "Mock Tests", path: "/tests", icon: ClipboardList },
  { label: "Settings", path: "/settings", icon: Settings },
];

const tabClasses = (active) =>
  `relative flex min-h-16 flex-col items-center justify-center gap-1 text-xs transition-colors ${
    active ? "font-semibold text-primary" : "font-medium text-muted"
  }`;

function ActiveBar() {
  return (
    <span
      aria-hidden="true"
      className="absolute inset-x-6 top-0 h-0.5 rounded-b bg-primary"
    />
  );
}

export default function MobileNav() {
  const { pathname } = useLocation();

  // The sheet is open only on the page where it was opened, so any
  // navigation (tap, back button) closes it without extra effects.
  const [openOnPath, setOpenOnPath] = useState(null);
  const moreOpen = openOnPath === pathname;

  const moreButtonRef = useRef(null);
  const firstMoreLinkRef = useRef(null);

  const moreActive = moreLinks.some(
    (item) => pathname === item.path || pathname.startsWith(`${item.path}/`)
  );

  function closeMore() {
    setOpenOnPath(null);
  }

  // Escape closes the sheet; focus moves in when it opens.
  useEffect(() => {
    if (!moreOpen) return undefined;

    firstMoreLinkRef.current?.focus();

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setOpenOnPath(null);
        moreButtonRef.current?.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [moreOpen]);

  return (
    <>
      {/* Tapping outside the sheet closes it */}
      {moreOpen && (
        <div
          aria-hidden="true"
          onClick={closeMore}
          className="fixed inset-0 z-40 bg-ink/30 lg:hidden"
        />
      )}

      <nav
        aria-label="Main"
        className="fixed inset-x-0 bottom-0 z-50 border-t border-line bg-surface pb-[env(safe-area-inset-bottom)] lg:hidden"
      >
        {moreOpen && (
          <div
            id="more-pages"
            className="animate-sheet-in absolute inset-x-0 bottom-full rounded-t-panel border-t border-line bg-surface px-2 pb-2 pt-1 shadow-lg"
          >
            <p className="px-4 pb-1 pt-3 text-xs font-semibold text-muted">
              More pages
            </p>

            {moreLinks.map((item, index) => {
              const Icon = item.icon;

              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  ref={index === 0 ? firstMoreLinkRef : undefined}
                  className={({ isActive }) =>
                    `flex min-h-12 items-center gap-3 rounded-control px-4 text-base ${
                      isActive
                        ? "bg-primary-subtle font-semibold text-primary"
                        : "text-ink active:bg-tint"
                    }`
                  }
                >
                  <Icon size={20} strokeWidth={1.8} />
                  {item.label}
                </NavLink>
              );
            })}
          </div>
        )}

        <div className="grid grid-cols-5">
          {mainLinks.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) => tabClasses(isActive)}
              >
                {({ isActive }) => (
                  <>
                    {isActive && <ActiveBar />}
                    <Icon size={22} strokeWidth={isActive ? 2.1 : 1.8} />
                    <span>{item.label}</span>
                  </>
                )}
              </NavLink>
            );
          })}

          <button
            ref={moreButtonRef}
            type="button"
            onClick={() => setOpenOnPath(moreOpen ? null : pathname)}
            aria-expanded={moreOpen}
            aria-controls="more-pages"
            className={tabClasses(moreOpen || moreActive)}
          >
            {(moreOpen || moreActive) && <ActiveBar />}
            <MoreHorizontal size={22} strokeWidth={moreActive ? 2.1 : 1.8} />
            <span>More</span>
          </button>
        </div>
      </nav>
    </>
  );
}
