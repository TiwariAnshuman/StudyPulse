
/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { LoaderCircle, X } from "lucide-react";
import { createTask, updateTask } from "./task.api";

// Browser ke local date ko YYYY-MM-DD format mein convert karta hai.
function getLocalDate() {
  const date = new Date();

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getInitialFormData(task = null) {
  if (!task) {
    return {
      title: "",
      subjectId: "",
      topic: "",
      estimateMinutes: "",
      priority: "Medium",
      plannedDate: getLocalDate(),
      dueDate: "",
      status: "To do",
      notes: "",
    };
  }

  // subjectId populated object bhi ho sakta hai ya simple ID.
  const subjectId =
    typeof task.subjectId === "object"
      ? task.subjectId?._id || task.subjectId?.id || ""
      : task.subjectId || "";

  return {
    title: task.title || "",
    subjectId,
    topic: task.topic || "",
    estimateMinutes:
      task.estimateMinutes ?? "",
    priority: task.priority || "Medium",
    plannedDate: task.plannedDate || getLocalDate(),
    dueDate: task.dueDate || "",
    status: task.status || "To do",
    notes: task.notes || "",
  };
}

const inputClass =
  "field";

const labelClass = "field-label";

export default function TaskForm({
  subjects = [],
  initialTask = null,
  onCancel,
  onCreated,
  onUpdated,
}) {
  const isEditing = Boolean(initialTask);

  const [formData, setFormData] = useState(
    () => getInitialFormData(initialTask)
  );

  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  // Jab selected task change ho, form ko uski values se refill karo.
  useEffect(() => {
    setFormData(getInitialFormData(initialTask));
    setFormError("");
  }, [initialTask]);

  function handleChange(event) {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));

    setFormError("");
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (saving) return;

    setFormError("");

    if (!formData.title.trim()) {
      setFormError("Please enter a task title.");
      return;
    }

    if (!formData.subjectId) {
      setFormError("Please select a subject.");
      return;
    }

    if (!formData.plannedDate) {
      setFormError("Please select a planned date.");
      return;
    }

    if (
      formData.dueDate &&
      formData.dueDate < formData.plannedDate
    ) {
      setFormError(
        "Due date cannot be earlier than planned date."
      );
      return;
    }

    const payload = {
      title: formData.title.trim(),
      subjectId: formData.subjectId,
      plannedDate: formData.plannedDate,
      priority: formData.priority,
      status: formData.status,
    };

    if (isEditing) {
      // Edit mode: blank fields should clear old values.
      payload.topic = formData.topic.trim() || null;

      payload.estimateMinutes =
        formData.estimateMinutes === ""
          ? null
          : Number(formData.estimateMinutes);

      payload.dueDate = formData.dueDate || null;
      payload.notes = formData.notes.trim();
    } else {
      // Create mode: optional fields are sent only when filled.
      if (formData.topic.trim()) {
        payload.topic = formData.topic.trim();
      }

      if (formData.estimateMinutes !== "") {
        payload.estimateMinutes = Number(
          formData.estimateMinutes
        );
      }

      if (formData.dueDate) {
        payload.dueDate = formData.dueDate;
      }

      if (formData.notes.trim()) {
        payload.notes = formData.notes.trim();
      }
    }

    try {
      setSaving(true);

      if (isEditing) {
        const taskId = initialTask._id || initialTask.id;

        if (!taskId) {
          throw new Error("Task ID is missing.");
        }

        const response = await updateTask(taskId, payload);

        onUpdated?.(response);
      } else {
        const response = await createTask(payload);

        onCreated?.(response);
      }
    } catch (error) {
      setFormError(
        error.message ||
          `Unable to ${isEditing ? "update" : "create"} task.`
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="mt-6 rounded-panel border border-line bg-white p-5 sm:p-6">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-ink">
            {isEditing ? "Edit task" : "Create a new task"}
          </h2>

          <p className="mt-1 text-sm text-muted">
            {isEditing
              ? "Update your task details."
              : "Plan what you want to study and when."}
          </p>
        </div>

        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          aria-label="Close task form"
          className="-mr-2 -mt-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-control text-muted transition-colors hover:bg-tint hover:text-ink disabled:opacity-50"
        >
          <X size={20} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="title" className={labelClass}>
            Task title <span className="text-danger">*</span>
          </label>

          <input
            id="title"
            name="title"
            type="text"
            maxLength={120}
            required
            autoFocus
            value={formData.title}
            onChange={handleChange}
            placeholder="e.g. Complete Laws of Motion revision"
            className={inputClass}
          />
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="subjectId" className={labelClass}>
              Subject <span className="text-danger">*</span>
            </label>

            <select
              id="subjectId"
              name="subjectId"
              required
              value={formData.subjectId}
              onChange={handleChange}
              className={inputClass}
            >
              <option value="">Select subject</option>

              {subjects
                .filter((subject) => !subject.archivedAt)
                .map((subject) => (
                  <option
                    key={subject._id || subject.id}
                    value={subject._id || subject.id}
                  >
                    {subject.name}
                  </option>
                ))}
            </select>
          </div>

          <div>
            <label htmlFor="topic" className={labelClass}>
              Topic / Chapter
            </label>

            <input
              id="topic"
              name="topic"
              type="text"
              maxLength={120}
              value={formData.topic}
              onChange={handleChange}
              placeholder="e.g. Newton's Laws"
              className={inputClass}
            />
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label
              htmlFor="estimateMinutes"
              className={labelClass}
            >
              Estimated study time
            </label>

            <div className="relative">

              <input
                id="estimateMinutes"
                name="estimateMinutes"
                type="number"
                min="1"
                step="1"
                value={formData.estimateMinutes}
                onChange={handleChange}
                placeholder="e.g. 60"
                className={inputClass}
              />
            </div>

            <p className="field-hint">
              Enter duration in minutes.
            </p>
          </div>

          <div>
            <label htmlFor="priority" className={labelClass}>
              Priority
            </label>

            <select
              id="priority"
              name="priority"
              value={formData.priority}
              onChange={handleChange}
              className={inputClass}
            >
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
            </select>
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="plannedDate" className={labelClass}>
              Planned date <span className="text-danger">*</span>
            </label>

            <div className="relative">

              <input
                id="plannedDate"
                name="plannedDate"
                type="date"
                required
                value={formData.plannedDate}
                onChange={handleChange}
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <label htmlFor="dueDate" className={labelClass}>
              Due date
            </label>

            <div className="relative">

              <input
                id="dueDate"
                name="dueDate"
                type="date"
                min={formData.plannedDate}
                value={formData.dueDate}
                onChange={handleChange}
                className={inputClass}
              />
            </div>
          </div>
        </div>

        <div>
          <label htmlFor="status" className={labelClass}>
            Status
          </label>

          <select
            id="status"
            name="status"
            value={formData.status}
            onChange={handleChange}
            className={inputClass}
          >
            <option value="To do">To do</option>
            <option value="In progress">In progress</option>
            <option value="Completed">Completed</option>
          </select>
        </div>

        <div>
          <label htmlFor="notes" className={labelClass}>
            Notes
          </label>

          <textarea
            id="notes"
            name="notes"
            rows={3}
            maxLength={1000}
            value={formData.notes}
            onChange={handleChange}
            placeholder="Add any additional details..."
            className={`${inputClass} resize-y`}
          />

          <p className="mt-1 text-right text-xs text-muted">
            {formData.notes.length}/1000
          </p>
        </div>

        {formError && (
          <p
            role="alert"
            className="rounded-control border border-danger/30 bg-danger-subtle px-3 py-2.5 text-sm text-danger"
          >
            {formError}
          </p>
        )}

        {subjects.length === 0 && (
          <p className="rounded-control bg-attention-subtle px-3 py-2.5 text-sm text-attention-ink">
            You need a subject before you can create a task.{" "}
            <Link to="/subjects" className="font-semibold underline underline-offset-4">
              Add a subject
            </Link>
          </p>
        )}

        <div className="flex flex-col-reverse gap-3 border-t border-line pt-5 sm:flex-row sm:justify-end">
          <button
            type="submit"
            disabled={saving || subjects.length === 0}
            className="btn btn-primary"
          >
            {saving && (
              <LoaderCircle
                size={16}
                className="animate-spin"
              />
            )}

            {saving
              ? isEditing
                ? "Saving changes..."
                : "Creating task..."
              : isEditing
                ? "Save changes"
                : "Create task"}
          </button>

          <button
            type="button"
            onClick={onCancel}
            disabled={saving}
            className="btn btn-secondary"
          >
            Cancel
          </button>
        </div>
      </form>
    </section>
  );
}
