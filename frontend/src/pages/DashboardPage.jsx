import { Link } from "react-router-dom";
import { useAuth } from "../app/AuthContext";

export default function DashboardPage() {
  const { user, logout } = useAuth();

  async function handleLogout() {
    try {
      await logout();
    } catch {
      // Local authentication state is cleared by logout().
      // The server request may still have failed.
    }
  }

  const displayName =
    user?.displayName ??
    user?.name ??
    user?.email ??
    "Student";

  return (
    <main className="min-h-screen bg-stone-50 px-6 py-12 text-stone-900">
      <div className="mx-auto max-w-4xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Link
            to="/"
            className="text-sm font-semibold tracking-wide text-emerald-800"
          >
            STUDYPULSE
          </Link>

          <button
            onClick={handleLogout}
            className="rounded-lg border border-stone-300 px-4 py-2 text-sm font-medium hover:bg-white"
          >
            Log out
          </button>
        </div>

        <section className="mt-12 rounded-2xl border border-stone-200 bg-white p-8">
          <p className="text-sm font-medium text-emerald-800">
            PRIVATE DASHBOARD
          </p>

          <h1 className="mt-3 text-3xl font-semibold tracking-tight">
            Welcome, {displayName}
          </h1>

          <p className="mt-3 text-stone-600">
            Your authenticated StudyPulse area is working.
            We will build the actual study dashboard in a later step.
          </p>
        </section>
      </div>
    </main>
  );
}