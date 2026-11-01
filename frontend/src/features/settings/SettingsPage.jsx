
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  Check,
  LoaderCircle,
  Settings,
  UserRound,
  Clock3,
  Target,
  Activity,
  BookOpen,
} from "lucide-react";

import { useAuth } from "../../app/useAuth";
import { updateSettings } from "./settings.api";

const DEFAULT_THRESHOLDS = {
  level1MaxMinutes: 29,
  level2MaxMinutes: 89,
  level3MaxMinutes: 179,
};

function SettingsSection({ icon: Icon, title, description, children }) {
  return (
    <section className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-900">
          <Icon size={19} />
        </div>

        <div>
          <h2 className="font-semibold text-stone-900">{title}</h2>
          <p className="mt-1 text-sm leading-6 text-stone-500">
            {description}
          </p>
        </div>
      </div>

      <div className="mt-6">{children}</div>
    </section>
  );
}

function Field({ label, hint, ...props }) {
  return (
    <div>
      <label
        htmlFor={props.id}
        className="mb-2 block text-sm font-medium text-stone-700"
      >
        {label}
      </label>

      <input
        {...props}
        className="w-full rounded-lg border border-stone-300 bg-white px-3.5 py-3 text-sm text-stone-900 outline-none transition placeholder:text-stone-400 focus:border-emerald-800 focus:ring-2 focus:ring-emerald-800/10 disabled:bg-stone-100"
      />

      {hint && (
        <p className="mt-1.5 text-xs text-stone-500">{hint}</p>
      )}
    </div>
  );
}

