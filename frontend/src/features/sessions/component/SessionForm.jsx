
import { useState } from "react";
import {
  BookOpen,
  Clock3,
  FileText,
  LoaderCircle,
  X,
} from "lucide-react";

const ACTIVITY_TYPES = [
  "Reading",
  "Lecture",
  "Practice questions",
  "Revision",
  "Mock test",
  "Other",
];

// Extract a MongoDB ID from a string or document object.
function getMongoId(value) {
  if (!value) return "";

  if (typeof value === "string") {
    return value.trim();
  }

  if (typeof value === "object") {
    return (
      getMongoId(value._id) ||
      getMongoId(value.id) ||
      getMongoId(value.subjectId)
    );
  }

  return "";
}

function isValidObjectId(value) {
  return /^[a-f\d]{24}$/i.test(value);
}

function getTodayDate() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getLocalDateTime(date, time) {
  return new Date(`${date}T${time}`);
}

export default function SessionForm({
  subjects = [],
  tasks = [],
  onSubmit,
  onCancel,
}) {
  const [formData, setFormData] = useState({
    date: getTodayDate(),
    startTime: "",
    endTime: "",
    subjectId: "",
    taskId: "",
    activityType: "Reading",
    topic: "",
    notes: "",
  });

  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Prepare valid subject options.
  const validSubjects = subjects
    .map((subject) => ({
      ...subject,
      mongoId: getMongoId(subject),
    }))
    .filter((subject) => isValidObjectId(subject.mongoId));

  // Prepare valid task options.
  const validTasks = tasks
    .map((task) => ({
      ...task,
      mongoId: getMongoId(task),
    }))
    .filter((task) => isValidObjectId(task.mongoId));

  function handleChange(event) {
    const { name, value } = event.target;

    setFormData((previous) => {
      const updated = {
        ...previous,
        [name]: value,
      };

      // Automatically select the task's subject.
      if (name === "taskId" && value) {
        const selectedTask = validTasks.find(
          (task) => task.mongoId === value
        );

        if (selectedTask) {
          const taskSubjectId = getMongoId(
            selectedTask.subjectId
          );

          if (isValidObjectId(taskSubjectId)) {
            updated.subjectId = taskSubjectId;
          }
        }
      }

      return updated;
    });

    setError("");
  }

  function validateForm() {
    const {
      date,
      startTime,
      endTime,
      subjectId,
      taskId,
    } = formData;

    if (!date || !startTime || !endTime) {
      return "Please select the date, start time and end time.";
    }

    // A task can provide its subject automatically.
    if (!subjectId && !taskId) {
      return "Please select a subject or link a task.";
    }

    if (
      subjectId &&
      !isValidObjectId(getMongoId(subjectId))
    ) {
      return "Selected subject is invalid. Please select it again.";
    }

    if (
      taskId &&
      !isValidObjectId(getMongoId(taskId))
    ) {
      return "Selected task is invalid. Please select it again.";
    }

    const startAt = getLocalDateTime(date, startTime);
    const endAt = getLocalDateTime(date, endTime);

    if (
      Number.isNaN(startAt.getTime()) ||
      Number.isNaN(endAt.getTime())
    ) {
      return "Please enter valid date and time values.";
    }

    if (endAt <= startAt) {
      return "End time must be later than start time.";
    }

    const durationMs = endAt.getTime() - startAt.getTime();
    const twelveHoursMs = 12 * 60 * 60 * 1000;

    if (durationMs > twelveHoursMs) {
      return "A study session cannot be longer than 12 hours.";
    }

    if (
      startAt.getTime() > Date.now() ||
      endAt.getTime() > Date.now()
    ) {
      return "Future date or time cannot be recorded.";
    }

    return "";
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    const validationError = validateForm();

    if (validationError) {
      setError(validationError);
      return;
    }

    if (!onSubmit) {
      setError("Session submission handler is not configured.");
      return;
    }

    const selectedSubjectId = getMongoId(formData.subjectId);
    const selectedTaskId = getMongoId(formData.taskId);

    const payload = {
      // If no subject is selected, backend can derive it
      // from the linked task.
      ...(selectedSubjectId
        ? { subjectId: selectedSubjectId }
        : {}),

      taskId: selectedTaskId || null,

      startAt: getLocalDateTime(
        formData.date,
        formData.startTime
      ).toISOString(),

      endAt: getLocalDateTime(
        formData.date,
        formData.endTime
      ).toISOString(),

      activityType: formData.activityType,
      topic: formData.topic.trim() || null,
      notes: formData.notes.trim() || null,
    };

    // Debug: inspect the exact data sent to the backend.
    console.log("STUDY SESSION PAYLOAD:", payload);
    console.log("SUBJECT ID:", payload.subjectId);
    console.log("SUBJECT ID VALID:", payload.subjectId
      ? isValidObjectId(payload.subjectId)
      : "Derived from task");

    try {
      setIsSubmitting(true);
      await onSubmit(payload);
    } catch (submitError) {
      setError(
        submitError.message ||
          "Unable to save this study session."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 rounded-panel border border-line bg-white p-5 sm:p-6"
    >
      <div className="flex items-start justify-between gap-4">
        <div>

          <h2 className="text-xl font-semibold text-ink">
            Add study session
          </h2>

          <p className="mt-1 text-sm text-muted">
            Record the time you spent studying.
          </p>
        </div>

        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            aria-label="Close form"
            className="-mr-2 -mt-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-control text-muted transition-colors hover:bg-tint hover:text-ink disabled:opacity-50"
          >
            <X size={20} />
          </button>
        )}
      </div>


      {/* Date and time */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-ink">
          <Clock3 size={17} />
          Study duration
        </div>

        <div>
          <label
            htmlFor="session-date"
            className="mb-1.5 block text-sm font-medium text-ink"
          >
            Study date
          </label>

          <div className="relative">

            <input
              id="session-date"
              type="date"
              name="date"
              max={getTodayDate()}
              value={formData.date}
              onChange={handleChange}
              required
              className="field"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label
              htmlFor="session-start"
              className="mb-1.5 block text-sm font-medium text-ink"
            >
              Start time
            </label>

            <input
              id="session-start"
              type="time"
              name="startTime"
              value={formData.startTime}
              onChange={handleChange}
              required
              className="field"
            />
          </div>

          <div>
            <label
              htmlFor="session-end"
              className="mb-1.5 block text-sm font-medium text-ink"
            >
              End time
            </label>

            <input
              id="session-end"
              type="time"
              name="endTime"
              value={formData.endTime}
              onChange={handleChange}
              required
              className="field"
            />
          </div>
        </div>

        <p className="text-xs text-muted">
          Sessions longer than 12 hours and future times cannot be saved.
        </p>
      </section>

      <div className="border-t border-line" />

      {/* Subject and task */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-ink">
          <BookOpen size={17} />
          Study details
        </div>

        <div>
          <label
            htmlFor="session-subject"
            className="mb-1.5 block text-sm font-medium text-ink"
          >
            Subject
          </label>

          <select
            id="session-subject"
            name="subjectId"
            value={formData.subjectId}
            onChange={handleChange}
            required={!formData.taskId}
            className="field"
          >
            <option value="">Select a subject</option>

            {validSubjects.map((subject) => (
              <option
                key={subject.mongoId}
                value={subject.mongoId}
              >
                {subject.name}
              </option>
            ))}
          </select>

          {validSubjects.length === 0 && (
            <p className="mt-1.5 text-xs text-attention-ink">
              No active subjects found. Add a subject first, then come back to record a session.
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="session-task"
            className="mb-1.5 block text-sm font-medium text-ink"
          >
            Link a task
            <span className="ml-1 font-normal text-muted">
              (Optional)
            </span>
          </label>

          <select
            id="session-task"
            name="taskId"
            value={formData.taskId}
            onChange={handleChange}
            className="field"
          >
            <option value="">No linked task</option>

            {validTasks.map((task) => (
              <option
                key={task.mongoId}
                value={task.mongoId}
              >
                {task.title}
              </option>
            ))}
          </select>

          <p className="mt-1.5 text-xs text-muted">
            If you link a task, its subject can be used automatically.
          </p>
        </div>

        <div>
          <label
            htmlFor="session-activity"
            className="mb-1.5 block text-sm font-medium text-ink"
          >
            Activity type
          </label>

          <select
            id="session-activity"
            name="activityType"
            value={formData.activityType}
            onChange={handleChange}
            required
            className="field"
          >
            {ACTIVITY_TYPES.map((activity) => (
              <option key={activity} value={activity}>
                {activity}
              </option>
            ))}
          </select>
        </div>
      </section>

      <div className="border-t border-line" />

      {/* Optional information */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-ink">
          <FileText size={17} />
          Additional details
          <span className="font-normal text-muted">
            (Optional)
          </span>
        </div>

        <div>
          <label
            htmlFor="session-topic"
            className="mb-1.5 block text-sm font-medium text-ink"
          >
            Topic
          </label>

          <input
            id="session-topic"
            type="text"
            name="topic"
            value={formData.topic}
            onChange={handleChange}
            maxLength={100}
            placeholder="e.g. Laws of Motion"
            className="field"
          />
        </div>

        <div>
          <label
            htmlFor="session-notes"
            className="mb-1.5 block text-sm font-medium text-ink"
          >
            Notes
          </label>

          <textarea
            id="session-notes"
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            maxLength={1000}
            rows={3}
            placeholder="What did you study or understand today?"
            className="field resize-y py-2.5"
          />
        </div>
      </section>

      {error && (
        <div
          role="alert"
          className="rounded-control border border-danger/30 bg-danger-subtle px-4 py-3 text-sm text-danger"
        >
          {error}
        </div>
      )}

      <div className="flex flex-col-reverse gap-3 border-t border-line pt-5 sm:flex-row sm:justify-end">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="rounded-control border border-line px-5 py-2.5 text-sm font-medium text-ink transition hover:bg-canvas disabled:opacity-50"
          >
            Cancel
          </button>
        )}

        <button
          type="submit"
          disabled={isSubmitting || (validSubjects.length === 0 && validTasks.length === 0)}
          className="btn btn-primary"
        >
          {isSubmitting && (
            <LoaderCircle size={17} className="animate-spin" />
          )}

          {isSubmitting ? "Saving session..." : "Save session"}
        </button>
      </div>
    </form>
  );
}
