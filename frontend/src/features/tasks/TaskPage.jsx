
/* eslint-disable react-hooks/set-state-in-effect */
import { useCallback, useEffect, useState } from "react";
import {
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
import { PageContainer, PageHeader } from "../../components/ui/Page";

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
      return "bg-danger-subtle text-danger";
    case "Low":
      return "bg-tint text-muted";
    default:
      return "bg-attention-subtle text-attention-ink";
  }
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
    <PageContainer>
      <div className="max-w-4xl">
        <PageHeader
          title="Planner"
          description="Plan your study work, stay consistent and keep track of what needs your attention."
          actions={
            <>
              <p className="flex items-center gap-2 text-sm text-muted">
                <ListTodo size={18} aria-hidden="true" />
                {tasks.length} {tasks.length === 1 ? "task" : "tasks"}
              </p>

              <button
                type="button"
                onClick={handleOpenForm}
                className="btn btn-primary"
              >
                <Plus size={18} />
                Add task
              </button>
            </>
          }
        />

        {/* Success notice */}
        {notice && (
          <div
            role="status"
            className="mt-6 flex items-center justify-between gap-3 rounded-control border border-primary/25 bg-primary-subtle px-4 py-3 text-sm text-primary"
          >
            <span>{notice}</span>

            <button
              type="button"
              onClick={() => setNotice("")}
              aria-label="Dismiss notification"
              className="-my-2 -mr-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-control hover:bg-primary/10"
            >
              <X size={18} />
            </button>
          </div>
        )}

        {/* Subject loading warning */}
        {subjectError && (
          <div
            role="alert"
            className="mt-4 rounded-control border border-attention/40 bg-attention-subtle px-4 py-3 text-sm text-attention-ink"
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
            role="group"
            aria-label="Task views"
            className="-mx-4 flex gap-2 overflow-x-auto border-b border-line px-4 pb-3 [scrollbar-width:none] sm:mx-0 sm:px-0 [&::-webkit-scrollbar]:hidden"
          >
            {TASK_VIEWS.map((view) => (
              <button
                key={view.value}
                type="button"
                onClick={() => setActiveView(view.value)}
                aria-pressed={activeView === view.value}
                className={`min-h-11 shrink-0 rounded-control px-4 text-sm font-medium transition-colors ${
                  activeView === view.value
                    ? "bg-primary text-white"
                    : "border border-line bg-surface text-ink hover:bg-tint"
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
            className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-control border border-danger/30 bg-danger-subtle px-4 py-3 text-sm text-danger"
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
          <div className="flex items-center justify-between">
            <h2 className="sr-only">
              {
                TASK_VIEWS.find(
                  (view) => view.value === activeView
                )?.label
              }
            </h2>
          </div>

          {loading ? (
            <div className="flex min-h-52 items-center justify-center gap-3 rounded-panel border border-line bg-white text-sm text-muted">
              <LoaderCircle
                className="animate-spin"
                size={19}
              />
              Loading your tasks...
            </div>
          ) : pageError ? null : tasks.length === 0 ? (
            <div className="rounded-panel border border-dashed border-line-strong bg-white px-6 py-14 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-panel bg-primary-subtle text-primary">
                <BookOpen size={23} />
              </div>

              <h3 className="mt-4 text-base font-semibold">
                No tasks here yet
              </h3>

              <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-muted">
                Your tasks will appear here when you start
                planning your study work.
              </p>

              <button
                type="button"
                onClick={handleOpenForm}
                className="mt-5 inline-flex items-center gap-2 rounded-control bg-primary px-4 py-2.5 text-sm font-medium text-white transition hover:bg-primary-hover"
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
                    className="rounded-panel border border-line bg-white p-5 transition hover:border-line-strong"
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="break-words font-semibold text-ink">
                            {task.title}
                          </h3>

                          {/* Only high priority is flagged, so the badge keeps its meaning */}
                          {task.priority === "High" && (
                            <span
                              className={`rounded-control px-2 py-1 text-xs font-medium ${getPriorityStyle(
                                task.priority
                              )}`}
                            >
                              High priority
                            </span>
                          )}
                        </div>

                        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted">
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

                        <p className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
                          <span className="inline-flex items-center gap-1.5">
                            <CalendarDays size={15} />
                            Planned {formatDate(task.plannedDate)}
                          </span>

                          {task.dueDate && (
                            <span>Due {formatDate(task.dueDate)}</span>
                          )}
                        </p>
                      </div>

                      {/* Status and edit actions */}
                      <div className="flex shrink-0 items-center gap-2">
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
                          className={`min-h-11 min-w-0 flex-1 rounded-control border-0 px-3 text-sm font-medium transition-colors disabled:cursor-wait disabled:opacity-60 sm:flex-none ${getStatusStyle(
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
                            className="animate-spin text-muted"
                          />
                        )}

                        <button
                          type="button"
                          onClick={() => handleEditTask(task)}
                          disabled={Boolean(updatingTaskId)}
                          className="btn btn-secondary"
                          aria-label={`Edit ${task.title}`}
                        >
                          <Pencil size={15} />
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
    </PageContainer>
  );
}
