
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  BookOpen,
  Eye,
  EyeOff,
  LoaderCircle,
} from "lucide-react";

import { apiRequest } from "../lib/api";
import { useAuth } from "../app/AuthContext";
import {
  clearAccessToken,
  setAccessToken,
} from "../features/auth/authSession";

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
    <main className="min-h-screen bg-stone-50 px-4 py-10 text-stone-900 sm:px-6">
      <div className="mx-auto flex min-h-[80vh] w-full max-w-md flex-col justify-center">
        <Link
          to="/"
          className="mb-10 inline-flex w-fit items-center gap-2"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-900 text-white">
            <BookOpen size={20} />
          </span>

          <span className="text-lg font-semibold tracking-tight">
            StudyPulse
          </span>
        </Link>

        <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="mb-8">
            <p className="text-sm font-medium text-emerald-800">
              WELCOME BACK
            </p>

            <h1 className="mt-2 text-3xl font-semibold tracking-tight">
              Sign in to StudyPulse
            </h1>

            <p className="mt-3 text-sm leading-6 text-stone-600">
              Continue planning your study sessions and tracking
              your exam preparation.
            </p>
          </div>

          {error && (
            <div
              role="alert"
              className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-medium text-stone-700"
              >
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
                className="w-full rounded-lg border border-stone-300 bg-white px-3.5 py-3 text-sm outline-none transition placeholder:text-stone-400 focus:border-emerald-800 focus:ring-2 focus:ring-emerald-800/10 disabled:opacity-60"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-sm font-medium text-stone-700"
              >
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
                  className="w-full rounded-lg border border-stone-300 bg-white px-3.5 py-3 pr-12 text-sm outline-none transition placeholder:text-stone-400 focus:border-emerald-800 focus:ring-2 focus:ring-emerald-800/10 disabled:opacity-60"
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
                  className="absolute inset-y-0 right-0 flex items-center px-3 text-stone-500 hover:text-stone-800"
                >
                  {showPassword ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-800 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
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

          <p className="mt-6 text-center text-sm text-stone-600">
            Don't have an account?{" "}
            <Link
              to="/register"
              className="font-medium text-emerald-900 underline-offset-4 hover:underline"
            >
              Create account
            </Link>
          </p>
        </section>

        <p className="mt-6 text-center text-xs leading-5 text-stone-500">
          Your study records are private to your account.
        </p>
      </div>
    </main>
  );
}
