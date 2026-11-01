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

const navigation = [
  {
    title: "Overview",
    items: [
      {
        label: "Dashboard",
        path: "/dashboard",
        icon: LayoutDashboard,
      },
    ],
  },
  {
    title: "Study",
    items: [
      {
        label: "Planner",
        path: "/tasks",
        icon: CalendarDays,
      },
      {
        label: "Subjects",
        path: "/subjects",
        icon: BookOpen,
      },
      {
        label: "Focus Timer",
        path: "/timer",
        icon: Timer,
      },
      {
        label: "Sessions",
        path: "/sessions",
        icon: History,
      },
    ],
  },
  {
    title: "Performance",
    items: [
      {
        label: "Mock Tests",
        path: "/tests",
        icon: ClipboardList,
      },
      {
        label: "Analytics",
        path: "/analytics",
        icon: ChartNoAxesCombined,
      },
    ],
  },
];

const linkClasses = ({ isActive }) =>
  `flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors
  ${
    isActive
      ? "bg-[#E6EEE8] text-[#426B57]"
      : "text-[#66716B] hover:bg-[#F1F3EF] hover:text-[#202522]"
  }`;

export default function Sidebar() {
  return (
    <aside className="hidden min-h-screen w-[248px] shrink-0 border-r border-[#DDE2DC] bg-white md:flex md:flex-col">
      {/* Brand */}
      <div className="flex h-[76px] items-center border-b border-[#DDE2DC] px-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#426B57] text-lg font-semibold text-white">
          S
        </div>

        <span className="ml-3 text-lg font-semibold tracking-tight text-[#202522]">
          StudyPulse
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-7 px-4 py-7">
        {navigation.map((group) => (
          <div key={group.title}>
            <p className="mb-3 px-3 text-[11px] font-semibold uppercase tracking-wider text-[#89938D]">
              {group.title}
            </p>

            <div className="space-y-1">
              {group.items.map((item) => {
                const Icon = item.icon;

                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={linkClasses}
                  >
                    <Icon size={19} strokeWidth={1.8} />
                    <span>{item.label}</span>
                  </NavLink>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Settings */}
      <div className="border-t border-[#DDE2DC] p-4">
        <NavLink to="/settings" className={linkClasses}>
          <Settings size={19} strokeWidth={1.8} />
          <span>Settings</span>
        </NavLink>
      </div>
    </aside>
  );
}