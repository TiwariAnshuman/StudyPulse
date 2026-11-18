import { Outlet, ScrollRestoration } from "react-router-dom";
import Sidebar from "./Sidebar";
import MobileNav from "./MobileNav";

export default function AppLayout() {
  return (
    <div className="min-h-[100dvh] bg-canvas text-ink lg:flex">
      {/* Lets keyboard users jump past the navigation */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[60] focus:rounded-control focus:bg-surface focus:px-4 focus:py-3 focus:text-sm focus:font-medium focus:shadow-lg"
      >
        Skip to content
      </a>

      <Sidebar />

      {/* Space at the bottom on phones keeps content clear of the tab bar. */}
      <main
        id="main-content"
        tabIndex={-1}
        className="min-w-0 flex-1 pb-[calc(5rem+env(safe-area-inset-bottom))] outline-none lg:pb-0"
      >
        <Outlet />
      </main>

      <MobileNav />

      {/* New page starts at the top instead of keeping the old scroll position. */}
      <ScrollRestoration />
    </div>
  );
}
