
/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState } from "react";
import {
  Clock3,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  Pause,
  Play,
  Square,
  Trash2,
  LoaderCircle,
  CheckCircle,
} from "lucide-react";

import { apiRequest } from "../../lib/api";
import { getTasks } from "../tasks/task.api";

import StartTimerForm from "./components/StartTimerForm";

import {
  getActiveStudyTimer,
  startStudyTimer,
  pauseStudyTimer,
  resumeStudyTimer,
  finishStudyTimer,
  discardStudyTimer,
} from "./timer.api";

// ---------------------------------------------
// HELPERS
// ---------------------------------------------

function formatDuration(totalSeconds = 0) {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds));

  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const seconds = safeSeconds % 60;

  return [hours, minutes, seconds]
    .map((value) => String(value).padStart(2, "0"))
    .join(":");
}

function getSubjectsFromResponse(result) {
  const data = result?.data;

  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.subjects)) return data.subjects;
  if (Array.isArray(data?.items)) return data.items;

  return [];
}

function getTasksFromResponse(result) {
  const data = result?.data;

  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.tasks)) return data.tasks;
  if (Array.isArray(data?.items)) return data.items;

  return [];
}

// ---------------------------------------------
// TIMER PAGE
// ---------------------------------------------

export default function TimerPage() {
  const [subjects, setSubjects] = useState([]);
  const [tasks, setTasks] = useState([]);

  const [activeTimer, setActiveTimer] = useState(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const [isLoading, setIsLoading] = useState(true);
  const [isStarting, setIsStarting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isFinishing, setIsFinishing] = useState(false);
  const [isDiscarding, setIsDiscarding] = useState(false);

  const [pageError, setPageError] = useState("");
  const [finishError, setFinishError] = useState("");

  const [showFinishForm, setShowFinishForm] = useState(false);

  const [topic, setTopic] = useState("");
  const [notes, setNotes] = useState("");

  const [savedSummary, setSavedSummary] = useState(null);

  // -------------------------------------------
  // LOAD SUBJECTS, TASKS AND ACTIVE TIMER
  // -------------------------------------------

  useEffect(() => {
    let isMounted = true;

    async function loadTimerData() {
      setIsLoading(true);
      setPageError("");

      try {
        const [
          subjectResponse,
          taskResponse,
          timerResponse,
        ] = await Promise.all([
          apiRequest("/subjects?includeArchived=true"),
          getTasks({ limit: 100 }),
          getActiveStudyTimer(),
        ]);

        if (!isMounted) return;

        const subjectList = getSubjectsFromResponse(subjectResponse);
        const taskList = getTasksFromResponse(taskResponse);

        setSubjects(
          subjectList.filter((subject) => !subject.archivedAt)
        );

        setTasks(taskList);

        // Restore active timer after refresh or reopening.
        setActiveTimer(timerResponse?.data ?? null);
      } catch (error) {
        if (!isMounted) return;

        setPageError(
          error.message || "Unable to load timer data."
        );
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadTimerData();

    return () => {
      isMounted = false;
    };
  }, []);

  // -------------------------------------------
  // CALCULATE ELAPSED TIME
  // -------------------------------------------

  useEffect(() => {
    if (!activeTimer) {
      setElapsedSeconds(0);
      return;
    }

    function updateElapsed() {
      const accumulated = Number(
        activeTimer.accumulatedSeconds || 0
      );

      const runningSince = activeTimer.runningSince
        ? new Date(activeTimer.runningSince).getTime()
        : null;

      const currentRunningSeconds =
        activeTimer.status === "running" &&
        runningSince !== null &&
        Number.isFinite(runningSince)
          ? Math.max(
              0,
              Math.floor((Date.now() - runningSince) / 1000)
            )
          : 0;

      setElapsedSeconds(
        accumulated + currentRunningSeconds
      );
    }

    updateElapsed();

    if (activeTimer.status !== "running") {
      return;
    }

    const intervalId = setInterval(updateElapsed, 1000);

    return () => clearInterval(intervalId);
  }, [activeTimer]);

  // -------------------------------------------
  // START TIMER
  // -------------------------------------------

  async function handleStart(payload) {
    if (isStarting) return;

    setIsStarting(true);
    setPageError("");
    setSavedSummary(null);

    try {
      const response = await startStudyTimer(payload);

      setActiveTimer(response.data);
    } catch (error) {
      setPageError(
        error.message || "Unable to start the timer."
      );
    } finally {
      setIsStarting(false);
    }
  }

  // -------------------------------------------
  // PAUSE TIMER
  // -------------------------------------------

  async function handlePause() {
    if (isUpdating) return;

    setIsUpdating(true);
    setPageError("");

    try {
      const response = await pauseStudyTimer();

      setActiveTimer(response.data);
    } catch (error) {
      setPageError(
        error.message || "Unable to pause the timer."
      );
    } finally {
      setIsUpdating(false);
    }
  }

  // -------------------------------------------
  // RESUME TIMER
  // -------------------------------------------

  async function handleResume() {
    if (isUpdating) return;

    setIsUpdating(true);
    setPageError("");

    try {
      const response = await resumeStudyTimer();

      setActiveTimer(response.data);
    } catch (error) {
      setPageError(
        error.message || "Unable to resume the timer."
      );
    } finally {
      setIsUpdating(false);
    }
  }

  // -------------------------------------------
  // FINISH TIMER
  // -------------------------------------------

  async function handleFinish(event) {
    event.preventDefault();

    if (isFinishing || !activeTimer) return;

    // A valid timer ID is required by the backend.
    if (!activeTimer._id) {
      setFinishError(
        "Timer ID is missing. Please refresh and try again."
      );
      return;
    }

    const confirmed = window.confirm(
      "Finish this study session and save the recorded time?"
    );

    if (!confirmed) return;

    setIsFinishing(true);
    setFinishError("");
    setPageError("");

    try {
      const response = await finishStudyTimer({
        timerId: activeTimer._id,
        topic: topic.trim(),
        notes: notes.trim(),
      });

      const session =
        response?.data?.session ?? response?.data;

      setSavedSummary(session);
      setActiveTimer(null);

      setTopic("");
      setNotes("");
      setShowFinishForm(false);
    } catch (error) {
      setFinishError(
        error.message || "Unable to finish the study session."
      );
    } finally {
      setIsFinishing(false);
    }
  }

  // -------------------------------------------
  // DISCARD TIMER
  // -------------------------------------------

  async function handleDiscard() {
    if (isDiscarding || !activeTimer) return;

    const confirmed = window.confirm(
      "Discard this timer? No study session will be saved."
    );

    if (!confirmed) return;

    setIsDiscarding(true);
    setPageError("");

    try {
      await discardStudyTimer();

      setActiveTimer(null);
      setElapsedSeconds(0);

      setTopic("");
      setNotes("");
      setShowFinishForm(false);
    } catch (error) {
      setPageError(
        error.message || "Unable to discard the timer."
      );
    } finally {
      setIsDiscarding(false);
    }
  }

  // -------------------------------------------
  // TIMER DETAILS
  // -------------------------------------------

  const subjectName =
    activeTimer?.subjectNameSnapshot || "Study session";

  const taskName = activeTimer?.taskTitleSnapshot;

  const isRunning = activeTimer?.status === "running";
  const isPaused = activeTimer?.status === "paused";

  const isBusy =
    isUpdating || isFinishing || isDiscarding;

  // -------------------------------------------
  // LOADING STATE
  // -------------------------------------------

  if (isLoading) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-8">
        <div className="mx-auto max-w-5xl">
          <p className="text-sm text-slate-500">
            Loading your timer...
          </p>
        </div>
      </main>
    );
  }

  // -------------------------------------------
  // MAIN UI
  // -------------------------------------------

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-5xl">
        {/* HEADER */}

        <header className="mb-8">
          <p className="text-sm font-medium text-amber-600">
            STUDYPULSE
          </p>

          <h1 className="mt-2 text-2xl font-semibold text-slate-900 sm:text-3xl">
            Focus Timer
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Track your actual study time.
          </p>
        </header>

        {/* PAGE ERROR */}

        {pageError && (
          <div
            role="alert"
            className="mb-5 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800"
          >
            <AlertCircle size={18} />
            <span>{pageError}</span>
          </div>
        )}

        {/* SAVED SESSION SUMMARY */}

        {savedSummary && (
          <section className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 p-5">
            <div className="flex items-center gap-2 text-emerald-800">
              <CheckCircle size={20} />

              <h2 className="font-semibold">
                Study session saved
              </h2>
            </div>

            <p className="mt-3 text-2xl font-semibold text-slate-900">
              {formatDuration(
                savedSummary.durationSeconds ?? elapsedSeconds
              )}
            </p>

            <p className="mt-1 text-sm text-slate-600">
              Your recorded study time has been saved.
            </p>

            {savedSummary.topic && (
              <p className="mt-2 text-sm text-slate-700">
                Topic: {savedSummary.topic}
              </p>
            )}
          </section>
        )}

        {/* START FORM */}

        {!activeTimer ? (
          <StartTimerForm
            subjects={subjects}
            tasks={tasks}
            onStart={handleStart}
            isStarting={isStarting}
          />
        ) : (
          <section className="max-w-xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            {/* STATUS */}

            <div className="flex items-center gap-2 text-sm font-medium">
              <span
                className={`h-2 w-2 rounded-full ${
                  isRunning
                    ? "animate-pulse bg-emerald-500"
                    : "bg-amber-500"
                }`}
              />

              <span
                className={
                  isRunning
                    ? "text-emerald-700"
                    : "text-amber-700"
                }
              >
                {isRunning ? "Timer running" : "Timer paused"}
              </span>
            </div>

            {/* DURATION */}

            <div className="mt-8 text-center">
              <p className="text-sm text-slate-500">
                Current study duration
              </p>

              <p className="mt-3 font-mono text-5xl font-semibold tracking-tight text-slate-900 sm:text-6xl">
                {formatDuration(elapsedSeconds)}
              </p>

              <p className="mt-3 text-xs text-slate-400">
                {isPaused
                  ? "Timer is paused. Paused time is not counted."
                  : "Your study time is being recorded."}
              </p>
            </div>

            {/* DETAILS */}

            <div className="mt-8 space-y-4 rounded-xl bg-slate-50 p-4">
              <div className="flex items-center gap-3">
                <BookOpen size={18} className="text-slate-500" />

                <div>
                  <p className="text-xs text-slate-500">
                    Subject
                  </p>

                  <p className="font-medium text-slate-900">
                    {subjectName}
                  </p>
                </div>
              </div>

              {taskName && (
                <div className="flex items-center gap-3">
                  <CheckCircle2
                    size={18}
                    className="text-slate-500"
                  />

                  <div>
                    <p className="text-xs text-slate-500">
                      Linked task
                    </p>

                    <p className="font-medium text-slate-900">
                      {taskName}
                    </p>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3">
                <Clock3 size={18} className="text-slate-500" />

                <div>
                  <p className="text-xs text-slate-500">
                    Activity
                  </p>

                  <p className="font-medium text-slate-900">
                    {activeTimer.activityType}
                  </p>
                </div>
              </div>
            </div>

            {/* PAUSE / RESUME */}

            <div className="mt-6">
              {isRunning && (
                <button
                  type="button"
                  onClick={handlePause}
                  disabled={isBusy}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-amber-500 px-5 py-3 font-medium text-white transition hover:bg-amber-600 disabled:opacity-60"
                >
                  {isUpdating ? (
                    <LoaderCircle
                      size={18}
                      className="animate-spin"
                    />
                  ) : (
                    <Pause size={18} />
                  )}

                  {isUpdating ? "Pausing..." : "Pause timer"}
                </button>
              )}

              {isPaused && (
                <button
                  type="button"
                  onClick={handleResume}
                  disabled={isBusy}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 px-5 py-3 font-medium text-white transition hover:bg-emerald-800 disabled:opacity-60"
                >
                  {isUpdating ? (
                    <LoaderCircle
                      size={18}
                      className="animate-spin"
                    />
                  ) : (
                    <Play size={18} />
                  )}

                  {isUpdating ? "Resuming..." : "Resume timer"}
                </button>
              )}
            </div>

            {/* FINISH FORM */}

            {showFinishForm && (
              <form
                onSubmit={handleFinish}
                className="mt-6 space-y-4 rounded-xl border border-slate-200 p-4"
              >
                <div>
                  <h3 className="font-semibold text-slate-900">
                    Finish study session
                  </h3>

                  <p className="mt-1 text-sm text-slate-500">
                    Add optional details before saving.
                  </p>
                </div>

                <div>
                  <label
                    htmlFor="timer-topic"
                    className="mb-1.5 block text-sm font-medium text-slate-700"
                  >
                    Topic (optional)
                  </label>

                  <input
                    id="timer-topic"
                    type="text"
                    maxLength={100}
                    value={topic}
                    onChange={(event) => setTopic(event.target.value)}
                    placeholder="e.g. Laws of Motion"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-emerald-700"
                  />
                </div>

                <div>
                  <label
                    htmlFor="timer-notes"
                    className="mb-1.5 block text-sm font-medium text-slate-700"
                  >
                    Notes (optional)
                  </label>

                  <textarea
                    id="timer-notes"
                    rows={3}
                    maxLength={1000}
                    value={notes}
                    onChange={(event) => setNotes(event.target.value)}
                    placeholder="What did you cover in this session?"
                    className="w-full resize-y rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-emerald-700"
                  />
                </div>

                {finishError && (
                  <p role="alert" className="text-sm text-red-700">
                    {finishError}
                  </p>
                )}

                <div className="flex flex-col gap-2 sm:flex-row">
                  <button
                    type="submit"
                    disabled={isFinishing || isDiscarding}
                    className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-emerald-700 px-4 py-3 text-sm font-medium text-white hover:bg-emerald-800 disabled:opacity-60"
                  >
                    {isFinishing && (
                      <LoaderCircle
                        size={17}
                        className="animate-spin"
                      />
                    )}

                    {isFinishing ? "Saving..." : "Confirm finish"}
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowFinishForm(false)}
                    disabled={isFinishing}
                    className="rounded-lg border border-slate-300 px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}

            {/* FINISH AND DISCARD ACTIONS */}

            {!showFinishForm && (
              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => {
                    setFinishError("");
                    setShowFinishForm(true);
                  }}
                  disabled={isBusy}
                  className="flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 font-medium text-white hover:bg-slate-800 disabled:opacity-60"
                >
                  <Square size={17} />
                  Finish session
                </button>

                <button
                  type="button"
                  onClick={handleDiscard}
                  disabled={isBusy}
                  className="flex items-center justify-center gap-2 rounded-xl border border-red-200 px-4 py-3 font-medium text-red-700 hover:bg-red-50 disabled:opacity-60"
                >
                  {isDiscarding ? (
                    <LoaderCircle
                      size={17}
                      className="animate-spin"
                    />
                  ) : (
                    <Trash2 size={17} />
                  )}

                  {isDiscarding ? "Discarding..." : "Discard timer"}
                </button>
              </div>
            )}
          </section>
        )}
      </div>
    </main>
  );
}
