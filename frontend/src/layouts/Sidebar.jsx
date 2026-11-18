import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  CalendarDays,
  BookOpen,
  Timer,
  History,
  ClipboardList,
  ChartNoAxesCombined,
  Settings,
} from "lucide-react";

import Brand from "../components/ui/Brand";

const navigation = [
  {
    title: "Overview",
    items: [{ label: "Dashboard", path: "/dashboard", icon: LayoutDashboard }],
  },
  {
    title: "Study",
    items: [
      { label: "Planner", path: "/tasks", icon: CalendarDays },
      { label: "Subjects", path: "/subjects", icon: BookOpen },
      { label: "Focus Timer", path: "/timer", icon: Timer },
      { label: "Sessions", path: "/sessions", icon: History },
    ],
  },
  {
    title: "Performance",
    items: [
      { label: "Mock Tests", path: "/tests", icon: ClipboardList },
      { label: "Analytics", path: "/analytics", icon: ChartNoAxesCombined },
    ],
  },
];

const linkClasses = ({ isActive }) =>
  `relative flex min-h-11 items-center gap-3 rounded-control px-3 text-sm transition-colors ${
    isActive
      ? "bg-primary-subtle font-semibold text-primary"
      : "font-medium text-muted hover:bg-tint hover:text-ink"
  }`;

function SidebarLink({ to, icon: Icon, label }) {
  return (
    <NavLink to={to} className={linkClasses}>
      {({ isActive }) => (
        <>
          {/* A bar as well as colour, so the current page is not colour-only */}
          {isActive && (
            <span
              aria-hidden="true"
              className="absolute inset-y-2 left-0 w-[3px] rounded-r bg-primary"
            />
          )}

          <Icon size={20} strokeWidth={1.8} />
          <span>{label}</span>
        </>
      )}
    </NavLink>
  );
}

export default function Sidebar() {
  return (
    <aside className="sticky top-0 hidden h-[100dvh] w-[248px] shrink-0 flex-col self-start overflow-y-auto border-r border-line bg-surface lg:flex">
      {/* Brand */}
      <div className="flex h-[76px] shrink-0 items-center border-b border-line px-6">
        <Brand />
      </div>

      {/* Navigation */}
      <nav aria-label="Main" className="flex-1 space-y-6 px-4 py-6">
        {navigation.map((group) => (
          <div key={group.title}>
            <p className="mb-2 px-3 text-xs font-semibold text-muted">
              {group.title}
            </p>

            <div className="space-y-1">
              {group.items.map((item) => (
                <SidebarLink
                  key={item.path}
                  to={item.path}
                  icon={item.icon}
                  label={item.label}
                />
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Settings stays visible at the bottom of the screen */}
      <div className="shrink-0 border-t border-line p-4">
        <SidebarLink to="/settings" icon={Settings} label="Settings" />
      </div>
    </aside>
  );
}
