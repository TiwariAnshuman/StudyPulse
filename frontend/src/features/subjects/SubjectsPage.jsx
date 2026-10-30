
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  BookOpen,
  Check,
  LoaderCircle,
  Pencil,
  Plus,
  RotateCcw,
  Archive,
  X,
} from "lucide-react";
import { apiRequest } from "../../lib/api";

const DEFAULT_COLOR = "#426B57";

const COLORS = [
  "#426B57",
  "#547AA5",
  "#B7793E",
  "#9875A8",
  "#C05B54",
  "#398B8B",
];

function getSubjectsFromResponse(result) {
  const data = result?.data;

  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.subjects)) return data.subjects;

  return [];
}

async function fetchSubjects() {
  const result = await apiRequest(
    "/subjects?includeArchived=true"
  );

  return getSubjectsFromResponse(result);
}

function getSubjectId(subject) {
  return subject.id ?? subject._id;
}

export default function SubjectsPage() {
  const [subjects, setSubjects] = useState([]);
  const [archivedSubjects, setArchivedSubjects] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [pageError, setPageError] = useState("");
  const [formError, setFormError] = useState("");
  const [notice, setNotice] = useState("");

  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [name, setName] = useState("");
  const [color, setColor] = useState(DEFAULT_COLOR);

  // Fetch active and archived subjects together.
  const loadSubjects = useCallback(async () => {
    try {
      const allSubjects = await fetchSubjects();

      setPageError("");
      setSubjects(
        allSubjects.filter((subject) => !subject.archivedAt)
      );

      setArchivedSubjects(
        allSubjects.filter((subject) => Boolean(subject.archivedAt))
      );
    } catch (error) {
      setPageError(
        error.message || "Unable to load your subjects."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;

    async function initializeSubjects() {
      try {
        const allSubjects = await fetchSubjects();

        if (active) {
          setPageError("");
          setSubjects(
            allSubjects.filter((subject) => !subject.archivedAt)
          );
          setArchivedSubjects(
            allSubjects.filter((subject) => Boolean(subject.archivedAt))
          );
        }
      } catch (error) {
        if (active) {
          setPageError(
            error.message || "Unable to load your subjects."
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    initializeSubjects();

    return () => {
      active = false;
    };
  }, []);

  function openCreateForm() {
    setEditingId(null);
    setName("");
    setColor(DEFAULT_COLOR);
    setFormError("");
    setNotice("");
    setFormOpen(true);
  }

  function openEditForm(subject) {
    setEditingId(getSubjectId(subject));
    setName(subject.name);
    setColor(subject.color || DEFAULT_COLOR);
    setFormError("");
    setNotice("");
    setFormOpen(true);
  }

  function closeForm() {
    if (saving) return;

    setFormOpen(false);
    setEditingId(null);
    setName("");
    setColor(DEFAULT_COLOR);
    setFormError("");
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (saving) return;

    const trimmedName = name.trim();

    if (!trimmedName) {
      setFormError("Please enter a subject name.");
      return;
    }

    setSaving(true);
    setFormError("");
    setNotice("");

    try {
      const payload = {
        name: trimmedName,
        color,
      };

      if (editingId) {
        await apiRequest(`/subjects/${editingId}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
      } else {
        await apiRequest("/subjects", {
          method: "POST",
          body: JSON.stringify(payload),
        });
      }

      const wasEditing = Boolean(editingId);

      setFormOpen(false);
      setEditingId(null);
      setName("");
      setColor(DEFAULT_COLOR);

      setLoading(true);
      await loadSubjects();

      setNotice(
        wasEditing
          ? "Subject updated successfully."
          : "Subject created successfully."
      );
    } catch (error) {
      setFormError(
        error.message || "Unable to save this subject."
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleArchive(subject) {
    const subjectId = getSubjectId(subject);

    const confirmed = window.confirm(
      `Archive "${subject.name}"? It will be hidden from active subjects.`
    );

    if (!confirmed) return;

    setPageError("");
    setNotice("");

    try {
      await apiRequest(`/subjects/${subjectId}`, {
        method: "PATCH",
        body: JSON.stringify({ archived: true }),
      });

      setLoading(true);
      await loadSubjects();
      setNotice(`${subject.name} has been archived.`);
    } catch (error) {
      setPageError(
        error.message || "Unable to archive this subject."
      );
    }
  }

  async function handleRestore(subject) {
    const subjectId = getSubjectId(subject);

    setPageError("");
    setNotice("");

    try {
      await apiRequest(`/subjects/${subjectId}`, {
        method: "PATCH",
        body: JSON.stringify({ archived: false }),
      });

      setLoading(true);
      await loadSubjects();
      setNotice(`${subject.name} has been restored.`);
    } catch (error) {
      setPageError(
        error.message || "Unable to restore this subject."
      );
    }
  }

  return (
    <main className="min-h-screen bg-stone-50 text-stone-900">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <Link
          to="/dashboard"
          className="mb-8 inline-flex items-center gap-2 text-sm text-stone-600 transition hover:text-stone-950"
        >
          <ArrowLeft size={16} />
          Back to dashboard
        </Link>

        <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium tracking-wide text-emerald-800">
              YOUR STUDY SPACE
            </p>

            <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
              Subjects
            </h1>

            <p className="mt-3 max-w-xl text-sm leading-6 text-stone-600">
              Organize your preparation by subject. Your subjects
              will help connect study tasks, sessions and test results.
            </p>
          </div>

          <button
            type="button"
            onClick={openCreateForm}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-emerald-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-800 focus:ring-offset-2"
          >
            <Plus size={18} />
            Add subject
          </button>
        </header>

        {notice && (
          <div
            role="status"
            className="mt-6 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900"
          >
            {notice}
          </div>
        )}

        {pageError && (
          <div
            role="alert"
            className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
          >
            <span>{pageError}</span>

            <button
              type="button"
              onClick={loadSubjects}
              className="inline-flex items-center gap-2 font-medium underline underline-offset-4"
            >
              <RotateCcw size={15} />
              Retry
            </button>
          </div>
        )}

        {formOpen && (
          <section className="mt-8 rounded-xl border border-stone-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold">
                  {editingId ? "Edit subject" : "New subject"}
                </h2>

                <p className="mt-1 text-sm text-stone-500">
                  Choose a name and a colour to identify this subject.
                </p>
              </div>

              <button
                type="button"
                onClick={closeForm}
                disabled={saving}
                aria-label="Close form"
                className="rounded-md p-2 text-stone-500 hover:bg-stone-100 hover:text-stone-900 disabled:opacity-50"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-6 space-y-5">
              <div>
                <label
                  htmlFor="subject-name"
                  className="mb-2 block text-sm font-medium text-stone-700"
                >
                  Subject name
                </label>

                <input
                  id="subject-name"
                  type="text"
                  maxLength={50}
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="e.g. Physics"
                  autoFocus
                  required
                  disabled={saving}
                  className="w-full rounded-lg border border-stone-300 px-3.5 py-3 text-sm outline-none transition placeholder:text-stone-400 focus:border-emerald-800 focus:ring-2 focus:ring-emerald-800/10 disabled:bg-stone-100"
                />

                <p className="mt-1.5 text-xs text-stone-500">
                  Up to 50 characters.
                </p>
              </div>

              <fieldset>
                <legend className="mb-3 text-sm font-medium text-stone-700">
                  Subject colour
                </legend>

                <div className="flex flex-wrap items-center gap-3">
                  {COLORS.map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setColor(item)}
                      aria-label={`Choose colour ${item}`}
                      aria-pressed={color === item}
                      className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-white outline outline-1 outline-stone-300 transition focus-visible:ring-2 focus-visible:ring-emerald-800 focus-visible:ring-offset-2"
                      style={{ backgroundColor: item }}
                    >
                      {color === item && (
                        <Check size={17} color="#FFFFFF" />
                      )}
                    </button>
                  ))}
                </div>
              </fieldset>

              {formError && (
                <p role="alert" className="text-sm text-red-700">
                  {formError}
                </p>
              )}

              <div className="flex flex-wrap gap-3 pt-1">
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-emerald-900 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? (
                    <LoaderCircle size={16} className="animate-spin" />
                  ) : (
                    <Check size={16} />
                  )}

                  {saving
                    ? "Saving..."
                    : editingId
                      ? "Save changes"
                      : "Create subject"}
                </button>

                <button
                  type="button"
                  onClick={closeForm}
                  disabled={saving}
                  className="min-h-10 rounded-lg border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50 disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          </section>
        )}

        {/* Active subjects */}
        <section className="mt-8">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-semibold">
              Active subjects
            </h2>

            {!loading && (
              <span className="text-sm text-stone-500">
                {subjects.length}{" "}
                {subjects.length === 1 ? "subject" : "subjects"}
              </span>
            )}
          </div>

          {loading ? (
            <div className="flex min-h-48 items-center justify-center gap-3 rounded-xl border border-stone-200 bg-white text-sm text-stone-500">
              <LoaderCircle className="animate-spin" size={19} />
              Loading your subjects...
            </div>
          ) : subjects.length === 0 ? (
            <div className="rounded-xl border border-dashed border-stone-300 bg-white px-6 py-12 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-900">
                <BookOpen size={23} />
              </div>

              <h3 className="mt-4 text-base font-semibold">
                Start with your first subject
              </h3>

              <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-stone-600">
                Add a subject to organize your study tasks and
                keep your future study records connected.
              </p>

              <button
                type="button"
                onClick={openCreateForm}
                className="mt-5 inline-flex items-center gap-2 rounded-lg bg-emerald-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-800"
              >
                <Plus size={17} />
                Add your first subject
              </button>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {subjects.map((subject) => (
                <article
                  key={getSubjectId(subject)}
                  className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm transition hover:border-stone-300"
                >
                  <div className="flex items-start gap-3">
                    <span
                      className="mt-1 h-10 w-1.5 shrink-0 rounded-full"
                      style={{
                        backgroundColor: subject.color || DEFAULT_COLOR,
                      }}
                    />

                    <div className="min-w-0 flex-1">
                      <h3 className="break-words font-semibold">
                        {subject.name}
                      </h3>

                      <p className="mt-1 text-sm text-stone-500">
                        Study subject
                      </p>
                    </div>

                    <div className="flex shrink-0 items-center gap-1">
                      <button
                        type="button"
                        onClick={() => openEditForm(subject)}
                        aria-label={`Edit ${subject.name}`}
                        title="Edit subject"
                        className="rounded-lg p-2 text-stone-500 hover:bg-stone-100 hover:text-stone-900"
                      >
                        <Pencil size={17} />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleArchive(subject)}
                        aria-label={`Archive ${subject.name}`}
                        title="Archive subject"
                        className="rounded-lg p-2 text-stone-500 hover:bg-stone-100 hover:text-stone-900"
                      >
                        <Archive size={17} />
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        {/* Archived subjects */}
        <section className="mt-10 border-t border-stone-200 pt-8">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold">
                Archived subjects
              </h2>

              <p className="mt-1 text-sm text-stone-500">
                Subjects here are hidden from active study selections.
              </p>
            </div>

            <span className="text-sm text-stone-500">
              {archivedSubjects.length}
            </span>
          </div>

          {loading ? (
            <div className="rounded-xl border border-stone-200 bg-white px-5 py-8 text-center text-sm text-stone-500">
              Loading archived subjects...
            </div>
          ) : archivedSubjects.length === 0 ? (
            <div className="rounded-xl border border-dashed border-stone-300 bg-white px-5 py-8 text-center">
              <Archive
                size={22}
                className="mx-auto text-stone-400"
              />

              <p className="mt-3 text-sm font-medium text-stone-700">
                No archived subjects
              </p>

              <p className="mt-1 text-sm text-stone-500">
                Archived subjects will appear here.
              </p>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {archivedSubjects.map((subject) => (
                <article
                  key={getSubjectId(subject)}
                  className="flex items-center gap-3 rounded-xl border border-stone-200 bg-white p-4"
                >
                  <span
                    className="h-9 w-1.5 shrink-0 rounded-full"
                    style={{
                      backgroundColor: subject.color || DEFAULT_COLOR,
                    }}
                  />

                  <div className="min-w-0 flex-1">
                    <h3 className="break-words text-sm font-semibold text-stone-800">
                      {subject.name}
                    </h3>

                    <p className="mt-1 text-xs text-stone-500">
                      Archived
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRestore(subject)}
                    title={`Restore ${subject.name}`}
                    aria-label={`Restore ${subject.name}`}
                    className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-stone-300 px-3 py-2 text-sm font-medium text-stone-700 transition hover:border-emerald-800 hover:bg-emerald-50 hover:text-emerald-900 focus:outline-none focus:ring-2 focus:ring-emerald-800"
                  >
                    <RotateCcw size={15} />
                    Restore
                  </button>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
