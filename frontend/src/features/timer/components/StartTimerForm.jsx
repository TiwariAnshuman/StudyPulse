import { useState } from "react";
import { Play, AlertCircle, LoaderCircle } from "lucide-react";

const activityTypes = [
  "Reading",
  "Lecture",
  "Practice questions",
  "Revision",
  "Mock test",
  "Other",
];

const getId = (item) => item.id ?? item._id;

const getTaskSubjectId = (task) => {
  const subject = task.subjectId;

  return typeof subject === "object"
    ? getId(subject)
    : subject;
};

export default function StartTimerForm({
  subjects = [],
  tasks = [],
  onStart,
  isStarting = false,
}) {
  const [subjectId, setSubjectId] = useState("");
  const [taskId, setTaskId] = useState("");
  const [activityType, setActivityType] = useState("Reading");
  const [error, setError] = useState("");

  const filteredTasks = tasks.filter(
    (task) =>
      String(getTaskSubjectId(task)) === String(subjectId)
  );

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (!subjectId) {
      setError("Please select a subject.");
      return;
    }

    const payload = {
      subjectId,
      activityType,
    };

    if (taskId) {
      payload.taskId = taskId;
    }

    // Parent handles API errors and loading state.
    await onStart(payload);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full max-w-xl rounded-xl border border-stone-200 bg-white p-5 shadow-sm sm:p-6"
    >
      <div className="mb-6">
        <p className="text-xs font-semibold tracking-widest text-emerald-800">
          FOCUS TIMER
        </p>

        <h2 className="mt-2 text-xl font-semibold text-stone-900">
          Start a study session
        </h2>

        <p className="mt-1 text-sm text-stone-500">
          Select what you are going to study.
        </p>
      </div>

      <div className="space-y-5">
        {/* SUBJECT */}

        <div>
          <label
            htmlFor="timer-subject"
            className="mb-2 block text-sm font-medium text-stone-700"
          >
            Subject
          </label>

          <select
            id="timer-subject"
            value={subjectId}
            onChange={(event) => {
              setSubjectId(event.target.value);
              setTaskId("");
            }}
            required
            className="w-full rounded-lg border border-stone-300 bg-white px-3 py-3 text-sm outline-none focus:border-emerald-800 focus:ring-2 focus:ring-emerald-800/10"
          >
            <option value="">Select a subject</option>

            {subjects.map((subject) => (
              <option key={getId(subject)} value={getId(subject)}>
                {subject.name}
              </option>
            ))}
          </select>

          {subjects.length === 0 && (
            <p className="mt-1.5 text-xs text-amber-700">
              No active subjects found. Add a subject first.
            </p>
          )}
        </div>

        {/* TASK */}

        <div>
          <label
            htmlFor="timer-task"
            className="mb-2 block text-sm font-medium text-stone-700"
          >
            Link to a task
            <span className="ml-1 font-normal text-stone-400">
              (Optional)
            </span>
          </label>

          <select
            id="timer-task"
            value={taskId}
            onChange={(event) => setTaskId(event.target.value)}
            disabled={!subjectId}
            className="w-full rounded-lg border border-stone-300 bg-white px-3 py-3 text-sm outline-none focus:border-emerald-800 focus:ring-2 focus:ring-emerald-800/10 disabled:bg-stone-100"
          >
            <option value="">General study session</option>

            {filteredTasks.map((task) => (
              <option key={getId(task)} value={getId(task)}>
                {task.title}
              </option>
            ))}
          </select>

          <p className="mt-1.5 text-xs text-stone-500">
            No task selected? You can still record a general study session.
          </p>
        </div>

        {/* ACTIVITY */}

        <div>
          <label
            htmlFor="timer-activity"
            className="mb-2 block text-sm font-medium text-stone-700"
          >
            Activity type
          </label>

          <select
            id="timer-activity"
            value={activityType}
            onChange={(event) => setActivityType(event.target.value)}
            className="w-full rounded-lg border border-stone-300 bg-white px-3 py-3 text-sm outline-none focus:border-emerald-800 focus:ring-2 focus:ring-emerald-800/10"
          >
            {activityTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div
          role="alert"
          className="mt-5 flex gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800"
        >
          <AlertCircle size={18} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <button
        type="submit"
        disabled={isStarting || !subjectId || subjects.length === 0}
        className="mt-6 flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-emerald-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isStarting ? (
          <>
            <LoaderCircle size={18} className="animate-spin" />
            Starting...
          </>
        ) : (
          <>
            <Play size={17} fill="currentColor" />
            Start studying
          </>
        )}
      </button>
    </form>
  );
}