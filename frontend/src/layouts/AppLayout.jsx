import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import MobileNav from "./MobileNav";

export default function AppLayout() {
  return (
    <div className="flex min-h-screen bg-[#F7F7F3] text-[#202522]">
      <Sidebar />

      <main className="min-w-0 flex-1 pb-20 md:pb-0">
        <Outlet />
      </main>

      <MobileNav />
    </div>
  );
}