
/* eslint-disable react-hooks/set-state-in-effect */
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
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
import { PageContainer, PageHeader } from "../../components/ui/Page";

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
    <PageContainer>
      <div className="max-w-4xl">
        <PageHeader
          title="Study sessions"
          description="Keep track of the time you actually spend studying."
          actions={
            <button
              type="button"
              onClick={() => {
                setSuccessMessage("");
                setPageError("");
                setIsFormOpen(true);
              }}
              disabled={isLoading || subjects.length === 0}
              className="btn btn-primary"
            >
              <Plus size={18} />
              Add session
            </button>
          }
        />

        {/* Error message */}
        {pageError && (
          <div
            role="alert"
            className="mb-5 flex items-start justify-between gap-3 rounded-control border border-danger/30 bg-danger-subtle p-4 text-sm text-danger"
          >
            <p>{pageError}</p>

            <button
              type="button"
              onClick={() => setPageError("")}
              aria-label="Dismiss error"
              className="-m-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-control hover:bg-danger/10"
            >
              <X size={18} />
            </button>
          </div>
        )}

        {/* Success message */}
        {successMessage && (
          <div
            role="status"
            className="mb-5 rounded-control border border-primary/25 bg-primary-subtle p-4 text-sm text-primary"
          >
            {successMessage}
          </div>
        )}

        {/* Session form */}
        {isFormOpen && (
          <div className="mb-8">
            <SessionForm
              subjects={subjects}
              tasks={tasks}
              onSubmit={handleCreateSession}
              onCancel={() => setIsFormOpen(false)}
            />

            {isSaving && (
              <p className="mt-3 text-sm text-muted">
                Saving your session...
              </p>
            )}
          </div>
        )}

        {/* No subjects state */}
        {!isLoading && subjects.length === 0 && (
          <div className="mb-6 rounded-panel border border-attention/40 bg-attention-subtle p-5">
            <h3 className="font-semibold text-ink">
              Add a subject first
            </h3>

            <p className="mt-1 text-sm text-muted">
              You need at least one subject before recording a
              study session.
            </p>

            <Link
              to="/subjects"
              className="mt-3 inline-flex min-h-11 items-center text-sm font-semibold text-primary underline underline-offset-4"
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

            <p className="mt-1 text-sm text-muted">
              Your recently recorded study sessions.
            </p>
          </div>

          <button
            type="button"
            onClick={loadSessions}
            disabled={isLoading}
            className="btn btn-secondary"
          >
            <RefreshCw size={15} />
            Refresh
          </button>
        </div>

        {/* Loading state */}
        {isLoading ? (
          <div className="flex min-h-48 items-center justify-center rounded-panel border border-line bg-white">
            <div className="flex items-center gap-3 text-sm text-muted">
              <LoaderCircle
                size={20}
                className="animate-spin"
              />
              Loading study sessions...
            </div>
          </div>
        ) : sessions.length === 0 ? (

          /* Empty state */
          <div className="rounded-panel border border-dashed border-line-strong bg-white px-6 py-14 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-panel bg-primary-subtle text-primary">
              <BookOpen size={25} />
            </div>

            <h3 className="text-xl font-semibold">
              No study sessions yet
            </h3>

            <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-muted">
              Your recorded study sessions will appear here.
              Add your first session to start tracking your effort.
            </p>

            {subjects.length > 0 && (
              <button
                type="button"
                onClick={() => setIsFormOpen(true)}
                className="btn btn-primary mt-5"
              >
                <Plus size={17} />
                Add your first session
              </button>
            )}
          </div>
        ) : (

          /* Session list */
          <div className="space-y-3">
            {sessions.map((session) => {
              const sourceLabel =
                session.source === "timer"
                  ? "Timer"
                  : session.source === "manual"
                    ? "Manual"
                    : null;

              return (
              <article
                key={session._id}
                className="rounded-panel border border-line bg-white p-5 transition hover:border-line-strong"
              >
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">

                  {/* Session information */}
                  <div className="min-w-0 flex-1">
                    <div className="mb-3 flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-primary-subtle px-3 py-1 text-xs font-medium text-primary">
                        {session.activityType}
                      </span>

                      {sourceLabel && (
                        <span className="rounded-full bg-tint px-3 py-1 text-xs font-medium text-ink">
                          {sourceLabel}
                        </span>
                      )}
                    </div>

                    <h3 className="text-xl font-semibold text-ink">
                      {session.subjectNameSnapshot || "Unknown subject"}
                    </h3>

                    {session.topic && (
                      <p className="mt-1 text-sm text-muted">
                        {session.topic}
                      </p>
                    )}

                    {session.taskTitleSnapshot && (
                      <p className="mt-2 text-xs text-muted">
                        Task: {session.taskTitleSnapshot}
                      </p>
                    )}

                    {/* Date and time */}
                    <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted">
                      <span className="inline-flex items-center gap-1.5">
                        <CalendarDays size={14} />
                        {formatSessionDate(session.sessionDate)}
                      </span>

                      <span className="inline-flex items-center gap-1.5">
                        <Clock3 size={14} />
                        {formatSessionTime(session.startAt)}
                        {" – "}
                        {formatSessionTime(session.endAt)}
                      </span>
                    </div>

                    {session.notes && (
                      <div className="mt-4 flex gap-2 rounded-control bg-canvas p-3 text-sm text-muted">
                        <FileText
                          size={16}
                          className="mt-0.5 shrink-0"
                        />
                        <p>{session.notes}</p>
                      </div>
                    )}
                  </div>

                  {/* Duration */}
                  <div className="shrink-0 rounded-panel bg-canvas px-4 py-3 sm:text-right">
                    <p className="text-xs text-muted">
                      Duration
                    </p>

                    <p className="mt-1 text-xl font-semibold text-ink">
                      {formatDuration(session.durationSeconds)}
                    </p>
                  </div>
                </div>
              </article>
              );
            })}

            {/* Pagination information */}
            {pagination && (
              <div className="flex items-center justify-between pt-3 text-xs text-muted">
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
    </PageContainer>
  );
}
