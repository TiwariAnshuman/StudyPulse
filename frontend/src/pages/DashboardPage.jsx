
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Activity,
  ArrowRight,
  BookOpen,
  Check,
  Circle,
  Clock3,
  LoaderCircle,
  Pause,
  Play,
  Plus,
  RefreshCw,
  Target,
  Timer,
  TrendingUp,
} from "lucide-react";

import { useAuth } from "../app/useAuth";
import { PageContainer } from "../components/ui/Page";
import { getDashboard } from "../features/dashboard/dashboard.api";
import {
  pauseStudyTimer,
  resumeStudyTimer,
} from "../features/timer/timer.api";

// --------------------------------------------------
// HELPERS
// --------------------------------------------------

function formatDuration(totalSeconds = 0) {
  const seconds = Math.max(0, Math.floor(Number(totalSeconds) || 0));

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }

  return `${minutes}m`;
}

// Short label for chart bars: 45m, 1.5h
function formatCompactMinutes(minutes = 0) {
  if (minutes < 60) return `${Math.round(minutes)}m`;

  return `${Number((minutes / 60).toFixed(1))}h`;
}

function formatTimerDuration(totalSeconds = 0) {
  const seconds = Math.max(0, Math.floor(Number(totalSeconds) || 0));

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;

  return [hours, minutes, remainingSeconds]
    .map((value) => String(value).padStart(2, "0"))
    .join(":");
}

function formatDate(dateString, timezone = "Asia/Kolkata") {
  if (!dateString) return "";

  const date = new Date(`${dateString}T12:00:00Z`);

  if (Number.isNaN(date.getTime())) return dateString;

  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: timezone,
  }).format(date);
}

function formatShortDate(dateString, timezone = "Asia/Kolkata") {
  if (!dateString) return "";

  const date = new Date(`${dateString}T12:00:00Z`);

  if (Number.isNaN(date.getTime())) return dateString;

  return new Intl.DateTimeFormat("en-IN", {
    weekday: "short",
    timeZone: timezone,
  }).format(date);
}

function formatSessionTime(dateString, timezone = "Asia/Kolkata") {
  if (!dateString) return "";

  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat("en-IN", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: timezone,
  }).format(date);
}

function getGreeting(timezone = "Asia/Kolkata") {
  const hour = Number(
    new Intl.DateTimeFormat("en-IN", {
      hour: "2-digit",
      hourCycle: "h23",
      timeZone: timezone,
    }).format(new Date())
  );

  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";

  return "Good evening";
}

function getStatusStyle(status) {
  switch (status) {
    case "Completed":
      return "bg-primary-subtle text-primary";

    case "In progress":
      return "bg-attention-subtle text-attention-ink";

    default:
      return "bg-tint text-muted";
  }
}

// --------------------------------------------------
// SMALL REUSABLE COMPONENTS
// --------------------------------------------------

function SectionHeading({ title, description, action }) {
  return (
    <div className="mb-5 flex items-center justify-between gap-3">
      <div>
        <h2 className="text-base font-semibold text-ink">
          {title}
        </h2>

        {description && (
          <p className="mt-1 text-sm text-muted">
            {description}
          </p>
        )}
      </div>

      {action}
    </div>
  );
}

function EmptyState({ icon: Icon = Activity, title, description }) {
  return (
    <div className="flex min-h-40 flex-col items-center justify-center px-5 py-8 text-center">
      <div className="flex h-11 w-11 items-center justify-center rounded-panel bg-canvas text-muted">
        <Icon size={20} />
      </div>

      <h3 className="mt-3 text-sm font-semibold text-ink">
        {title}
      </h3>

      <p className="mt-1 max-w-xs text-xs leading-5 text-muted">
        {description}
      </p>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, detail }) {
  return (
    <div className="rounded-panel border border-line bg-white p-4">
      <div className="flex items-center gap-2 text-muted">
        <Icon size={17} />
        <span className="text-xs font-medium">{label}</span>
      </div>

      <p className="mt-3 text-[25px] font-semibold tracking-tight text-ink">
        {value}
      </p>

      {detail && (
        <p className="mt-1 text-xs text-muted">
          {detail}
        </p>
      )}
    </div>
  );
}

// --------------------------------------------------
// DASHBOARD PAGE
// --------------------------------------------------

