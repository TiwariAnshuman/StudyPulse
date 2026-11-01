import { useState } from "react";
import { NavLink } from "react-router-dom";
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
  X,
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

export default function MobileNav() {
  const [moreOpen, setMoreOpen] = useState(false);

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-[#DDE2DC] bg-white md:hidden">
      {moreOpen && (
        <div className="absolute bottom-full right-3 mb-3 w-52 rounded-lg border border-[#DDE2DC] bg-white p-2 shadow-lg">
          <div className="flex items-center justify-between px-2 py-2">
            <span className="text-sm font-semibold text-[#202522]">
              More pages
            </span>

            <button
              type="button"
              onClick={() => setMoreOpen(false)}
              aria-label="Close more pages"
              className="rounded p-1 text-[#66716B] hover:bg-[#F1F3EF]"
            >
              <X size={17} />
            </button>
          </div>

          {moreLinks.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setMoreOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-md px-3 py-3 text-sm ${
                    isActive
                      ? "bg-[#E6EEE8] text-[#426B57]"
                      : "text-[#66716B] hover:bg-[#F1F3EF]"
                  }`
                }
              >
                <Icon size={18} />
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
              className={({ isActive }) =>
                `flex min-h-16 flex-col items-center justify-center gap-1 text-xs ${
                  isActive ? "text-[#426B57]" : "text-[#89938D]"
                }`
              }
            >
              <Icon size={21} />
              <span>{item.label}</span>
            </NavLink>
          );
        })}

        <button
          type="button"
          onClick={() => setMoreOpen((previous) => !previous)}
          aria-expanded={moreOpen}
          className={`flex min-h-16 flex-col items-center justify-center gap-1 text-xs ${
            moreOpen ? "text-[#426B57]" : "text-[#89938D]"
          }`}
        >
          <MoreHorizontal size={21} />
          <span>More</span>
        </button>
      </div>
    </nav>
  );
}