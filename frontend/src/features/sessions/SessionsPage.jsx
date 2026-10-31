
/* eslint-disable react-hooks/set-state-in-effect */
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  BookOpen,
  CalendarDays,
  Clock3,
  FileText,
  LoaderCircle,
  Plus,
  RefreshCw,
  X,
} from "lucide-react";

import { apiRequest } from "../../lib/api";
import { getTasks } from "../tasks/task.api";
import {
  createStudySession,
  getStudySessions,
} from "./session.api";

import SessionForm from "./component/SessionForm";

// Extract arrays from different API response structures
function getArrayFromResponse(response, keys = []) {
  if (Array.isArray(response)) return response;

  if (Array.isArray(response?.data)) {
    return response.data;
  }

  for (const key of keys) {
    if (Array.isArray(response?.data?.[key])) {
      return response.data[key];
    }

    if (Array.isArray(response?.[key])) {
      return response[key];
    }
  }

  return [];
}

// Format duration in hours and minutes
function formatDuration(seconds = 0) {
  const totalMinutes = Math.floor(seconds / 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }

  return `${minutes}m`;
}

// Format session date without UTC date shifting
function formatSessionDate(dateString) {
  if (!dateString) return "Date unavailable";

  const [year, month, day] = dateString
    .split("-")
    .map(Number);

  const date = new Date(year, month - 1, day);

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// Format timestamps in the user's local timezone
function formatSessionTime(dateString) {
  if (!dateString) return "";

  return new Date(dateString).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function SessionsPage() {
  const [subjects, setSubjects] = useState([]);
  const [tasks, setTasks] = useState([]);

  const [sessions, setSessions] = useState([]);
  const [pagination, setPagination] = useState(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const [isSaving, setIsSaving] = useState(false);
  const [pageError, setPageError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Fetch saved session history
  const loadSessions = useCallback(async () => {
    try {
      const response = await getStudySessions({
        page: 1,
        limit: 10,
      });

      setSessions(
        Array.isArray(response?.data) ? response.data : []
      );

      setPagination(response?.pagination || null);

      return true;
    } catch (error) {
      console.error("Session history error:", error);
      setPageError(
        error.message || "Unable to load study sessions."
      );

      return false;
    }
  }, []);

  // Fetch subjects, tasks and session history
  const loadPageData = useCallback(async () => {
    try {
      setIsLoading(true);
      setPageError("");

      const [subjectsResponse, tasksResponse] =
        await Promise.all([
          apiRequest("/subjects"),
          getTasks(),
        ]);

      setSubjects(
        getArrayFromResponse(subjectsResponse, ["subjects"])
      );

      setTasks(
        getArrayFromResponse(tasksResponse, ["tasks"])
      );

      await loadSessions();
    } catch (error) {
      console.error("Session page loading error:", error);

      setPageError(
        error.message || "Unable to load session page."
      );
    } finally {
      setIsLoading(false);
    }
  }, [loadSessions]);

  useEffect(() => {
    loadPageData();
  }, [loadPageData]);

  // Create a manual study session
  const handleCreateSession = async (payload) => {
    try {
      setIsSaving(true);
      setPageError("");
      setSuccessMessage("");

      await createStudySession(payload);

      // Close form after successful POST
      setIsFormOpen(false);

      setSuccessMessage("Study session saved successfully.");

      // Refresh history so the new session appears
      await loadSessions();
    } catch (error) {
      console.error("Create session error:", error);

      setPageError(
        error.message || "Unable to save study session."
      );

      throw error;
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">

        {/* Back navigation */}
        <Link
          to="/dashboard"
          className="mb-7 inline-flex items-center gap-2 text-sm font-medium text-stone-500 transition hover:text-stone-900"
        >
          <ArrowLeft size={16} />
          Back to Dashboard
        </Link>

        {/* Page heading */}
        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-emerald-800">
              Study tracking
            </p>

            <h1 className="text-3xl font-semibold tracking-tight">
              Study Sessions
            </h1>

            <p className="mt-2 text-sm text-stone-500">
              Keep track of the time you actually spend studying.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setSuccessMessage("");
              setPageError("");
              setIsFormOpen(true);
            }}
            disabled={isLoading || subjects.length === 0}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Plus size={17} />
            Add session
          </button>
        </div>

        {/* Error message */}
        {pageError && (
          <div
            role="alert"
            className="mb-5 flex items-start justify-between gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          >
            <p>{pageError}</p>

            <button
              type="button"
              onClick={() => setPageError("")}
              aria-label="Dismiss error"
            >
              <X size={17} />
            </button>
          </div>
        )}

        {/* Success message */}
        {successMessage && (
          <div
            role="status"
            className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800"
          >
            {successMessage}
          </div>
        )}

        {/* Session form */}
        {isFormOpen && (
          <div className="mb-8 rounded-2xl border border-stone-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-semibold">
                Add study session
              </h2>

              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="rounded-lg p-2 text-stone-500 transition hover:bg-stone-100 hover:text-stone-900"
                aria-label="Close session form"
              >
                <X size={19} />
              </button>
            </div>

            <SessionForm
              subjects={subjects}
              tasks={tasks}
              onSubmit={handleCreateSession}
              onCancel={() => setIsFormOpen(false)}
            />

            {isSaving && (
              <p className="mt-3 text-sm text-stone-500">
                Saving your session...
              </p>
            )}
          </div>
        )}

        {/* No subjects state */}
        {!isLoading && subjects.length === 0 && (
          <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-5">
            <h3 className="font-semibold text-stone-900">
              Add a subject first
            </h3>

            <p className="mt-1 text-sm text-stone-600">
              You need at least one subject before recording a
              study session.
            </p>

            <Link
              to="/subjects"
              className="mt-3 inline-block text-sm font-semibold text-emerald-900 underline"
            >
              Go to Subjects
            </Link>
          </div>
        )}

        {/* Session history heading */}
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">
              Session history
            </h2>

            <p className="mt-1 text-sm text-stone-500">
              Your recently recorded study sessions.
            </p>
          </div>

          <button
            type="button"
            onClick={loadSessions}
            disabled={isLoading}
            className="inline-flex items-center gap-2 rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm font-medium text-stone-600 transition hover:bg-stone-100 disabled:opacity-50"
          >
            <RefreshCw size={15} />
            Refresh
          </button>
        </div>

        {/* Loading state */}
        {isLoading ? (
          <div className="flex min-h-48 items-center justify-center rounded-2xl border border-stone-200 bg-white">
            <div className="flex items-center gap-3 text-sm text-stone-500">
              <LoaderCircle
                size={20}
                className="animate-spin"
              />
              Loading study sessions...
            </div>
          </div>
        ) : sessions.length === 0 ? (

          /* Empty state */
          <div className="rounded-2xl border border-dashed border-stone-300 bg-white px-6 py-14 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-900">
              <BookOpen size={25} />
            </div>

            <h3 className="text-lg font-semibold">
              No study sessions yet
            </h3>

            <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-stone-500">
              Your recorded study sessions will appear here.
              Add your first session to start tracking your effort.
            </p>

            {subjects.length > 0 && (
              <button
                type="button"
                onClick={() => setIsFormOpen(true)}
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-emerald-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-emerald-800"
              >
                <Plus size={17} />
                Add your first session
              </button>
            )}
          </div>
        ) : (

          /* Session list */
          <div className="space-y-3">
            {sessions.map((session) => (
              <article
                key={session._id}
                className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm transition hover:border-stone-300"
              >
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">

                  {/* Session information */}
                  <div className="min-w-0 flex-1">
                    <div className="mb-3 flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-900">
                        {session.activityType}
                      </span>

                      <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-medium text-stone-600">
                        Manual
                      </span>
                    </div>

                    <h3 className="text-lg font-semibold text-stone-900">
                      {session.subjectNameSnapshot || "Unknown subject"}
                    </h3>

                    {session.topic && (
                      <p className="mt-1 text-sm text-stone-600">
                        {session.topic}
                      </p>
                    )}

                    {session.taskTitleSnapshot && (
                      <p className="mt-2 text-xs text-stone-500">
                        Task: {session.taskTitleSnapshot}
                      </p>
                    )}

                    {/* Date and time */}
                    <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-stone-500">
                      <span className="inline-flex items-center gap-1.5">
                        <CalendarDays size={14} />
                        {formatSessionDate(session.sessionDate)}
                      </span>

                      <span className="inline-flex items-center gap-1.5">
                        <Clock3 size={14} />
                        {formatSessionTime(session.startAt)}
                        {" - "}
                        {formatSessionTime(session.endAt)}
                      </span>
                    </div>

                    {session.notes && (
                      <div className="mt-4 flex gap-2 rounded-lg bg-stone-50 p-3 text-sm text-stone-600">
                        <FileText
                          size={16}
                          className="mt-0.5 shrink-0"
                        />
                        <p>{session.notes}</p>
                      </div>
                    )}
                  </div>

                  {/* Duration */}
                  <div className="shrink-0 rounded-xl bg-stone-50 px-4 py-3 sm:text-right">
                    <p className="text-xs text-stone-500">
                      Duration
                    </p>

                    <p className="mt-1 text-xl font-semibold text-stone-900">
                      {formatDuration(session.durationSeconds)}
                    </p>
                  </div>
                </div>
              </article>
            ))}

            {/* Pagination information */}
            {pagination && (
              <div className="flex items-center justify-between pt-3 text-xs text-stone-500">
                <span>
                  {pagination.total} total sessions
                </span>

                <span>
                  Page {pagination.page} of {pagination.totalPages}
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