export default function DashboardPage() {
  const { user } = useAuth();

  const [dashboard, setDashboard] = useState(null);
  const [timerElapsed, setTimerElapsed] = useState(0);

  const [isLoading, setIsLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [isTimerUpdating, setIsTimerUpdating] = useState(false);

  // -----------------------------------------------
  // FETCH DASHBOARD
  // -----------------------------------------------

  const loadDashboard = useCallback(async ({ showLoader = false } = {}) => {
    if (showLoader) {
      setIsLoading(true);
    }

    setPageError("");

    try {
      const response = await getDashboard();
      const data = response?.data;

      if (!data) {
        throw new Error("Dashboard data is unavailable.");
      }

      setDashboard(data);
      setTimerElapsed(data.timer?.elapsedSeconds ?? 0);
    } catch (error) {
      setPageError(
        error.message || "Unable to load your dashboard."
      );
    } finally {
      if (showLoader) {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    loadDashboard({ showLoader: true });
  }, [loadDashboard]);

  // -----------------------------------------------
  // LIVE TIMER DISPLAY
  // -----------------------------------------------

  useEffect(() => {
    if (dashboard?.timer?.status !== "running") {
      return;
    }

    const intervalId = setInterval(() => {
      setTimerElapsed((current) => current + 1);
    }, 1000);

    return () => clearInterval(intervalId);
  }, [dashboard?.timer?.id, dashboard?.timer?.status]);

  // -----------------------------------------------
  // PAUSE / RESUME TIMER
  // -----------------------------------------------

  async function handleTimerToggle() {
    if (isTimerUpdating || !dashboard?.timer) return;

    setIsTimerUpdating(true);
    setPageError("");

    try {
      if (dashboard.timer.status === "running") {
        await pauseStudyTimer();
      } else if (dashboard.timer.status === "paused") {
        await resumeStudyTimer();
      }

      await loadDashboard();
    } catch (error) {
      setPageError(
        error.message || "Unable to update the active timer."
      );
    } finally {
      setIsTimerUpdating(false);
    }
  }

  // -----------------------------------------------
  // LOADING STATE
  // -----------------------------------------------

  if (isLoading) {
    return (
      <div className="flex min-h-[60dvh] items-center justify-center">
        <div className="flex items-center gap-3 text-sm text-muted">
          <LoaderCircle size={19} className="animate-spin" />
          Loading your dashboard...
        </div>
      </div>
    );
  }

  // -----------------------------------------------
  // ERROR STATE
  // -----------------------------------------------

  if (!dashboard) {
    return (
      <div className="flex min-h-[60dvh] items-center justify-center px-5">
        <div className="max-w-sm text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-panel bg-danger-subtle text-danger">
            <Activity size={22} />
          </div>

          <h1 className="mt-4 text-xl font-semibold text-ink">
            Dashboard couldn't load
          </h1>

          <p className="mt-2 text-sm text-muted">
            {pageError || "Something went wrong. Please try again."}
          </p>

          <button
            type="button"
            onClick={() => loadDashboard({ showLoader: true })}
            className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-control bg-primary px-4 text-sm font-medium text-white hover:bg-primary-hover"
          >
            <RefreshCw size={16} />
            Try again
          </button>
        </div>
      </div>
    );
  }

  // -----------------------------------------------
  // DASHBOARD DATA
  // -----------------------------------------------

  const timezone = dashboard.timezone || "Asia/Kolkata";

  const displayName =
    user?.displayName ??
    user?.name ??
    user?.email?.split("@")[0] ??
    "Student";

  const todayStudy = dashboard.today?.study ?? {};
  const taskSummary = dashboard.today?.tasks?.summary ?? {};
  const todayTasks = dashboard.today?.tasks?.items ?? [];

  const timer = dashboard.timer;

  const weeklyStudy = dashboard.weeklyStudy ?? [];
  const subjectDistribution = dashboard.subjectDistribution ?? [];
  const recentSessions = dashboard.recentSessions ?? [];

  const latestTest = dashboard.latestTest;
  const checklist = dashboard.onboardingChecklist;

  const dailyTarget = todayStudy.dailyTargetMinutes;
  const targetProgress = Math.min(
    100,
    Math.max(0, Number(todayStudy.targetProgress) || 0)
  );

  const hasTarget =
    dailyTarget !== null &&
    dailyTarget !== undefined &&
    Number(dailyTarget) > 0;

  const hasWeeklyData = weeklyStudy.some(
    (day) => Number(day.durationSeconds) > 0
  );

  const hasSubjectData = subjectDistribution.some(
    (subject) => Number(subject.durationSeconds) > 0
  );

  const weeklyMaximum = Math.max(
    ...weeklyStudy.map((day) => Number(day.durationMinutes) || 0),
    1
  );

  const subjectTotalSeconds = subjectDistribution.reduce(
    (total, subject) =>
      total + (Number(subject.durationSeconds) || 0),
    0
  );

  const timerIsRunning = timer?.status === "running";
  const timerIsPaused = timer?.status === "paused";

  // -----------------------------------------------
  // MAIN UI
  // -----------------------------------------------

  return (
    <PageContainer>
      <div>

        {/* PAGE HEADER */}

        <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium text-primary">
              {formatDate(dashboard.date, timezone)}
            </p>

            <h1 className="mt-1 text-[25px] font-semibold leading-tight tracking-tight sm:text-[32px]">
              {getGreeting(timezone)}, {displayName}
            </h1>

            <p className="mt-2 text-sm text-muted">
              Here's what's happening with your study today.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              to="/tasks"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-control border border-line bg-white px-4 text-sm font-medium text-ink transition hover:bg-tint"
            >
              <Plus size={17} />
              Add task
            </Link>

            <Link
              to="/timer"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-control bg-primary px-4 text-sm font-medium text-white transition hover:bg-primary-hover"
            >
              <Play size={16} />
              Start studying
            </Link>
          </div>
        </header>

        {/* PAGE ERROR NOTICE */}

        {pageError && (
          <div
            role="alert"
            className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-control border border-danger/30 bg-danger-subtle px-4 py-3 text-sm text-danger"
          >
            <span>{pageError}</span>

            <button
              type="button"
              onClick={() => loadDashboard()}
              className="inline-flex items-center gap-2 font-medium underline"
            >
              <RefreshCw size={14} />
              Retry
            </button>
          </div>
        )}

        {/* ONBOARDING CHECKLIST */}

        {checklist && !checklist.isComplete && (
          <section className="mt-8 rounded-panel border border-line bg-white p-5 sm:p-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs font-semibold text-primary">
                  Getting started
                </p>

                <h2 className="mt-2 text-xl font-semibold">
                  Start with one small plan.
                </h2>

                <p className="mt-1 max-w-xl text-sm leading-6 text-muted">
                  Create a task, record a study session, or add a test
                  when you're ready. Your dashboard will fill with
                  your own records.
                </p>
              </div>

              <span className="text-sm text-muted">
                {checklist.completedCount}/{checklist.totalSteps} completed
              </span>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {[
                {
                  label: "Create a subject",
                  done: checklist.hasSubject,
                  to: "/subjects",
                },
                {
                  label: "Create your first task",
                  done: checklist.hasTask,
                  to: "/tasks",
                },
                {
                  label: "Record a study session",
                  done: checklist.hasStudySession,
                  to: "/timer",
                },
                {
                  label: "Add your first test",
                  done: checklist.hasTest,
                  to: "/tests",
                },
              ].map((item) => (
                <Link
                  key={item.label}
                  to={item.to}
                  className="flex min-h-12 items-center gap-3 rounded-control border border-line px-3 py-3 transition hover:bg-canvas"
                >
                  {item.done ? (
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary-subtle text-primary">
                      <Check size={14} />
                    </span>
                  ) : (
                    <Circle size={21} className="shrink-0 text-muted" />
                  )}

                  <span className="text-sm font-medium text-ink">
                    {item.label}
                  </span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* TOP SUMMARY */}

        <section className="mt-8 grid gap-4 sm:grid-cols-2">
          <div className="rounded-panel border border-line bg-white p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-medium text-muted">
                <Clock3 size={17} />
                Study time today
              </div>

              <span className="rounded-control bg-primary-subtle px-2 py-1 text-xs font-medium text-primary">
                Recorded
              </span>
            </div>

            <p className="mt-5 text-[25px] font-semibold tracking-tight">
              {formatDuration(todayStudy.durationSeconds)}
            </p>

            {hasTarget ? (
              <div className="mt-4">
                <div className="mb-2 flex justify-between text-xs text-muted">
                  <span>
                    Target: {formatDuration(dailyTarget * 60)}
                  </span>

                  <span>{targetProgress}%</span>
                </div>

                <div
                  className="h-2 overflow-hidden rounded-full bg-tint"
                  role="progressbar"
                  aria-label="Daily study target progress"
                  aria-valuenow={targetProgress}
                  aria-valuemin={0}
                  aria-valuemax={100}
                >
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{ width: `${targetProgress}%` }}
                  />
                </div>
              </div>
            ) : (
              <p className="mt-3 text-xs text-muted">
                No daily target configured.
              </p>
            )}
          </div>

          <StatCard
            icon={Target}
            label="Tasks today"
            value={taskSummary.total ?? 0}
            detail={`${taskSummary.completed ?? 0} completed · ${taskSummary.inProgress ?? 0} in progress · ${taskSummary.pending ?? 0} to do`}
          />
        </section>

        {/* ACTIVE TIMER */}

        <section className="mt-5">
          {timer ? (
            <div className="rounded-panel border border-attention/40 bg-attention-subtle p-5 sm:p-6">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      aria-hidden="true"
                      className={`h-2 w-2 rounded-full ${
                        timerIsRunning
                          ? "motion-safe:animate-pulse bg-attention"
                          : "bg-attention-ink"
                      }`}
                    />

                    <span role="status" className="text-sm font-semibold text-attention-ink">
                      {timerIsRunning ? "Timer running" : "Timer paused"}
                    </span>
                  </div>

                  <h2 className="mt-3 text-xl font-semibold text-ink">
                    {timer.subjectName || "Study session"}
                  </h2>

                  <p className="mt-1 text-sm text-muted">
                    {timer.taskTitle
                      ? `Task: ${timer.taskTitle}`
                      : timer.activityType || "Study session"}
                  </p>
                </div>

                <div className="flex flex-col gap-3 sm:items-end">
                  <p className="font-mono text-[25px] font-semibold tracking-tight text-ink">
                    {formatTimerDuration(timerElapsed)}
                  </p>

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={handleTimerToggle}
                      disabled={isTimerUpdating}
                      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-control bg-ink px-4 text-sm font-medium text-white transition hover:bg-ink/90 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isTimerUpdating ? (
                        <LoaderCircle size={16} className="animate-spin" />
                      ) : timerIsRunning ? (
                        <Pause size={16} />
                      ) : (
                        <Play size={16} />
                      )}

                      {timerIsRunning ? "Pause" : "Resume"}
                    </button>

                    <Link
                      to="/timer"
                      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-control border border-attention/50 bg-white/70 px-4 text-sm font-medium text-ink transition hover:bg-white"
                    >
                      Finish session
                      <ArrowRight size={15} />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-3 rounded-panel border border-dashed border-line bg-white p-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-control bg-canvas text-primary">
                  <Timer size={20} />
                </div>

                <div>
                  <h2 className="text-sm font-semibold">
                    No active study timer
                  </h2>

                  <p className="mt-1 text-xs text-muted">
                    Start a session when you're ready to study.
                  </p>
                </div>
              </div>

              <Link
                to="/timer"
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-control bg-primary px-4 text-sm font-medium text-white hover:bg-primary-hover"
              >
                <Play size={15} />
                Start timer
              </Link>
            </div>
          )}
        </section>

        {/* TASKS AND WEEKLY TREND */}

        <section className="mt-8 grid gap-5 xl:grid-cols-12">

          {/* TODAY'S TASKS */}

          <div className="rounded-panel border border-line min-w-0 bg-white p-5 xl:col-span-7">
            <SectionHeading
              title="Today's tasks"
              description="Your planned work for today."
              action={
                <Link
                  to="/tasks"
                  className="inline-flex min-h-11 shrink-0 items-center gap-1 whitespace-nowrap text-sm font-semibold text-primary hover:underline"
                >
                  View all
                  <ArrowRight size={14} />
                </Link>
              }
            />

            {todayTasks.length === 0 ? (
              <EmptyState
                icon={BookOpen}
                title="No tasks planned for today"
                description="Add a task to give your study day a clear direction."
              />
            ) : (
              <div className="divide-y divide-tint">
                {todayTasks.slice(0, 5).map((task) => (
                  <div
                    key={task._id ?? task.id}
                    className="flex items-center justify-between gap-3 py-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-ink">
                        {task.title}
                      </p>

                      <p className="mt-1 text-xs text-muted">
                        {task.subjectId?.name || "No subject"}
                      </p>
                    </div>

                    <span
                      className={`shrink-0 rounded-control px-2 py-1 text-xs font-medium ${getStatusStyle(task.status)}`}
                    >
                      {task.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* WEEKLY STUDY TREND */}

          <div className="rounded-panel border border-line min-w-0 bg-white p-5 xl:col-span-5">
            <SectionHeading
              title="Weekly study"
              description="Recorded time over the last 7 days."
            />

            {hasWeeklyData ? (
              <>
                <div aria-hidden="true" className="flex h-48 items-end justify-between gap-1.5 border-b border-line px-1 pb-2 pt-5 sm:gap-2">
                  {weeklyStudy.map((day) => {
                    const minutes = Number(day.durationMinutes) || 0;
                    const barHeight = Math.max(
                      minutes > 0 ? 5 : 0,
                      (minutes / weeklyMaximum) * 100
                    );

                    return (
                      <div
                        key={day.date}
                        className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-2"
                      >
                        <span className="text-xs text-muted">
                          {minutes > 0 ? formatCompactMinutes(minutes) : ""}
                        </span>

                        <div className="flex h-full w-full items-end justify-center">
                          <div
                            className={`w-full max-w-8 rounded-t-control ${
                              minutes > 0 ? "bg-primary" : "bg-tint"
                            }`}
                            style={{ height: `${barHeight}%` }}
                          />
                        </div>

                        <span className="text-xs text-muted">
                          {formatShortDate(day.date, timezone)}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Text alternative for the bar chart above */}
                <table className="sr-only">
                  <caption>Recorded study time for the last 7 days</caption>
                  <thead>
                    <tr>
                      <th scope="col">Day</th>
                      <th scope="col">Study time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {weeklyStudy.map((day) => (
                      <tr key={day.date}>
                        <td>{formatDate(day.date, timezone)}</td>
                        <td>{formatDuration(day.durationSeconds)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <p className="mt-4 text-xs leading-5 text-muted">
                  Total recorded this week:{" "}
                  <strong className="font-semibold text-ink">
                    {formatDuration(
                      weeklyStudy.reduce(
                        (total, day) =>
                          total + (Number(day.durationSeconds) || 0),
                        0
                      )
                    )}
                  </strong>
                </p>
              </>
            ) : (
              <EmptyState
                icon={TrendingUp}
                title="No study sessions this week"
                description="Your weekly trend will appear after you record a study session."
              />
            )}
          </div>
        </section>

        {/* SUBJECT DISTRIBUTION AND LATEST TEST */}

        <section className="mt-5 grid gap-5 xl:grid-cols-12">

          {/* SUBJECT DISTRIBUTION */}

          <div className="rounded-panel border border-line min-w-0 bg-white p-5 xl:col-span-7">
            <SectionHeading
              title="Subject allocation"
              description="How your recorded study time is distributed."
              action={
                <Link
                  to="/analytics"
                  className="inline-flex min-h-11 shrink-0 items-center gap-1 whitespace-nowrap text-sm font-semibold text-primary hover:underline"
                >
                  Analytics
                  <ArrowRight size={14} />
                </Link>
              }
            />

            {hasSubjectData ? (
              <div className="space-y-5">
                {subjectDistribution.map((subject) => {
                  const percentage =
                    subjectTotalSeconds > 0
                      ? (Number(subject.durationSeconds) /
                          subjectTotalSeconds) *
                        100
                      : 0;

                  return (
                    <div key={subject.subject}>
                      <div className="mb-2 flex items-center justify-between gap-3">
                        <span className="truncate text-sm font-medium text-ink">
                          {subject.subject || "Unassigned"}
                        </span>

                        <span className="shrink-0 text-xs text-muted">
                          {formatDuration(subject.durationSeconds)} ·{" "}
                          {Math.round(percentage)}%
                        </span>
                      </div>

                      <div className="h-2 overflow-hidden rounded-full bg-tint">
                        <div
                          className="h-full rounded-full bg-primary"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <EmptyState
                icon={BookOpen}
                title="No subject data yet"
                description="Subject allocation will appear when you save study sessions."
              />
            )}
          </div>

          {/* LATEST TEST */}

          <div className="rounded-panel border border-line min-w-0 bg-white p-5 xl:col-span-5">
            <SectionHeading
              title="Latest mock test"
              description="Your most recently recorded result."
              action={
                <Link
                  to="/tests"
                  className="inline-flex min-h-11 shrink-0 items-center gap-1 whitespace-nowrap text-sm font-semibold text-primary hover:underline"
                >
                  View tests
                  <ArrowRight size={14} />
                </Link>
              }
            />

            {latestTest ? (
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xl font-semibold text-ink">
                      {latestTest.name}
                    </p>

                    <p className="mt-1 text-xs text-muted">
                      {latestTest.examType} ·{" "}
                      {formatDate(latestTest.testDate, timezone)}
                    </p>
                  </div>

                </div>

                <div className="mt-6 flex items-end justify-between gap-3">
                  <div>
                    <p className="text-[25px] font-semibold tracking-tight">
                      {Number(latestTest.percentage).toFixed(1)}%
                    </p>

                    <p className="mt-1 text-xs text-muted">
                      {latestTest.marksObtained} / {latestTest.maxMarks} marks
                    </p>
                  </div>

                  <Link
                    to={`/tests/${latestTest.id}`}
                    className="inline-flex min-h-11 items-center gap-2 rounded-control border border-line px-3 text-xs font-medium text-ink hover:bg-canvas"
                  >
                    View result
                    <ArrowRight size={14} />
                  </Link>
                </div>
              </div>
            ) : (
              <EmptyState
                icon={Target}
                title="No test recorded yet"
                description="Add your first mock test to start tracking exam performance."
              />
            )}
          </div>
        </section>

        {/* RECENT SESSIONS */}

        <section className="mt-5 rounded-panel border border-line bg-white p-5">
          <SectionHeading
            title="Recent study sessions"
            description="Your last recorded study activities."
            action={
              <Link
                to="/sessions"
                className="inline-flex min-h-11 shrink-0 items-center gap-1 whitespace-nowrap text-sm font-semibold text-primary hover:underline"
              >
                View history
                <ArrowRight size={14} />
              </Link>
            }
          />

          {recentSessions.length === 0 ? (
            <EmptyState
              icon={Clock3}
              title="No recorded sessions"
              description="Your saved study sessions will appear here."
            />
          ) : (
            <>
              {/* Phones: stacked rows so Duration is always visible */}
              <ul className="divide-y divide-tint sm:hidden">
                {recentSessions.map((session) => (
                  <li
                    key={session._id ?? session.id}
                    className="flex items-start justify-between gap-3 py-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-ink">
                        {session.subjectNameSnapshot || "Unassigned"}
                      </p>

                      <p className="mt-0.5 text-xs text-muted">
                        {session.activityType} ·{" "}
                        {formatDate(session.sessionDate, timezone)}
                      </p>

                      {session.taskTitleSnapshot && (
                        <p className="mt-0.5 truncate text-xs text-muted">
                          {session.taskTitleSnapshot}
                        </p>
                      )}
                    </div>

                    <p className="shrink-0 text-sm font-semibold text-ink">
                      {formatDuration(session.durationSeconds)}
                    </p>
                  </li>
                ))}
              </ul>

              {/* Tablet and desktop: table */}
              <div className="hidden overflow-x-auto sm:block">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-tint text-xs text-muted">
                    <th scope="col" className="py-3 pr-4 font-medium">Subject</th>
                    <th scope="col" className="py-3 pr-4 font-medium">Activity</th>
                    <th scope="col" className="py-3 pr-4 font-medium">Date</th>
                    <th scope="col" className="py-3 text-right font-medium">Duration</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-tint">
                  {recentSessions.map((session) => (
                    <tr key={session._id ?? session.id}>
                      <td className="py-4 pr-4">
                        <p className="text-sm font-medium text-ink">
                          {session.subjectNameSnapshot || "Unassigned"}
                        </p>

                        {session.taskTitleSnapshot && (
                          <p className="mt-1 text-xs text-muted">
                            {session.taskTitleSnapshot}
                          </p>
                        )}
                      </td>

                      <td className="py-4 pr-4 text-sm text-muted">
                        {session.activityType}
                      </td>

                      <td className="py-4 pr-4 text-sm text-muted">
                        <span>
                          {formatDate(session.sessionDate, timezone)}
                        </span>

                        <span className="mt-1 block text-xs">
                          {formatSessionTime(session.startAt, timezone)}
                        </span>
                      </td>

                      <td className="py-4 text-right text-sm font-medium text-ink">
                        {formatDuration(session.durationSeconds)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            </>
          )}
        </section>

        {/* FOOTER */}

        <footer className="mt-8 flex flex-col gap-2 border-t border-line pt-5 text-xs text-muted sm:flex-row sm:items-center sm:justify-between">
          <p>StudyPulse · Plan your study. Track your effort.</p>

          <p>
            Data shown in {timezone}
          </p>
        </footer>
      </div>
    </PageContainer>
  );
}
