import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <h1 className="text-3xl font-semibold text-stone-900">
        Page not found
      </h1>

      <p className="mt-3 text-stone-600">
        The page you requested does not exist.
      </p>

      <Link
        to="/"
        className="mt-6 rounded-lg bg-emerald-800 px-5 py-3 text-sm font-medium text-white hover:bg-emerald-900"
      >
        Go home
      </Link>
    </main>
  );
}