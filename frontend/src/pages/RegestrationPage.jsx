import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Eye,
  EyeOff,
  LoaderCircle,
} from "lucide-react";
import { apiRequest } from "../lib/api";
import Brand from "../components/ui/Brand";

export default function RegistrationPage() {
  const [form, setForm] = useState({
    displayName: "",
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));

    setError("");
    setSuccess("");
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      await apiRequest("/auth/register", {
        method: "POST",
        body: JSON.stringify({
          displayName: form.displayName.trim(),
          email: form.email.trim(),
          password: form.password,
        }),
      });

      setSuccess(
        "Your account has been created. You can sign in now."
      );

      setForm({
        displayName: "",
        email: "",
        password: "",
      });
    } catch (err) {
      setError(
        err.message || "Unable to create your account. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-[100dvh] bg-canvas px-4 py-8 text-ink sm:px-8 sm:py-14">
      <div className="mx-auto grid min-h-[75dvh] max-w-5xl items-center gap-12 md:grid-cols-2">
        <section className="hidden md:block">
          <Brand />

          <h1 className="mt-12 max-w-md text-[32px] font-semibold leading-tight tracking-tight">
            Build a clearer picture of your study journey.
          </h1>

          <p className="mt-5 max-w-md leading-7 text-muted">
            Plan your study tasks, track your study time, and review your
            exam performance in one personal workspace.
          </p>
        </section>

        <section className="mx-auto w-full max-w-md">
          <Brand className="mb-8 md:hidden" />

          <h2 className="text-[25px] font-semibold leading-tight tracking-tight sm:text-[32px]">
            Create your account
          </h2>

          <p className="mt-3 text-sm leading-6 text-muted">
            Set up your personal study workspace.
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <div>
              <label htmlFor="displayName" className="field-label">
                Your name
              </label>

              <input
                id="displayName"
                name="displayName"
                type="text"
                autoComplete="name"
                required
                maxLength={80}
                value={form.displayName}
                onChange={handleChange}
                placeholder="Enter your name"
                className="field"
              />
            </div>

            <div>
              <label htmlFor="email" className="field-label">
                Email address
              </label>

              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={form.email}
                onChange={handleChange}
                placeholder="you@example.com"
                className="field"
              />
            </div>

            <div>
              <label htmlFor="password" className="field-label">
                Password
              </label>

              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Create a password"
                  aria-describedby="password-hint"
                  className="field pr-12"
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowPassword((current) => !current)
                  }
                  aria-label={
                    showPassword ? "Hide password" : "Show password"
                  }
                  aria-pressed={showPassword}
                  className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-control text-muted hover:text-ink"
                >
                  {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
                </button>
              </div>

              <p id="password-hint" className="field-hint">
                If the password needs to be stronger, we will tell you
                what to change.
              </p>
            </div>

            {error && (
              <div
                role="alert"
                className="rounded-control border border-danger/30 bg-danger-subtle px-4 py-3 text-sm text-danger"
              >
                {error}
              </div>
            )}

            {success && (
              <div
                role="status"
                className="rounded-control border border-primary/25 bg-primary-subtle px-4 py-3 text-sm leading-6 text-primary"
              >
                <p>{success}</p>

                <Link
                  to="/login"
                  className="mt-2 inline-flex min-h-11 items-center gap-1 font-semibold underline underline-offset-4"
                >
                  Go to sign in
                  <ArrowRight size={16} />
                </Link>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full"
            >
              {loading ? (
                <>
                  <LoaderCircle size={18} className="animate-spin" />
                  Creating account...
                </>
              ) : (
                <>
                  Create account
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-muted">
            Already have an account?{" "}
            <Link
              to="/login"
              className="inline-flex min-h-11 items-center px-1 font-medium text-primary underline-offset-4 hover:underline"
            >
              Sign in
            </Link>
          </p>

          <p className="mt-6 text-center text-xs text-muted">
            Your account is personal to you. Keep your password private.
          </p>
        </section>
      </div>
    </main>
  );
}
