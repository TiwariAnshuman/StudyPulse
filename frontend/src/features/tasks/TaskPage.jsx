
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  BookOpen,
  CalendarDays,
  Clock3,
  ListTodo,
  LoaderCircle,
  Pencil,
  Plus,
  RotateCcw,
  X,
} from "lucide-react";

import { getTasks } from "./task.api";
import { apiRequest } from "../../lib/api";
import TaskForm from "./TaskForm";

const TASK_VIEWS = [
  { label: "Today", value: "today" },
  { label: "Upcoming", value: "upcoming" },
  { label: "Carried over", value: "carried-over" },
  { label: "Completed", value: "completed" },
  { label: "All tasks", value: "all" },
];

const TASK_STATUSES = [
  "To do",
  "In progress",
  "Completed",
];

function getTasksFromResponse(result) {
  const data = result?.data;

  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.tasks)) return data.tasks;

  return [];
}

function getSubjectsFromResponse(result) {
  const data = result?.data;

  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.subjects)) return data.subjects;

  return [];
}

function getId(item) {
  return item?.id ?? item?._id;
}

function formatDate(dateString) {
  if (!dateString) return "No due date";

  const date = new Date(`${dateString}T00:00:00`);

  if (Number.isNaN(date.getTime())) return dateString;

  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

function getPriorityStyle(priority) {
  switch (priority) {
    case "High":
      return "bg-red-50 text-red-700";
    case "Low":
      return "bg-stone-100 text-stone-600";
    default:
      return "bg-amber-50 text-amber-700";
  }
}

function getStatusStyle(status) {
  switch (status) {
    case "Completed":
      return "bg-emerald-50 text-emerald-800";
    case "In progress":
      return "bg-blue-50 text-blue-700";
    default:
      return "bg-stone-100 text-stone-600";
  }
}

export default function TasksPage() {
  const [tasks, setTasks] = useState([]);
  const [subjects, setSubjects] = useState([]);

  const [activeView, setActiveView] = useState("today");

  const [loading, setLoading] = useState(true);
  const [updatingTaskId, setUpdatingTaskId] = useState(null);

  const [pageError, setPageError] = useState("");
  const [subjectError, setSubjectError] = useState("");

  const [formOpen, setFormOpen] = useState(false);

  // Selected task is null in create mode.
  const [editingTask, setEditingTask] = useState(null);

  const [notice, setNotice] = useState("");

  const loadTasks = useCallback(async () => {
    setLoading(true);
    setPageError("");
    setSubjectError("");

    let tasksLoaded = false;

    try {
      const taskResult = await getTasks({
        view: activeView,
        page: 1,
        limit: 20,
        sort: "date",
      });

      setTasks(getTasksFromResponse(taskResult));
      tasksLoaded = true;
    } catch (error) {
      setTasks([]);
      setPageError(
        error.message || "Unable to load your tasks."
      );
    }

    try {
      const subjectResult = await apiRequest("/subjects");

      setSubjects(getSubjectsFromResponse(subjectResult));
    } catch (error) {
      setSubjects([]);
      setSubjectError(
        error.message || "Unable to load subjects."
      );
    }

    setLoading(false);

    return tasksLoaded;
  }, [activeView]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  // CREATE TASK
  function handleOpenForm() {
    setEditingTask(null);
    setNotice("");
    setFormOpen(true);
  }

  async function handleTaskCreated() {
    setFormOpen(false);
    setEditingTask(null);

    if (activeView === "all") {
      const refreshed = await loadTasks();

      setNotice(
        refreshed
          ? "Task created successfully."
          : "Task created, but the task list could not be refreshed."
      );
    } else {
      setNotice("Task created successfully.");
      setActiveView("all");
    }
  }

  // EDIT TASK
  function handleEditTask(task) {
    setNotice("");
    setPageError("");

    setEditingTask(task);
    setFormOpen(true);
  }

  async function handleTaskUpdated() {
    setFormOpen(false);
    setEditingTask(null);

    const refreshed = await loadTasks();

    setNotice(
      refreshed
        ? "Task updated successfully."
        : "Task updated, but the task list could not be refreshed."
    );
  }

  function handleCloseForm() {
    setFormOpen(false);
    setEditingTask(null);
  }

  // UPDATE TASK STATUS
  async function handleStatusChange(taskId, newStatus) {
    if (!taskId || updatingTaskId) return;

    setUpdatingTaskId(taskId);
    setNotice("");
    setPageError("");

    try {
      await apiRequest(`/tasks/${taskId}`, {
        method: "PATCH",
        body: JSON.stringify({
          status: newStatus,
        }),
      });

      const refreshed = await loadTasks();

      if (refreshed) {
        setNotice("Task status updated successfully.");
      } else {
        setNotice(
          "Status was saved, but the task list could not be refreshed."
        );
      }
    } catch (error) {
      setPageError(
        error.message || "Unable to update task status."
      );
    } finally {
      setUpdatingTaskId(null);
    }
  }

  const subjectMap = new Map(
    subjects.map((subject) => [
      getId(subject),
      subject,
    ])
  );

  return (
    <main className="min-h-screen bg-stone-50 text-stone-900">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">

        {/* Back navigation */}
        <Link
          to="/dashboard"
          className="mb-8 inline-flex items-center gap-2 text-sm text-stone-600 transition hover:text-stone-950"
        >
          <ArrowLeft size={16} />
          Back to dashboard
        </Link>

        {/* Page header */}
        <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium tracking-wide text-emerald-800">
              YOUR STUDY SPACE
            </p>

            <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
              Tasks
            </h1>

            <p className="mt-3 max-w-xl text-sm leading-6 text-stone-600">
              Plan your study work, stay consistent and keep
              track of what needs your attention.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 text-sm text-stone-500">
              <ListTodo size={18} />
              <span>
                {tasks.length}{" "}
                {tasks.length === 1 ? "task" : "tasks"}
              </span>
            </div>

            <button
              type="button"
              onClick={handleOpenForm}
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-emerald-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-emerald-800"
            >
              <Plus size={17} />
              Add task
            </button>
          </div>
        </header>

        {/* Success notice */}
        {notice && (
          <div
            role="status"
            className="mt-6 flex items-center justify-between gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900"
          >
            <span>{notice}</span>

            <button
              type="button"
              onClick={() => setNotice("")}
              aria-label="Dismiss notification"
              className="rounded p-1 hover:bg-emerald-100"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* Subject loading warning */}
        {subjectError && (
          <div
            role="alert"
            className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800"
          >
            Tasks can still be displayed, but subject names
            could not be loaded: {subjectError}
          </div>
        )}

        {/* Create / Edit task form */}
        {formOpen && (
          <TaskForm
            subjects={subjects}
            initialTask={editingTask}
            onCancel={handleCloseForm}
            onCreated={handleTaskCreated}
            onUpdated={handleTaskUpdated}
          />
        )}

        {/* Task views */}
        <section className="mt-8">
          <div
            className="flex gap-2 overflow-x-auto border-b border-stone-200 pb-3"
            aria-label="Task views"
          >
            {TASK_VIEWS.map((view) => (
              <button
                key={view.value}
                type="button"
                onClick={() => setActiveView(view.value)}
                aria-pressed={activeView === view.value}
                className={`shrink-0 rounded-lg px-4 py-2 text-sm font-medium transition ${
                  activeView === view.value
                    ? "bg-emerald-900 text-white"
                    : "bg-white text-stone-600 hover:bg-stone-100"
                }`}
              >
                {view.label}
              </button>
            ))}
          </div>
        </section>

        {/* Task loading error */}
        {pageError && (
          <div
            role="alert"
            className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
          >
            <span>{pageError}</span>

            <button
              type="button"
              onClick={loadTasks}
              className="inline-flex items-center gap-2 font-medium underline"
            >
              <RotateCcw size={15} />
              Retry
            </button>
          </div>
        )}

        {/* Task list */}
        <section className="mt-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-semibold">
              {
                TASK_VIEWS.find(
                  (view) => view.value === activeView
                )?.label
              }
            </h2>
          </div>

          {loading ? (
            <div className="flex min-h-52 items-center justify-center gap-3 rounded-xl border border-stone-200 bg-white text-sm text-stone-500">
              <LoaderCircle
                className="animate-spin"
                size={19}
              />
              Loading your tasks...
            </div>
          ) : pageError ? null : tasks.length === 0 ? (
            <div className="rounded-xl border border-dashed border-stone-300 bg-white px-6 py-14 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-900">
                <BookOpen size={23} />
              </div>

              <h3 className="mt-4 text-base font-semibold">
                No tasks here yet
              </h3>

              <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-stone-500">
                Your tasks will appear here when you start
                planning your study work.
              </p>

              <button
                type="button"
                onClick={handleOpenForm}
                className="mt-5 inline-flex items-center gap-2 rounded-lg bg-emerald-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-emerald-800"
              >
                <Plus size={16} />
                Create your first task
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {tasks.map((task) => {
                const taskId = getId(task);

                const subjectId =
                  typeof task.subjectId === "object"
                    ? getId(task.subjectId)
                    : task.subjectId;

                const subject = subjectMap.get(subjectId);

                return (
                  <article
                    key={taskId}
                    className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm transition hover:border-stone-300"
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="break-words font-semibold text-stone-900">
                            {task.title}
                          </h3>

                          <span
                            className={`rounded-md px-2 py-1 text-xs font-medium ${getPriorityStyle(
                              task.priority
                            )}`}
                          >
                            {task.priority || "Medium"} priority
                          </span>
                        </div>

                        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-stone-500">
                          <span className="inline-flex items-center gap-1.5">
                            <BookOpen size={15} />
                            {subject?.name || "Subject"}
                          </span>

                          {task.topic && (
                            <span>{task.topic}</span>
                          )}

                          {task.estimateMinutes && (
                            <span className="inline-flex items-center gap-1.5">
                              <Clock3 size={15} />
                              {task.estimateMinutes} min
                            </span>
                          )}
                        </div>

                        <div className="mt-3 inline-flex items-center gap-1.5 text-xs text-stone-500">
                          <CalendarDays size={14} />
                          Planned: {formatDate(task.plannedDate)}
                        </div>

                        {task.dueDate && (
                          <p className="mt-1 text-xs text-stone-500">
                            Due: {formatDate(task.dueDate)}
                          </p>
                        )}
                      </div>

                      {/* Status and edit actions */}
                      <div className="flex shrink-0 flex-wrap items-center gap-2">
                        <select
                          value={task.status || "To do"}
                          disabled={Boolean(updatingTaskId)}
                          onChange={(event) =>
                            handleStatusChange(
                              taskId,
                              event.target.value
                            )
                          }
                          aria-label={`Update status for ${task.title}`}
                          className={`w-fit rounded-md border-0 px-3 py-2 text-xs font-medium outline-none transition focus:ring-2 focus:ring-emerald-700 disabled:cursor-wait disabled:opacity-60 ${getStatusStyle(
                            task.status
                          )}`}
                        >
                          {TASK_STATUSES.map((status) => (
                            <option key={status} value={status}>
                              {status}
                            </option>
                          ))}
                        </select>

                        {updatingTaskId === taskId && (
                          <LoaderCircle
                            size={15}
                            className="animate-spin text-stone-500"
                          />
                        )}

                        <button
                          type="button"
                          onClick={() => handleEditTask(task)}
                          disabled={Boolean(updatingTaskId)}
                          className="inline-flex items-center gap-1.5 rounded-md border border-stone-200 px-3 py-2 text-xs font-medium text-stone-600 transition hover:border-emerald-800 hover:bg-emerald-50 hover:text-emerald-900 disabled:cursor-not-allowed disabled:opacity-50"
                          aria-label={`Edit ${task.title}`}
                        >
                          <Pencil size={13} />
                          Edit
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
