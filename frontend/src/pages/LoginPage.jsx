import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Eye, EyeOff, LoaderCircle } from "lucide-react";

import { apiRequest } from "../lib/api";
import { useAuth } from "../app/useAuth";
import {
  clearAccessToken,
  setAccessToken,
} from "../features/auth/authSession";
import Brand from "../components/ui/Brand";

export default function LoginPage() {
  const navigate = useNavigate();
  const { refreshUser } = useAuth();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));

    if (error) setError("");
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (loading) return;

    setLoading(true);
    setError("");

    try {
      const result = await apiRequest("/auth/login", {
        method: "POST",
        body: JSON.stringify({
          email: form.email.trim(),
          password: form.password,
        }),
      });

      const accessToken = result?.data?.accessToken;

      if (!accessToken) {
        throw new Error(
          "Login response did not include an access token."
        );
      }

      setAccessToken(accessToken);

      // Load the authenticated user's profile.
      await refreshUser();

      setForm({
        email: "",
        password: "",
      });

      navigate("/dashboard", { replace: true });
    } catch (err) {
      clearAccessToken();

      setError(
        err.message || "Unable to sign in. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-[100dvh] bg-canvas px-4 py-8 text-ink sm:px-6">
      <div className="mx-auto flex min-h-[80dvh] w-full max-w-md flex-col justify-center">
        <Link to="/" className="mb-6 inline-flex min-h-11 w-fit items-center rounded-control">
          <Brand />
        </Link>

        <section className="card p-6 sm:p-8">
          <h1 className="text-[25px] font-semibold leading-tight tracking-tight sm:text-[32px]">
            Sign in to StudyPulse
          </h1>

          <p className="mt-3 text-sm leading-6 text-muted">
            Continue planning your study sessions and tracking your exam
            preparation.
          </p>

          {error && (
            <div
              id="login-error"
              role="alert"
              className="mt-6 rounded-control border border-danger/30 bg-danger-subtle px-4 py-3 text-sm text-danger"
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-5">
            <div>
              <label htmlFor="email" className="field-label">
                Email address
              </label>

              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={handleChange}
                required
                disabled={loading}
                aria-describedby={error ? "login-error" : undefined}
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
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  value={form.password}
                  onChange={handleChange}
                  required
                  disabled={loading}
                  aria-describedby={error ? "login-error" : undefined}
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
                  {showPassword ? (
                    <EyeOff size={19} />
                  ) : (
                    <Eye size={19} />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full"
            >
              {loading ? (
                <>
                  <LoaderCircle
                    size={18}
                    className="animate-spin"
                  />
                  Signing in...
                </>
              ) : (
                <>
                  Sign in
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-muted">
            Don't have an account?{" "}
            <Link
              to="/register"
              className="inline-flex min-h-11 items-center px-1 font-medium text-primary underline-offset-4 hover:underline"
            >
              Create account
            </Link>
          </p>
        </section>

        <p className="mt-6 text-center text-xs leading-5 text-muted">
          Your study records are private to your account.
        </p>
      </div>
    </main>
  );
}