export default function SettingsPage() {
  const { user, refreshUser } = useAuth();

  const [displayName, setDisplayName] = useState("");
  const [timezone, setTimezone] = useState("Asia/Kolkata");
  const [examPreset, setExamPreset] = useState("");
  const [dailyTargetMinutes, setDailyTargetMinutes] = useState("");

  const [thresholds, setThresholds] = useState(
    DEFAULT_THRESHOLDS
  );

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  // Load the latest profile and settings from the backend.
  useEffect(() => {
    let active = true;

    async function loadSettings() {
      try {
        const currentUser = await refreshUser();

        if (!active) return;

        setDisplayName(currentUser.displayName ?? "");
        setTimezone(currentUser.timezone ?? "Asia/Kolkata");
        setExamPreset(currentUser.examPreset ?? "");

        setDailyTargetMinutes(
          currentUser.dailyTargetMinutes == null
            ? ""
            : String(currentUser.dailyTargetMinutes)
        );

        setThresholds({
          ...DEFAULT_THRESHOLDS,
          ...currentUser.heatmapThresholds,
        });
      } catch (err) {
        if (active) {
          setError(err.message || "Unable to load settings.");
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadSettings();

    return () => {
      active = false;
    };
  }, [refreshUser]);

  function updateThreshold(field, value) {
    setThresholds((current) => ({
      ...current,
      [field]: value === "" ? "" : Number(value),
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (saving) return;

    setError("");
    setNotice("");

    const target =
      dailyTargetMinutes.trim() === ""
        ? null
        : Number(dailyTargetMinutes);

    const nextThresholds = {
      level1MaxMinutes: Number(thresholds.level1MaxMinutes),
      level2MaxMinutes: Number(thresholds.level2MaxMinutes),
      level3MaxMinutes: Number(thresholds.level3MaxMinutes),
    };

    if (
      !displayName.trim() ||
      !timezone.trim() ||
      !examPreset.trim()
    ) {
      setError("Please complete all required fields.");
      return;
    }

    if (
      target !== null &&
      (!Number.isInteger(target) || target <= 0)
    ) {
      setError("Daily target must be a positive whole number.");
      return;
    }

    const values = Object.values(nextThresholds);

    if (
      values.some(
        (value) => !Number.isInteger(value) || value <= 0
      ) ||
      nextThresholds.level1MaxMinutes >=
        nextThresholds.level2MaxMinutes ||
      nextThresholds.level2MaxMinutes >=
        nextThresholds.level3MaxMinutes
    ) {
      setError(
        "Heatmap thresholds must be positive whole numbers in increasing order."
      );
      return;
    }

    setSaving(true);

    try {
      await updateSettings({
        displayName: displayName.trim(),
        timezone: timezone.trim(),
        examPreset: examPreset.trim(),
        dailyTargetMinutes: target,
        heatmapThresholds: nextThresholds,
      });

      await refreshUser();

      setNotice("Your settings have been saved successfully.");
    } catch (err) {
      setError(err.message || "Unable to save your settings.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-stone-50 text-stone-600">
        <LoaderCircle size={20} className="mr-3 animate-spin" />
        Loading settings...
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-stone-50 text-stone-900">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <Link
          to="/dashboard"
          className="mb-8 inline-flex items-center gap-2 text-sm text-stone-600 transition hover:text-stone-950"
        >
          <ArrowLeft size={16} />
          Back to dashboard
        </Link>

        <header className="mb-8">
          <p className="text-sm font-medium tracking-wide text-emerald-800">
            ACCOUNT PREFERENCES
          </p>

          <div className="mt-2 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-100 text-emerald-900">
              <Settings size={22} />
            </div>

            <h1 className="text-3xl font-semibold tracking-tight">
              Settings
            </h1>
          </div>

          <p className="mt-3 max-w-xl text-sm leading-6 text-stone-600">
            Manage your profile and customize how StudyPulse
            tracks your study activity.
          </p>
        </header>

        {notice && (
          <div
            role="status"
            className="mb-6 flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900"
          >
            <Check size={17} />
            {notice}
          </div>
        )}

        {error && (
          <div
            role="alert"
            className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <SettingsSection
            icon={UserRound}
            title="Profile"
            description="Your personal account information."
          >
            <div className="grid gap-5 sm:grid-cols-2">
              <Field
                id="displayName"
                label="Display name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your name"
                maxLength={50}
                required
              />

              <Field
                id="email"
                label="Email address"
                value={user?.email ?? ""}
                disabled
                readOnly
                hint="Email address cannot be changed here."
              />
            </div>
          </SettingsSection>

          <SettingsSection
            icon={BookOpen}
            title="Exam preferences"
            description="Keep your preparation profile up to date."
          >
            <Field
              id="examPreset"
              label="Exam preset"
              value={examPreset}
              onChange={(e) => setExamPreset(e.target.value)}
              placeholder="e.g. NEET"
              maxLength={80}
              required
              hint="Enter your exam name or custom exam preset."
            />

            <div className="mt-4">
              <Link
                to="/subjects"
                className="inline-flex items-center gap-2 text-sm font-medium text-emerald-900 underline underline-offset-4 hover:text-emerald-700"
              >
                Manage subjects
                <ArrowLeft className="rotate-180" size={14} />
              </Link>

              <p className="mt-1 text-xs text-stone-500">
                Subjects can be added, edited and archived separately.
              </p>
            </div>
          </SettingsSection>

          <SettingsSection
            icon={Clock3}
            title="Timezone"
            description="Used to determine your study dates and daily activity."
          >
            <Field
              id="timezone"
              label="IANA timezone"
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              placeholder="Asia/Kolkata"
              required
              hint="Example: Asia/Kolkata, Asia/Dubai, Europe/London."
            />
          </SettingsSection>

          <SettingsSection
            icon={Target}
            title="Daily study target"
            description="An optional target used for goal-related analytics."
          >
            <Field
              id="dailyTarget"
              label="Daily target (minutes)"
              type="number"
              min="1"
              step="1"
              value={dailyTargetMinutes}
              onChange={(e) =>
                setDailyTargetMinutes(e.target.value)
              }
              placeholder="180"
              hint="Leave empty if you don't want a daily target."
            />
          </SettingsSection>

          <SettingsSection
            icon={Activity}
            title="Heatmap thresholds"
            description="Customize the study-minute boundaries used for your activity heatmap."
          >
            <div className="grid gap-4 sm:grid-cols-3">
              <Field
                id="level1"
                label="Level 1 · Upper limit"
                type="number"
                min="1"
                step="1"
                value={thresholds.level1MaxMinutes}
                onChange={(e) =>
                  updateThreshold(
                    "level1MaxMinutes",
                    e.target.value
                  )
                }
                required
              />

              <Field
                id="level2"
                label="Level 2 · Upper limit"
                type="number"
                min="2"
                step="1"
                value={thresholds.level2MaxMinutes}
                onChange={(e) =>
                  updateThreshold(
                    "level2MaxMinutes",
                    e.target.value
                  )
                }
                required
              />

              <Field
                id="level3"
                label="Level 3 · Upper limit"
                type="number"
                min="3"
                step="1"
                value={thresholds.level3MaxMinutes}
                onChange={(e) =>
                  updateThreshold(
                    "level3MaxMinutes",
                    e.target.value
                  )
                }
                required
              />
            </div>

            <div className="mt-4 rounded-lg bg-stone-50 p-4 text-sm text-stone-600">
              <p className="font-medium text-stone-800">
                How your levels work
              </p>

              <ul className="mt-2 space-y-1">
                <li>
                  Level 1: 1–{thresholds.level1MaxMinutes || "—"} minutes
                </li>
                <li>
                  Level 2: Above Level 1 up to{" "}
                  {thresholds.level2MaxMinutes || "—"} minutes
                </li>
                <li>
                  Level 3: Above Level 2 up to{" "}
                  {thresholds.level3MaxMinutes || "—"} minutes
                </li>
                <li>
                  Level 4: Above Level 3 minutes
                </li>
              </ul>
            </div>
          </SettingsSection>

          <div className="flex flex-col-reverse justify-between gap-3 border-t border-stone-200 pt-5 sm:flex-row sm:items-center">
            <p className="text-xs text-stone-500">
              Changes are saved to your StudyPulse account.
            </p>

            <button
              type="submit"
              disabled={saving}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-emerald-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-800 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? (
                <LoaderCircle size={17} className="animate-spin" />
              ) : (
                <Check size={17} />
              )}

              {saving ? "Saving changes..." : "Save changes"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
