
import { useEffect, useState } from "react";
import {
  CalendarDays,
  Clock3,
  LoaderCircle,
  X,
} from "lucide-react";
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
  "mt-1.5 w-full rounded-lg border border-stone-300 bg-white px-3.5 py-2.5 text-sm text-stone-900 outline-none transition placeholder:text-stone-400 focus:border-emerald-800 focus:ring-2 focus:ring-emerald-800/10";

const labelClass = "text-sm font-medium text-stone-700";

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
    <section className="mt-6 rounded-xl border border-stone-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-stone-900">
            {isEditing ? "Edit task" : "Create a new task"}
          </h2>

          <p className="mt-1 text-sm text-stone-500">
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
          className="rounded-lg p-2 text-stone-500 transition hover:bg-stone-100 hover:text-stone-900 disabled:opacity-50"
        >
          <X size={19} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="title" className={labelClass}>
            Task title <span className="text-red-600">*</span>
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
              Subject <span className="text-red-600">*</span>
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
              <Clock3
                size={17}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400"
              />

              <input
                id="estimateMinutes"
                name="estimateMinutes"
                type="number"
                min="1"
                step="1"
                value={formData.estimateMinutes}
                onChange={handleChange}
                placeholder="e.g. 60"
                className={`${inputClass} pl-9`}
              />
            </div>

            <p className="mt-1 text-xs text-stone-500">
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
              Planned date <span className="text-red-600">*</span>
            </label>

            <div className="relative">
              <CalendarDays
                size={17}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400"
              />

              <input
                id="plannedDate"
                name="plannedDate"
                type="date"
                required
                value={formData.plannedDate}
                onChange={handleChange}
                className={`${inputClass} pl-9`}
              />
            </div>
          </div>

          <div>
            <label htmlFor="dueDate" className={labelClass}>
              Due date
            </label>

            <div className="relative">
              <CalendarDays
                size={17}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400"
              />

              <input
                id="dueDate"
                name="dueDate"
                type="date"
                min={formData.plannedDate}
                value={formData.dueDate}
                onChange={handleChange}
                className={`${inputClass} pl-9`}
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

          <p className="mt-1 text-right text-xs text-stone-400">
            {formData.notes.length}/1000
          </p>
        </div>

        {formError && (
          <p
            role="alert"
            className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700"
          >
            {formError}
          </p>
        )}

        <div className="flex flex-wrap gap-3 border-t border-stone-100 pt-5">
          <button
            type="submit"
            disabled={saving || subjects.length === 0}
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-emerald-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
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
            className="min-h-10 rounded-lg border border-stone-300 px-5 py-2.5 text-sm font-medium text-stone-700 transition hover:bg-stone-50 disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      </form>
    </section>
  );
}
