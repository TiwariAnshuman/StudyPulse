
import { useState } from "react";

import { ArrowRight, BookOpen, LoaderCircle } from "lucide-react";
import { apiRequest } from "../lib/api";

export default function RegistrationPage() {
  const [form, setForm] = useState({
    displayName: "",
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

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
        "Your account has been created successfully. You can sign in once the login page is available."
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
    <main className="min-h-screen bg-stone-50 px-5 py-10 text-stone-900 sm:px-8 sm:py-16">
      <div className="mx-auto grid min-h-[75vh] max-w-5xl items-center gap-12 md:grid-cols-2">
        <section className="hidden md:block">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-900 text-white">
              <BookOpen size={22} />
            </div>

            <span className="text-lg font-semibold tracking-tight">
              StudyPulse
            </span>
          </div>

          <p className="mt-12 text-sm font-medium uppercase tracking-[0.2em] text-emerald-800">
            Make your effort visible
          </p>

          <h1 className="mt-4 max-w-md text-4xl font-semibold leading-tight tracking-tight">
            Build a clearer picture of your study journey.
          </h1>

          <p className="mt-5 max-w-md leading-7 text-stone-600">
            Plan your study tasks, track your study time, and review your
            exam performance in one personal workspace.
          </p>
        </section>

        <section className="mx-auto w-full max-w-md">
          <div className="mb-8 md:hidden">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-900 text-white">
                <BookOpen size={20} />
              </div>
              <span className="text-lg font-semibold">StudyPulse</span>
            </div>
          </div>

          <p className="text-sm font-medium text-emerald-800">
            GET STARTED
          </p>

          <h2 className="mt-2 text-3xl font-semibold tracking-tight">
            Create your account
          </h2>

          <p className="mt-3 text-sm leading-6 text-stone-600">
            Set up your personal study workspace.
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <div>
              <label
                htmlFor="displayName"
                className="mb-2 block text-sm font-medium"
              >
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
                className="w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-sm outline-none transition placeholder:text-stone-400 focus:border-emerald-800 focus:ring-2 focus:ring-emerald-800/10"
              />
            </div>

            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-medium"
              >
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
                className="w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-sm outline-none transition placeholder:text-stone-400 focus:border-emerald-800 focus:ring-2 focus:ring-emerald-800/10"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-sm font-medium"
              >
                Password
              </label>

              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                value={form.password}
                onChange={handleChange}
                placeholder="Create a password"
                className="w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-sm outline-none transition placeholder:text-stone-400 focus:border-emerald-800 focus:ring-2 focus:ring-emerald-800/10"
              />

              <p className="mt-2 text-xs leading-5 text-stone-500">
                Choose a password that meets the backend's password
                requirements.
              </p>
            </div>

            {error && (
              <div
                role="alert"
                className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
              >
                {error}
              </div>
            )}

            {success && (
              <div
                role="status"
                className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm leading-6 text-emerald-900"
              >
                {success}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-900 px-4 py-3.5 text-sm font-medium text-white transition hover:bg-emerald-950 disabled:cursor-not-allowed disabled:opacity-60"
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

          <p className="mt-6 text-center text-sm text-stone-600">
            Already have an account?{" "}
            <span className="font-medium text-emerald-900">
              Login page coming next
            </span>
          </p>

          <p className="mt-8 text-center text-xs text-stone-500">
            Your account is personal to you. Keep your password private.
          </p>
        </section>
      </div>
    </main>
  );
}
