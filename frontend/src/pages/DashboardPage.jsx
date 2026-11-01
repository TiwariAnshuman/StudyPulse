
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Activity,
  ArrowRight,
  BookOpen,
  CalendarDays,
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
      return "bg-[#E6EEE8] text-[#426B57]";

    case "In progress":
      return "bg-blue-50 text-blue-700";

    default:
      return "bg-stone-100 text-stone-600";
  }
}

// --------------------------------------------------
// SMALL REUSABLE COMPONENTS
// --------------------------------------------------

function SectionHeading({ title, description, action }) {
  return (
    <div className="mb-5 flex items-center justify-between gap-3">
      <div>
        <h2 className="text-base font-semibold text-[#202522]">
          {title}
        </h2>

        {description && (
          <p className="mt-1 text-sm text-[#66716B]">
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
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#F7F7F3] text-[#66716B]">
        <Icon size={20} />
      </div>

      <h3 className="mt-3 text-sm font-semibold text-[#202522]">
        {title}
      </h3>

      <p className="mt-1 max-w-xs text-xs leading-5 text-[#66716B]">
        {description}
      </p>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, detail }) {
  return (
    <div className="rounded-xl border border-[#DDE2DC] bg-white p-4">
      <div className="flex items-center gap-2 text-[#66716B]">
        <Icon size={17} />
        <span className="text-xs font-medium">{label}</span>
      </div>

      <p className="mt-3 text-2xl font-semibold tracking-tight text-[#202522]">
        {value}
      </p>

      {detail && (
        <p className="mt-1 text-xs text-[#66716B]">
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
      <div className="flex min-h-screen items-center justify-center bg-[#F7F7F3]">
        <div className="flex items-center gap-3 text-sm text-[#66716B]">
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
      <div className="flex min-h-screen items-center justify-center bg-[#F7F7F3] px-5">
        <div className="max-w-sm text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-red-50 text-red-700">
            <Activity size={22} />
          </div>

          <h1 className="mt-4 text-lg font-semibold text-[#202522]">
            Dashboard couldn't load
          </h1>

          <p className="mt-2 text-sm text-[#66716B]">
            {pageError || "Something went wrong. Please try again."}
          </p>

          <button
            type="button"
            onClick={() => loadDashboard({ showLoader: true })}
            className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-lg bg-[#426B57] px-4 text-sm font-medium text-white hover:bg-[#355743]"
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
    <div className="min-h-screen bg-[#F7F7F3] text-[#202522]">
      <div className="mx-auto max-w-[1440px] px-4 py-7 sm:px-6 lg:px-8 lg:py-9">

        {/* PAGE HEADER */}

        <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium text-[#426B57]">
              {formatDate(dashboard.date, timezone)}
            </p>

            <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-[32px]">
              {getGreeting(timezone)}, {displayName}
            </h1>

            <p className="mt-2 text-sm text-[#66716B]">
              Here's what's happening with your study today.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              to="/tasks"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-[#DDE2DC] bg-white px-4 text-sm font-medium text-[#202522] transition hover:bg-[#F1F2ED]"
            >
              <Plus size={17} />
              Add task
            </Link>

            <Link
              to="/timer"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[#426B57] px-4 text-sm font-medium text-white transition hover:bg-[#355743]"
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
            className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
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
          <section className="mt-8 rounded-xl border border-[#DDE2DC] bg-white p-5 sm:p-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-[#426B57]">
                  Getting started
                </p>

                <h2 className="mt-2 text-lg font-semibold">
                  Start with one small plan.
                </h2>

                <p className="mt-1 max-w-xl text-sm leading-6 text-[#66716B]">
                  Create a task, record a study session, or add a test
                  when you're ready. Your dashboard will fill with
                  your own records.
                </p>
              </div>

              <span className="text-sm text-[#66716B]">
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
                  className="flex min-h-12 items-center gap-3 rounded-lg border border-[#DDE2DC] px-3 py-3 transition hover:bg-[#F7F7F3]"
                >
                  {item.done ? (
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#E6EEE8] text-[#426B57]">
                      <Check size={14} />
                    </span>
                  ) : (
                    <Circle size={21} className="shrink-0 text-[#A1AAA3]" />
                  )}

                  <span className="text-sm font-medium text-[#202522]">
                    {item.label}
                  </span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* TOP SUMMARY */}

        <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <div className="rounded-xl border border-[#DDE2DC] bg-white p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-medium text-[#66716B]">
                <Clock3 size={17} />
                Study time today
              </div>

              <span className="rounded-md bg-[#E6EEE8] px-2 py-1 text-xs font-medium text-[#426B57]">
                Recorded
              </span>
            </div>

            <p className="mt-5 text-3xl font-semibold tracking-tight">
              {formatDuration(todayStudy.durationSeconds)}
            </p>

            {hasTarget ? (
              <div className="mt-4">
                <div className="mb-2 flex justify-between text-xs text-[#66716B]">
                  <span>
                    Target: {formatDuration(dailyTarget * 60)}
                  </span>

                  <span>{targetProgress}%</span>
                </div>

                <div
                  className="h-2 overflow-hidden rounded-full bg-[#EEF0EB]"
                  role="progressbar"
                  aria-label="Daily study target progress"
                  aria-valuenow={targetProgress}
                  aria-valuemin={0}
                  aria-valuemax={100}
                >
                  <div
                    className="h-full rounded-full bg-[#426B57] transition-all"
                    style={{ width: `${targetProgress}%` }}
                  />
                </div>
              </div>
            ) : (
              <p className="mt-3 text-xs text-[#66716B]">
                No daily target configured.
              </p>
            )}
          </div>

          <StatCard
            icon={Target}
            label="Tasks today"
            value={taskSummary.total ?? 0}
            detail={`${taskSummary.completed ?? 0} completed · ${taskSummary.inProgress ?? 0} in progress`}
          />

          <StatCard
            icon={TrendingUp}
            label="Pending tasks"
            value={taskSummary.pending ?? 0}
            detail="Tasks marked as To do"
          />
        </section>

        {/* ACTIVE TIMER */}

        <section className="mt-5">
          {timer ? (
            <div className="rounded-xl border border-[#E7D8B8] bg-[#F6EEDC] p-5 sm:p-6">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className={`h-2 w-2 rounded-full ${
                        timerIsRunning
                          ? "animate-pulse bg-[#D5A14A]"
                          : "bg-[#A77B2E]"
                      }`}
                    />

                    <span className="text-xs font-semibold uppercase tracking-wide text-[#84652D]">
                      {timerIsRunning ? "Timer running" : "Timer paused"}
                    </span>
                  </div>

                  <h2 className="mt-3 text-lg font-semibold text-[#202522]">
                    {timer.subjectName || "Study session"}
                  </h2>

                  <p className="mt-1 text-sm text-[#66716B]">
                    {timer.taskTitle
                      ? `Task: ${timer.taskTitle}`
                      : timer.activityType || "Study session"}
                  </p>
                </div>

                <div className="flex flex-col gap-3 sm:items-end">
                  <p className="font-mono text-3xl font-semibold tracking-tight text-[#202522]">
                    {formatTimerDuration(timerElapsed)}
                  </p>

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={handleTimerToggle}
                      disabled={isTimerUpdating}
                      className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-[#202522] px-4 text-sm font-medium text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-60"
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
                      className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-[#D7C49D] bg-white/70 px-4 text-sm font-medium text-[#202522] transition hover:bg-white"
                    >
                      Finish session
                      <ArrowRight size={15} />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-3 rounded-xl border border-dashed border-[#DDE2DC] bg-white p-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#F7F7F3] text-[#426B57]">
                  <Timer size={20} />
                </div>

                <div>
                  <h2 className="text-sm font-semibold">
                    No active study timer
                  </h2>

                  <p className="mt-1 text-xs text-[#66716B]">
                    Start a session when you're ready to study.
                  </p>
                </div>
              </div>

              <Link
                to="/timer"
                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-[#426B57] px-4 text-sm font-medium text-white hover:bg-[#355743]"
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

          <div className="rounded-xl border border-[#DDE2DC] bg-white p-5 xl:col-span-7">
            <SectionHeading
              title="Today's tasks"
              description="Your planned work for today."
              action={
                <Link
                  to="/tasks"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-[#426B57] hover:underline"
                >
                  View all
                  <ArrowRight size={14} />
                </Link>
              }
            />

            <div className="mb-5 grid grid-cols-3 gap-2">
              <div className="rounded-lg bg-[#F7F7F3] p-3">
                <p className="text-xl font-semibold">
                  {taskSummary.pending ?? 0}
                </p>
                <p className="mt-1 text-xs text-[#66716B]">To do</p>
              </div>

              <div className="rounded-lg bg-[#F7F7F3] p-3">
                <p className="text-xl font-semibold">
                  {taskSummary.inProgress ?? 0}
                </p>
                <p className="mt-1 text-xs text-[#66716B]">In progress</p>
              </div>

              <div className="rounded-lg bg-[#F7F7F3] p-3">
                <p className="text-xl font-semibold">
                  {taskSummary.completed ?? 0}
                </p>
                <p className="mt-1 text-xs text-[#66716B]">Completed</p>
              </div>
            </div>

            {todayTasks.length === 0 ? (
              <EmptyState
                icon={BookOpen}
                title="No tasks planned for today"
                description="Add a task to give your study day a clear direction."
              />
            ) : (
              <div className="divide-y divide-[#EEF0EB]">
                {todayTasks.slice(0, 5).map((task) => (
                  <div
                    key={task._id ?? task.id}
                    className="flex items-center justify-between gap-3 py-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-[#202522]">
                        {task.title}
                      </p>

                      <p className="mt-1 text-xs text-[#66716B]">
                        {task.subjectId?.name || "No subject"}
                      </p>
                    </div>

                    <span
                      className={`shrink-0 rounded-md px-2 py-1 text-xs font-medium ${getStatusStyle(task.status)}`}
                    >
                      {task.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* WEEKLY STUDY TREND */}

          <div className="rounded-xl border border-[#DDE2DC] bg-white p-5 xl:col-span-5">
            <SectionHeading
              title="Weekly study"
              description="Recorded time over the last 7 days."
            />

            {hasWeeklyData ? (
              <>
                <div className="flex h-48 items-end justify-between gap-2 border-b border-[#DDE2DC] px-1 pb-2 pt-5">
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
                        <span className="text-[10px] text-[#66716B]">
                          {minutes > 0 ? formatDuration(day.durationSeconds) : ""}
                        </span>

                        <div className="flex h-full w-full items-end justify-center">
                          <div
                            title={`${day.date}: ${formatDuration(day.durationSeconds)}`}
                            className={`w-full max-w-8 rounded-t-md ${
                              minutes > 0 ? "bg-[#426B57]" : "bg-[#EEF0EB]"
                            }`}
                            style={{ height: `${barHeight}%` }}
                          />
                        </div>

                        <span className="text-[11px] text-[#66716B]">
                          {formatShortDate(day.date, timezone)}
                        </span>
                      </div>
                    );
                  })}
                </div>

                <p className="mt-4 text-xs leading-5 text-[#66716B]">
                  Total recorded this week:{" "}
                  <strong className="font-semibold text-[#202522]">
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

          <div className="rounded-xl border border-[#DDE2DC] bg-white p-5 xl:col-span-7">
            <SectionHeading
              title="Subject allocation"
              description="How your recorded study time is distributed."
              action={
                <Link
                  to="/analytics"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-[#426B57] hover:underline"
                >
                  Analytics
                  <ArrowRight size={14} />
                </Link>
              }
            />

            {hasSubjectData ? (
              <div className="space-y-5">
                {subjectDistribution.map((subject, index) => {
                  const percentage =
                    subjectTotalSeconds > 0
                      ? (Number(subject.durationSeconds) /
                          subjectTotalSeconds) *
                        100
                      : 0;

                  const barColors = [
                    "bg-[#426B57]",
                    "bg-[#D5A14A]",
                    "bg-[#7C91A0]",
                    "bg-[#A58B78]",
                    "bg-[#879B78]",
                  ];

                  return (
                    <div key={subject.subject}>
                      <div className="mb-2 flex items-center justify-between gap-3">
                        <span className="truncate text-sm font-medium text-[#202522]">
                          {subject.subject || "Unassigned"}
                        </span>

                        <span className="shrink-0 text-xs text-[#66716B]">
                          {formatDuration(subject.durationSeconds)} ·{" "}
                          {Math.round(percentage)}%
                        </span>
                      </div>

                      <div className="h-2 overflow-hidden rounded-full bg-[#EEF0EB]">
                        <div
                          className={`h-full rounded-full ${barColors[index % barColors.length]}`}
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

          <div className="rounded-xl border border-[#DDE2DC] bg-white p-5 xl:col-span-5">
            <SectionHeading
              title="Latest mock test"
              description="Your most recently recorded result."
              action={
                <Link
                  to="/tests"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-[#426B57] hover:underline"
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
                    <p className="text-lg font-semibold text-[#202522]">
                      {latestTest.name}
                    </p>

                    <p className="mt-1 text-xs text-[#66716B]">
                      {latestTest.examType} ·{" "}
                      {formatDate(latestTest.testDate, timezone)}
                    </p>
                  </div>

                  <span className="rounded-md bg-[#E6EEE8] px-2.5 py-1 text-xs font-semibold text-[#426B57]">
                    Latest
                  </span>
                </div>

                <div className="mt-6 flex items-end justify-between gap-3">
                  <div>
                    <p className="text-3xl font-semibold tracking-tight">
                      {Number(latestTest.percentage).toFixed(1)}%
                    </p>

                    <p className="mt-1 text-xs text-[#66716B]">
                      {latestTest.marksObtained} / {latestTest.maxMarks} marks
                    </p>
                  </div>

                  <Link
                    to={`/tests/${latestTest.id}`}
                    className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-[#DDE2DC] px-3 text-xs font-medium text-[#202522] hover:bg-[#F7F7F3]"
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

        <section className="mt-5 rounded-xl border border-[#DDE2DC] bg-white p-5">
          <SectionHeading
            title="Recent study sessions"
            description="Your last recorded study activities."
            action={
              <Link
                to="/sessions"
                className="inline-flex items-center gap-1 text-xs font-semibold text-[#426B57] hover:underline"
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
            <div className="overflow-x-auto">
              <table className="w-full min-w-[520px] text-left">
                <thead>
                  <tr className="border-b border-[#EEF0EB] text-xs text-[#66716B]">
                    <th className="py-3 pr-4 font-medium">Subject</th>
                    <th className="py-3 pr-4 font-medium">Activity</th>
                    <th className="py-3 pr-4 font-medium">Date</th>
                    <th className="py-3 text-right font-medium">Duration</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-[#EEF0EB]">
                  {recentSessions.map((session) => (
                    <tr key={session._id ?? session.id}>
                      <td className="py-4 pr-4">
                        <p className="text-sm font-medium text-[#202522]">
                          {session.subjectNameSnapshot || "Unassigned"}
                        </p>

                        {session.taskTitleSnapshot && (
                          <p className="mt-1 text-xs text-[#66716B]">
                            {session.taskTitleSnapshot}
                          </p>
                        )}
                      </td>

                      <td className="py-4 pr-4 text-sm text-[#66716B]">
                        {session.activityType}
                      </td>

                      <td className="py-4 pr-4 text-sm text-[#66716B]">
                        <span>
                          {formatDate(session.sessionDate, timezone)}
                        </span>

                        <span className="mt-1 block text-xs">
                          {formatSessionTime(session.startAt, timezone)}
                        </span>
                      </td>

                      <td className="py-4 text-right text-sm font-medium text-[#202522]">
                        {formatDuration(session.durationSeconds)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* FOOTER */}

        <footer className="mt-8 flex flex-col gap-2 border-t border-[#DDE2DC] pt-5 text-xs text-[#66716B] sm:flex-row sm:items-center sm:justify-between">
          <p>StudyPulse · Plan your study. Track your effort.</p>

          <p>
            Data shown in {timezone}
          </p>
        </footer>
      </div>
    </div>
  );
}
