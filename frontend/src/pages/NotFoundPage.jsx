import { Link } from "react-router-dom";
import Brand from "../components/ui/Brand";

export default function NotFoundPage() {
  return (
    <main className="flex min-h-[100dvh] flex-col items-center justify-center bg-canvas px-6 text-center text-ink">
      <Brand className="mb-10" />

      <h1 className="text-[25px] font-semibold tracking-tight sm:text-[32px]">
        Page not found
      </h1>

      <p className="mt-3 max-w-sm text-sm leading-6 text-muted">
        The page you asked for does not exist or has moved.
      </p>

      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Link to="/dashboard" className="btn btn-primary">
          Go to dashboard
        </Link>

        <Link to="/" className="btn btn-secondary">
          Go home
        </Link>
      </div>
    </main>
  );
}
