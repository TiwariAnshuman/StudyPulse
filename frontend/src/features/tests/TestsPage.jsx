import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  FileText,
  LoaderCircle,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  Trophy,
  X,
} from "lucide-react";

import {
  deleteTestResult,
  getTestResults,
} from "./tests.api.js";

import TestForm from "./components/TestForm.jsx";

// --------------------------------------------------
// HELPERS
// --------------------------------------------------

function getTestsFromResponse(result) {
  const data = result?.data;

  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.testResults)) return data.testResults;
  if (Array.isArray(data?.tests)) return data.tests;
  if (Array.isArray(data)) return data;

  return [];
}

function getPaginationFromResponse(result) {
  const pagination = result?.data?.pagination;

  return {
    page: pagination?.page ?? 1,
    limit: pagination?.limit ?? 20,
    totalItems: pagination?.totalItems ?? 0,
    totalPages: pagination?.totalPages ?? 1,
  };
}

function getId(test) {
  return test?._id ?? test?.id;
}

function formatDate(dateString) {
  if (!dateString) return "Date not available";

  const date = new Date(`${dateString}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return dateString;
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatNumber(value) {
  return new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 2,
  }).format(value);
}

function getPercentage(test) {
  const obtained = Number(test?.marksObtained);
  const maximum = Number(test?.maxMarks);

  if (
    !Number.isFinite(obtained) ||
    !Number.isFinite(maximum) ||
    maximum <= 0
  ) {
    return null;
  }

  return (obtained / maximum) * 100;
}

function getAccuracy(test) {
  const correct = test?.counts?.correct;
  const incorrect = test?.counts?.incorrect;

  if (
    !Number.isInteger(correct) ||
    !Number.isInteger(incorrect) ||
    correct < 0 ||
    incorrect < 0
  ) {
    return null;
  }

  const attempted = correct + incorrect;

  if (attempted <= 0) {
    return null;
  }

  return (correct / attempted) * 100;
}

function getPercentageStyle(percentage) {
  if (percentage === null) {
    return "bg-stone-100 text-stone-600";
  }

  if (percentage >= 75) {
    return "bg-emerald-50 text-emerald-800";
  }

  if (percentage >= 40) {
    return "bg-amber-50 text-amber-800";
  }

  return "bg-stone-100 text-stone-700";
}

// --------------------------------------------------
// SMALL COMPONENTS
// --------------------------------------------------

function StatItem({ label, value, icon: Icon }) {
  return (
    <div className="rounded-xl border border-stone-200 bg-white p-4">
      <div className="flex items-center gap-2 text-stone-500">
        <Icon size={16} />
        <span className="text-xs font-medium">{label}</span>
      </div>

      <p className="mt-2 text-xl font-semibold text-stone-900">
        {value}
      </p>
    </div>
  );
}

function EmptyState({ onAddTest }) {
  return (
    <div className="rounded-2xl border border-dashed border-stone-300 bg-white px-5 py-14 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-800">
        <Trophy size={25} />
      </div>

      <h3 className="mt-5 text-lg font-semibold text-stone-900">
        No test results yet
      </h3>

      <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-stone-500">
        Start recording your mock-test performance.
        Your saved results will appear here.
      </p>

      <button
        type="button"
        onClick={onAddTest}
        className="mt-6 inline-flex items-center gap-2 rounded-lg bg-emerald-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-emerald-800"
      >
        <Plus size={17} />
        Add your first test
      </button>
    </div>
  );
}

// --------------------------------------------------
// MAIN PAGE
// --------------------------------------------------

export default function TestsPage() {
  const [tests, setTests] = useState([]);

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    totalItems: 0,
    totalPages: 1,
  });

  // Filters
  const [filters, setFilters] = useState({
    from: "",
    to: "",
    examType: "",
  });

  // Page states
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [notice, setNotice] = useState("");

  // Form states
  const [formOpen, setFormOpen] = useState(false);
  const [editingTest, setEditingTest] = useState(null);

  // Delete state
  const [deletingTestId, setDeletingTestId] = useState(null);

  // --------------------------------------------------
  // LOAD TEST RESULTS
  // --------------------------------------------------

  const loadTests = useCallback(async () => {
    setLoading(true);
    setPageError("");

    try {
      const result = await getTestResults({
        page,
        limit: 20,
        from: filters.from || undefined,
        to: filters.to || undefined,
        examType: filters.examType || undefined,
      });

      setTests(getTestsFromResponse(result));
      setPagination(getPaginationFromResponse(result));

      return true;
    } catch (error) {
      setTests([]);

      setPageError(
        error.message || "Unable to load test results."
      );

      return false;
    } finally {
      setLoading(false);
    }
  }, [page, filters]);

  useEffect(() => {
    loadTests();
  }, [loadTests]);

  // --------------------------------------------------
  // FILTER HANDLERS
  // --------------------------------------------------

  function handleFilterChange(event) {
    const { name, value } = event.target;

    setFilters((previous) => ({
      ...previous,
      [name]: value,
    }));

    setPage(1);
    setNotice("");
  }

  function handleClearFilters() {
    setFilters({
      from: "",
      to: "",
      examType: "",
    });

    setPage(1);
    setNotice("");
  }

  // --------------------------------------------------
  // FORM HANDLERS
  // --------------------------------------------------

  function handleOpenCreateForm() {
    setEditingTest(null);
    setNotice("");
    setPageError("");
    setFormOpen(true);
  }

  function handleEditTest(test) {
    setEditingTest(test);
    setNotice("");
    setPageError("");
    setFormOpen(true);
  }

  function handleCloseForm() {
    setFormOpen(false);
    setEditingTest(null);
  }

  async function handleTestCreated() {
    setFormOpen(false);
    setEditingTest(null);

    // New tests are sorted newest first.
    setPage(1);

    setNotice("Test result saved successfully.");
  }

  async function handleTestUpdated() {
    setFormOpen(false);
    setEditingTest(null);

    setNotice("Test result updated successfully.");

    await loadTests();
  }

  // --------------------------------------------------
  // DELETE TEST
  // --------------------------------------------------

  async function handleDeleteTest(test) {
    const testId = getId(test);

    if (!testId || deletingTestId) return;

    const confirmed = window.confirm(
      `Are you sure you want to delete "${test.name}"? This action cannot be undone.`
    );

    if (!confirmed) return;

    setDeletingTestId(testId);
    setNotice("");
    setPageError("");

    try {
      await deleteTestResult(testId);

      setNotice("Test result deleted successfully.");

      // If the last record on a page was deleted,
      // move to the previous page.
      if (tests.length === 1 && page > 1) {
        setPage((previous) => previous - 1);
      } else {
        await loadTests();
      }
    } catch (error) {
      setPageError(
        error.message || "Unable to delete test result."
      );
    } finally {
      setDeletingTestId(null);
    }
  }

  // --------------------------------------------------
  // PAGINATION
  // --------------------------------------------------

  function handlePreviousPage() {
    setPage((previous) => Math.max(1, previous - 1));
  }

  function handleNextPage() {
    setPage((previous) =>
      Math.min(pagination.totalPages, previous + 1)
    );
  }

  // --------------------------------------------------
  // DERIVED DATA
  // --------------------------------------------------

  const hasFilters =
    Boolean(filters.from) ||
    Boolean(filters.to) ||
    Boolean(filters.examType);

  const hasTests = tests.length > 0;

  // --------------------------------------------------
  // UI
  // --------------------------------------------------

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

        {/* Header */}
        <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium tracking-wide text-emerald-800">
              YOUR STUDY SPACE
            </p>

            <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
              Test Results
            </h1>

            <p className="mt-3 max-w-xl text-sm leading-6 text-stone-600">
              Keep a record of your mock tests and understand
              your performance over time.
            </p>
          </div>

          <button
            type="button"
            onClick={handleOpenCreateForm}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-emerald-800"
          >
            <Plus size={17} />
            Add test result
          </button>
        </header>

        {/* Summary */}
        <section className="mt-8 grid gap-3 sm:grid-cols-2">
          <StatItem
            label="Total recorded tests"
            value={pagination.totalItems}
            icon={FileText}
          />

          <StatItem
            label="Current page"
            value={`${pagination.page} / ${pagination.totalPages}`}
            icon={CalendarDays}
          />
        </section>

        {/* Notice */}
        {notice && (
          <div className="mt-6 flex items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={17} />
              <span>{notice}</span>
            </div>

            <button
              type="button"
              onClick={() => setNotice("")}
              aria-label="Dismiss notification"
              className="rounded-md p-1 hover:bg-emerald-100"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* Error */}
        {pageError && (
          <div
            role="alert"
            className="mt-6 flex items-start justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
          >
            <p>{pageError}</p>

            <button
              type="button"
              onClick={loadTests}
              className="inline-flex shrink-0 items-center gap-1.5 font-medium hover:underline"
            >
              <RefreshCw size={14} />
              Retry
            </button>
          </div>
        )}

        {/* Create / Edit form */}
        {formOpen && (
          <div className="mt-8">
            <TestForm
              test={editingTest}
              onCancel={handleCloseForm}
              onCreated={handleTestCreated}
              onUpdated={handleTestUpdated}
            />
          </div>
        )}

        {/* Filters */}
        <section className="mt-8 rounded-2xl border border-stone-200 bg-white p-5">
          <div className="flex items-center gap-2">
            <Search size={17} className="text-stone-500" />

            <h2 className="text-sm font-semibold text-stone-900">
              Filter test results
            </h2>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <label className="block">
              <span className="text-xs font-medium text-stone-600">
                From date
              </span>

              <input
                type="date"
                name="from"
                value={filters.from}
                max={filters.to || undefined}
                onChange={handleFilterChange}
                className="mt-2 w-full rounded-lg border border-stone-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-emerald-800"
              />
            </label>

            <label className="block">
              <span className="text-xs font-medium text-stone-600">
                To date
              </span>

              <input
                type="date"
                name="to"
                value={filters.to}
                min={filters.from || undefined}
                onChange={handleFilterChange}
                className="mt-2 w-full rounded-lg border border-stone-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-emerald-800"
              />
            </label>

            <label className="block">
              <span className="text-xs font-medium text-stone-600">
                Exam type
              </span>

              <select
                name="examType"
                value={filters.examType}
                onChange={handleFilterChange}
                className="mt-2 w-full rounded-lg border border-stone-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-emerald-800"
              >
                <option value="">All exam types</option>
                <option value="NEET">NEET</option>
                <option value="JEE">JEE</option>
                <option value="UPSC">UPSC</option>
                <option value="Other">Other</option>
              </select>
            </label>
          </div>

          {hasFilters && (
            <button
              type="button"
              onClick={handleClearFilters}
              className="mt-4 text-xs font-medium text-stone-600 transition hover:text-emerald-900"
            >
              Clear filters
            </button>
          )}
        </section>

        {/* Test list */}
        <section className="mt-8">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-stone-900">
                Your test history
              </h2>

              <p className="mt-1 text-xs text-stone-500">
                {pagination.totalItems} recorded{" "}
                {pagination.totalItems === 1 ? "test" : "tests"}
              </p>
            </div>

            <button
              type="button"
              onClick={loadTests}
              disabled={loading}
              aria-label="Refresh test results"
              className="rounded-lg border border-stone-200 bg-white p-2.5 text-stone-600 transition hover:bg-stone-100 disabled:opacity-50"
            >
              <RefreshCw
                size={16}
                className={loading ? "animate-spin" : ""}
              />
            </button>
          </div>

          {/* Loading */}
          {loading && (
            <div className="flex items-center justify-center rounded-2xl border border-stone-200 bg-white py-16">
              <div className="flex items-center gap-3 text-sm text-stone-500">
                <LoaderCircle
                  size={20}
                  className="animate-spin"
                />
                Loading test results...
              </div>
            </div>
          )}

          {/* Empty */}
          {!loading && !pageError && !hasTests && (
            hasFilters ? (
              <div className="rounded-2xl border border-stone-200 bg-white px-5 py-12 text-center">
                <p className="font-medium text-stone-800">
                  No matching test results
                </p>

                <p className="mt-2 text-sm text-stone-500">
                  Try changing or clearing your filters.
                </p>

                <button
                  type="button"
                  onClick={handleClearFilters}
                  className="mt-4 text-sm font-medium text-emerald-800 hover:text-emerald-950"
                >
                  Clear filters
                </button>
              </div>
            ) : (
              <EmptyState onAddTest={handleOpenCreateForm} />
            )
          )}

          {/* Cards */}
          {!loading && hasTests && (
            <div className="space-y-4">
              {tests.map((test) => {
                const testId = getId(test);
                const percentage = getPercentage(test);
                const accuracy = getAccuracy(test);

                return (
                  <article
                    key={testId}
                    className="rounded-2xl border border-stone-200 bg-white p-5 transition hover:border-stone-300 sm:p-6"
                  >
                    {/* Card header */}
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-base font-semibold text-stone-900">
                            {test.name}
                          </h3>

                          {test.examType && (
                            <span className="rounded-md bg-emerald-50 px-2 py-1 text-[11px] font-medium text-emerald-800">
                              {test.examType}
                            </span>
                          )}
                        </div>

                        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-stone-500">
                          <span className="inline-flex items-center gap-1.5">
                            <CalendarDays size={14} />
                            {formatDate(test.testDate)}
                          </span>

                          {test.durationMinutes && (
                            <span className="inline-flex items-center gap-1.5">
                              <Clock3 size={14} />
                              {test.durationMinutes} min
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex shrink-0 items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleEditTest(test)}
                          disabled={Boolean(deletingTestId)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-stone-200 px-3 py-2 text-xs font-medium text-stone-600 transition hover:border-emerald-800 hover:bg-emerald-50 hover:text-emerald-900 disabled:opacity-50"
                        >
                          <Pencil size={14} />
                          Edit
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteTest(test)}
                          disabled={Boolean(deletingTestId)}
                          aria-label={`Delete ${test.name}`}
                          className="inline-flex items-center justify-center rounded-lg border border-stone-200 p-2 text-stone-500 transition hover:border-red-200 hover:bg-red-50 hover:text-red-700 disabled:opacity-50"
                        >
                          {deletingTestId === testId ? (
                            <LoaderCircle
                              size={15}
                              className="animate-spin"
                            />
                          ) : (
                            <Trash2 size={15} />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Score */}
                    <div className="mt-5 grid gap-3 sm:grid-cols-3">
                      <div className="rounded-xl bg-stone-50 p-4">
                        <p className="text-xs text-stone-500">
                          Marks obtained
                        </p>

                        <p className="mt-1 text-xl font-semibold text-stone-900">
                          {formatNumber(Number(test.marksObtained))}
                          <span className="ml-1 text-sm font-normal text-stone-400">
                            / {formatNumber(Number(test.maxMarks))}
                          </span>
                        </p>
                      </div>

                      <div className="rounded-xl bg-stone-50 p-4">
                        <p className="text-xs text-stone-500">
                          Percentage
                        </p>

                        {percentage !== null ? (
                          <p className="mt-2">
                            <span
                              className={`rounded-md px-2.5 py-1 text-sm font-semibold ${getPercentageStyle(percentage)}`}
                            >
                              {percentage.toFixed(2)}%
                            </span>
                          </p>
                        ) : (
                          <p className="mt-2 text-sm text-stone-400">
                            Not available
                          </p>
                        )}
                      </div>

                      <div className="rounded-xl bg-stone-50 p-4">
                        <p className="text-xs text-stone-500">
                          Accuracy
                        </p>

                        {accuracy !== null ? (
                          <p className="mt-2 text-sm font-semibold text-stone-900">
                            {accuracy.toFixed(2)}%
                          </p>
                        ) : (
                          <p className="mt-2 text-sm text-stone-400">
                            Not available
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Question counts */}
                    {test.counts && (
                      <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-stone-600">
                        {Number.isInteger(test.counts.correct) && (
                          <span>
                            Correct:{" "}
                            <strong className="text-emerald-800">
                              {test.counts.correct}
                            </strong>
                          </span>
                        )}

                        {Number.isInteger(test.counts.incorrect) && (
                          <span>
                            Incorrect:{" "}
                            <strong className="text-stone-800">
                              {test.counts.incorrect}
                            </strong>
                          </span>
                        )}

                        {Number.isInteger(test.counts.unanswered) && (
                          <span>
                            Unanswered:{" "}
                            <strong className="text-stone-800">
                              {test.counts.unanswered}
                            </strong>
                          </span>
                        )}
                      </div>
                    )}

                    {/* Subject breakdown */}
                    {Array.isArray(test.subjectResults) &&
                      test.subjectResults.length > 0 && (
                        <div className="mt-5 border-t border-stone-100 pt-4">
                          <p className="mb-3 text-xs font-semibold text-stone-600">
                            SUBJECT BREAKDOWN
                          </p>

                          <div className="grid gap-2 sm:grid-cols-2">
                            {test.subjectResults.map(
                              (subject, index) => (
                                <div
                                  key={`${subject.subjectName}-${index}`}
                                  className="flex items-center justify-between gap-3 rounded-lg bg-stone-50 px-3 py-2.5"
                                >
                                  <span className="text-xs font-medium text-stone-700">
                                    {subject.subjectName}
                                  </span>

                                  <span className="text-xs font-semibold text-stone-900">
                                    {formatNumber(
                                      Number(subject.marksObtained)
                                    )}
                                    {" / "}
                                    {formatNumber(
                                      Number(subject.maxMarks)
                                    )}
                                  </span>
                                </div>
                              )
                            )}
                          </div>
                        </div>
                      )}

                    {/* Notes */}
                    {test.notes && (
                      <p className="mt-4 border-t border-stone-100 pt-4 text-sm leading-6 text-stone-600">
                        {test.notes}
                      </p>
                    )}

                    {/* Detail link */}
                    <div className="mt-5 border-t border-stone-100 pt-4">
                      <Link
                        to={`/tests/${testId}`}
                        className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-800 transition hover:text-emerald-950"
                      >
                        View test details
                        <ChevronRight size={16} />
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {!loading && pagination.totalPages > 1 && (
            <div className="mt-6 flex items-center justify-between rounded-xl border border-stone-200 bg-white px-4 py-3">
              <button
                type="button"
                onClick={handlePreviousPage}
                disabled={page <= 1}
                className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-stone-600 transition hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft size={17} />
                Previous
              </button>

              <span className="text-xs text-stone-500">
                Page {pagination.page} of {pagination.totalPages}
              </span>

              <button
                type="button"
                onClick={handleNextPage}
                disabled={page >= pagination.totalPages}
                className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-stone-600 transition hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next
                <ChevronRight size={17} />
              </button>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}