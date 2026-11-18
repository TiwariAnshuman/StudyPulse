import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Check, LoaderCircle } from "lucide-react";

import { useAuth } from "../../app/useAuth";
import { PageContainer, PageHeader } from "../../components/ui/Page";
import { updateSettings } from "./settings.api";

const DEFAULT_THRESHOLDS = {
  level1MaxMinutes: 29,
  level2MaxMinutes: 89,
  level3MaxMinutes: 179,
};

function SettingsSection({ title, description, children }) {
  return (
    <section className="card p-4 sm:p-6">
      <h2 className="text-base font-semibold text-ink">{title}</h2>

      <p className="mt-1 text-sm leading-6 text-muted">{description}</p>

      <div className="mt-5">{children}</div>
    </section>
  );
}

function Field({ label, hint, ...props }) {
  const hintId = hint ? `${props.id}-hint` : undefined;

  return (
    <div>
      <label htmlFor={props.id} className="field-label">
        {label}
      </label>

      <input {...props} aria-describedby={hintId} className="field" />

      {hint && (
        <p id={hintId} className="field-hint">
          {hint}
        </p>
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
      <div className="flex min-h-[60dvh] items-center justify-center gap-3 text-sm text-muted">
        <LoaderCircle size={20} className="animate-spin" />
        Loading settings...
      </div>
    );
  }

  return (
    <PageContainer>
      <div className="max-w-3xl">
        <PageHeader
          title="Settings"
          description="Manage your profile and choose how StudyPulse tracks your study activity."
        />

        <form onSubmit={handleSubmit} className="space-y-4">
          <SettingsSection
            title="Profile"
            description="Your personal account information."
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                id="displayName"
                label="Display name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your name"
                maxLength={50}
                autoComplete="name"
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
            title="Study preferences"
            description="Your exam, timezone and optional daily target."
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                id="examPreset"
                label="Exam preset"
                value={examPreset}
                onChange={(e) => setExamPreset(e.target.value)}
                placeholder="e.g. NEET"
                maxLength={80}
                required
                hint="Enter your exam name or a custom exam preset."
              />

              <Field
                id="dailyTarget"
                label="Daily target (minutes)"
                type="number"
                inputMode="numeric"
                min="1"
                step="1"
                value={dailyTargetMinutes}
                onChange={(e) => setDailyTargetMinutes(e.target.value)}
                placeholder="180"
                hint="Optional. Leave empty if you don't want a daily target."
              />

              <div className="sm:col-span-2">
                <Field
                  id="timezone"
                  label="Timezone (IANA name)"
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  placeholder="Asia/Kolkata"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  required
                  hint="Used to decide your study dates. Example: Asia/Kolkata, Asia/Dubai, Europe/London."
                />
              </div>
            </div>

            <Link
              to="/subjects"
              className="mt-4 inline-flex min-h-11 items-center gap-2 text-sm font-medium text-primary underline underline-offset-4"
            >
              Manage subjects
              <ArrowRight size={14} />
            </Link>
          </SettingsSection>

          <SettingsSection
            title="Heatmap levels"
            description="Choose the study-minute limits used for the colours on your consistency calendar."
          >
            <div className="grid gap-4 sm:grid-cols-3">
              <Field
                id="level1"
                label="Level 1: up to (min)"
                type="number"
                inputMode="numeric"
                min="1"
                step="1"
                value={thresholds.level1MaxMinutes}
                onChange={(e) => updateThreshold("level1MaxMinutes", e.target.value)}
                required
              />

              <Field
                id="level2"
                label="Level 2: up to (min)"
                type="number"
                inputMode="numeric"
                min="2"
                step="1"
                value={thresholds.level2MaxMinutes}
                onChange={(e) => updateThreshold("level2MaxMinutes", e.target.value)}
                required
              />

              <Field
                id="level3"
                label="Level 3: up to (min)"
                type="number"
                inputMode="numeric"
                min="3"
                step="1"
                value={thresholds.level3MaxMinutes}
                onChange={(e) => updateThreshold("level3MaxMinutes", e.target.value)}
                required
              />
            </div>

            <div className="mt-4 rounded-control bg-canvas p-4 text-sm text-muted">
              <p className="font-medium text-ink">How your levels work</p>

              <ul className="mt-2 space-y-1">
                <li>Level 1: 1–{thresholds.level1MaxMinutes || "—"} minutes</li>
                <li>
                  Level 2: above Level 1 up to{" "}
                  {thresholds.level2MaxMinutes || "—"} minutes
                </li>
                <li>
                  Level 3: above Level 2 up to{" "}
                  {thresholds.level3MaxMinutes || "—"} minutes
                </li>
                <li>Level 4: above Level 3</li>
              </ul>
            </div>
          </SettingsSection>

          {/* Save bar stays in view, with the result right next to the button */}
          <div className="sticky bottom-[calc(4rem+env(safe-area-inset-bottom))] z-20 -mx-4 border-t border-line bg-canvas px-4 py-3 sm:mx-0 sm:rounded-panel sm:border sm:bg-surface sm:px-4 lg:bottom-4">
            {notice && (
              <p
                role="status"
                className="mb-3 flex items-center gap-2 text-sm font-medium text-primary"
              >
                <Check size={16} />
                {notice}
              </p>
            )}

            {error && (
              <p role="alert" className="mb-3 text-sm font-medium text-danger">
                {error}
              </p>
            )}

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="hidden text-xs text-muted sm:block">
                Changes are saved to your StudyPulse account.
              </p>

              <button
                type="submit"
                disabled={saving}
                className="btn btn-primary w-full sm:w-auto"
              >
                {saving ? (
                  <LoaderCircle size={17} className="animate-spin" />
                ) : (
                  <Check size={17} />
                )}

                {saving ? "Saving changes..." : "Save changes"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </PageContainer>
  );
}
