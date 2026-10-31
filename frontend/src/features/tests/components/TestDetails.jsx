import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileText,
  LoaderCircle,
  Pencil,
  RefreshCw,
  Target,
  Trash2,
  X,
} from "lucide-react";

import { apiRequest } from "../../../lib/api.js";
import { deleteTestResult } from "../../../features/tests/tests.api.js";
import TestForm from "../components/TestForm.jsx";

// --------------------------------------------------
// HELPERS
// --------------------------------------------------

function getTestFromResponse(result) {
  const data = result?.data;

  if (data?.testResult) return data.testResult;
  if (data?.test) return data.test;
  if (data?.item) return data.item;

  return data;
}

function formatDate(dateString) {
  if (!dateString) return "Date not available";

  const date = new Date(`${dateString}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return dateString;
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "long",
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

function getAttemptRate(test) {
  const { correct, incorrect, unanswered } = test?.counts ?? {};

  if (
    !Number.isInteger(correct) ||
    !Number.isInteger(incorrect) ||
    !Number.isInteger(unanswered) ||
    correct < 0 ||
    incorrect < 0 ||
    unanswered < 0
  ) {
    return null;
  }

  const total = correct + incorrect + unanswered;

  if (total <= 0) {
    return null;
  }

  return ((correct + incorrect) / total) * 100;
}

// --------------------------------------------------
// REUSABLE UI COMPONENTS
// --------------------------------------------------

function MetricCard({ label, value, description, icon: Icon }) {
  return (
    <div className="rounded-xl border border-stone-200 bg-white p-5">
      <div className="flex items-center justify-between">
        <span className="text-sm text-stone-500">
          {label}
        </span>

        <div className="rounded-lg bg-stone-100 p-2 text-stone-600">
          <Icon size={17} />
        </div>
      </div>

      <p className="mt-3 text-2xl font-semibold text-stone-900">
        {value}
      </p>

      {description && (
        <p className="mt-1 text-xs text-stone-500">
          {description}
        </p>
      )}
    </div>
  );
}

function Section({ title, description, children }) {
  return (
    <section className="rounded-2xl border border-stone-200 bg-white p-5 sm:p-6">
      <div className="mb-5">
        <h2 className="text-base font-semibold text-stone-900">
          {title}
        </h2>

        {description && (
          <p className="mt-1 text-sm text-stone-500">
            {description}
          </p>
        )}
      </div>

      {children}
    </section>
  );
}

function DetailRow({ label, value }) {
  return (
    <div className="flex flex-col gap-1 border-b border-stone-100 py-3 last:border-0 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
      <span className="text-sm text-stone-500">
        {label}
      </span>

      <span className="break-words text-sm font-medium text-stone-900 sm:text-right">
        {value ?? "Not available"}
      </span>
    </div>
  );
}

function EmptyMetric({ label }) {
  return (
    <div className="rounded-xl bg-stone-50 p-4">
      <p className="text-xs text-stone-500">{label}</p>
      <p className="mt-2 text-sm text-stone-400">
        Not available
      </p>
    </div>
  );
}

// --------------------------------------------------
// MAIN COMPONENT
// --------------------------------------------------

export default function TestDetail() {
  const { testId } = useParams();
  const navigate = useNavigate();

  const [test, setTest] = useState(null);

  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [notice, setNotice] = useState("");

  const [formOpen, setFormOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // --------------------------------------------------
  // FETCH TEST DETAILS
  // --------------------------------------------------

  const loadTest = useCallback(async () => {
    if (!testId) {
      setPageError("Test ID is missing.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setPageError("");

    try {
      const result = await apiRequest(`/tests/${testId}`);

      const testData = getTestFromResponse(result);

      if (!testData || typeof testData !== "object") {
        throw new Error("Test result could not be found.");
      }

      setTest(testData);
    } catch (error) {
      setTest(null);

      setPageError(
        error.message || "Unable to load test details."
      );
    } finally {
      setLoading(false);
    }
  }, [testId]);

  useEffect(() => {
    loadTest();
  }, [loadTest]);

  // --------------------------------------------------
  // EDIT
  // --------------------------------------------------

  function handleEdit() {
    setNotice("");
    setFormOpen(true);
  }

  function handleCloseForm() {
    setFormOpen(false);
  }

  async function handleTestUpdated() {
    setFormOpen(false);
    setNotice("Test result updated successfully.");

    await loadTest();
  }

  // --------------------------------------------------
  // DELETE
  // --------------------------------------------------

  async function handleDelete() {
    if (!test || deleting) return;

    const confirmed = window.confirm(
      `Are you sure you want to delete "${test.name}"? This action cannot be undone.`
    );

    if (!confirmed) return;

    setDeleting(true);
    setPageError("");

    try {
      await deleteTestResult(testId);

      navigate("/tests", {
        replace: true,
        state: {
          notice: "Test result deleted successfully.",
        },
      });
    } catch (error) {
      setPageError(
        error.message || "Unable to delete this test result."
      );

      setDeleting(false);
    }
  }

  // --------------------------------------------------
  // LOADING STATE
  // --------------------------------------------------

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-stone-50 px-4">
        <div className="flex items-center gap-3 text-sm text-stone-500">
          <LoaderCircle size={20} className="animate-spin" />
          Loading test details...
        </div>
      </main>
    );
  }

  // --------------------------------------------------
  // ERROR STATE
  // --------------------------------------------------

  if (pageError && !test) {
    return (
      <main className="min-h-screen bg-stone-50 px-4 py-10">
        <div className="mx-auto max-w-xl rounded-2xl border border-stone-200 bg-white p-6 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-stone-100 text-stone-600">
            <FileText size={22} />
          </div>

          <h1 className="mt-4 text-lg font-semibold text-stone-900">
            Unable to open test result
          </h1>

          <p className="mt-2 text-sm text-stone-500">
            {pageError}
          </p>

          <div className="mt-6 flex justify-center gap-3">
            <button
              type="button"
              onClick={loadTest}
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-800"
            >
              <RefreshCw size={15} />
              Try again
            </button>

            <Link
              to="/tests"
              className="rounded-lg border border-stone-200 px-4 py-2.5 text-sm font-medium text-stone-700 hover:bg-stone-50"
            >
              Back to tests
            </Link>
          </div>
        </div>
      </main>
    );
  }

  if (!test) return null;

  // --------------------------------------------------
  // CALCULATED VALUES
  // --------------------------------------------------

  const percentage = getPercentage(test);
  const accuracy = getAccuracy(test);
  const attemptRate = getAttemptRate(test);

  const counts = test.counts;
  const scoringScheme = test.scoringScheme;
  const subjectResults = Array.isArray(test.subjectResults)
    ? test.subjectResults
    : [];

  // --------------------------------------------------
  // UI
  // --------------------------------------------------

  return (
    <main className="min-h-screen bg-stone-50 text-stone-900">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">

        {/* Back navigation */}
        <Link
          to="/tests"
          className="mb-8 inline-flex items-center gap-2 text-sm text-stone-600 transition hover:text-stone-950"
        >
          <ArrowLeft size={16} />
          Back to test results
        </Link>

        {/* Header */}
        <header className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-medium tracking-wide text-emerald-800">
              TEST PERFORMANCE
            </p>

            <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
              {test.name}
            </h1>

            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-stone-500">
              <span className="inline-flex items-center gap-1.5">
                <CalendarDays size={15} />
                {formatDate(test.testDate)}
              </span>

              {test.examType && (
                <span className="rounded-md bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-800">
                  {test.examType}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleEdit}
              disabled={deleting}
              className="inline-flex items-center gap-2 rounded-lg border border-stone-200 bg-white px-4 py-2.5 text-sm font-medium text-stone-700 transition hover:border-emerald-800 hover:bg-emerald-50 disabled:opacity-50"
            >
              <Pencil size={15} />
              Edit
            </button>

            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className="inline-flex items-center gap-2 rounded-lg border border-stone-200 bg-white px-4 py-2.5 text-sm font-medium text-red-700 transition hover:border-red-200 hover:bg-red-50 disabled:opacity-50"
            >
              {deleting ? (
                <LoaderCircle size={15} className="animate-spin" />
              ) : (
                <Trash2 size={15} />
              )}
              Delete
            </button>
          </div>
        </header>

        {/* Success notice */}
        {notice && (
          <div
            role="status"
            className="mt-6 flex items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900"
          >
            <span className="flex items-center gap-2">
              <CheckCircle2 size={16} />
              {notice}
            </span>

            <button
              type="button"
              onClick={() => setNotice("")}
              aria-label="Dismiss notification"
              className="rounded p-1 hover:bg-emerald-100"
            >
              <X size={15} />
            </button>
          </div>
        )}

        {/* Update error */}
        {pageError && test && (
          <div
            role="alert"
            className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
          >
            {pageError}
          </div>
        )}

        {/* Edit form */}
        {formOpen && (
          <div className="mt-8">
            <TestForm
              test={test}
              onCancel={handleCloseForm}
              onUpdated={handleTestUpdated}
            />
          </div>
        )}

        {/* Overall performance */}
        <section className="mt-8 rounded-2xl border border-stone-200 bg-white p-5 sm:p-7">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium text-stone-500">
                OVERALL SCORE
              </p>

              <p className="mt-2 text-4xl font-semibold tracking-tight text-stone-900">
                {formatNumber(Number(test.marksObtained))}
                <span className="ml-2 text-xl font-normal text-stone-400">
                  / {formatNumber(Number(test.maxMarks))}
                </span>
              </p>

              <p className="mt-2 text-sm text-stone-500">
                Marks recorded for this test
              </p>
            </div>

            <div className="rounded-xl bg-emerald-50 px-5 py-4 sm:min-w-36 sm:text-center">
              <p className="text-xs font-medium text-emerald-800">
                PERCENTAGE
              </p>

              <p className="mt-1 text-3xl font-semibold text-emerald-950">
                {percentage !== null
                  ? `${percentage.toFixed(2)}%`
                  : "—"}
              </p>

              {percentage === null && (
                <p className="mt-1 text-xs text-emerald-800">
                  Insufficient valid data
                </p>
              )}
            </div>
          </div>
        </section>

        {/* Calculated metrics */}
        <section className="mt-6 grid gap-3 sm:grid-cols-3">
          {accuracy !== null ? (
            <MetricCard
              label="Accuracy"
              value={`${accuracy.toFixed(2)}%`}
              description="Correct answers / attempted answers"
              icon={Target}
            />
          ) : (
            <EmptyMetric label="Accuracy" />
          )}

          {attemptRate !== null ? (
            <MetricCard
              label="Attempt rate"
              value={`${attemptRate.toFixed(2)}%`}
              description="Attempted questions / total questions"
              icon={CheckCircle2}
            />
          ) : (
            <EmptyMetric label="Attempt rate" />
          )}

          {Number.isFinite(Number(test.durationMinutes)) &&
          Number(test.durationMinutes) > 0 ? (
            <MetricCard
              label="Test duration"
              value={`${test.durationMinutes} min`}
              description="Recorded test duration"
              icon={Clock3}
            />
          ) : (
            <EmptyMetric label="Test duration" />
          )}
        </section>

        {/* Question analysis */}
        <div className="mt-6">
          <Section
            title="Question analysis"
            description="Your recorded question counts."
          >
            {counts &&
            [
              counts.correct,
              counts.incorrect,
              counts.unanswered,
            ].some(Number.isInteger) ? (
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-xl bg-emerald-50 p-4">
                  <p className="text-xs text-emerald-800">
                    Correct
                  </p>

                  <p className="mt-2 text-2xl font-semibold text-emerald-950">
                    {Number.isInteger(counts.correct)
                      ? counts.correct
                      : "—"}
                  </p>
                </div>

                <div className="rounded-xl bg-stone-50 p-4">
                  <p className="text-xs text-stone-600">
                    Incorrect
                  </p>

                  <p className="mt-2 text-2xl font-semibold text-stone-900">
                    {Number.isInteger(counts.incorrect)
                      ? counts.incorrect
                      : "—"}
                  </p>
                </div>

                <div className="rounded-xl bg-stone-50 p-4">
                  <p className="text-xs text-stone-600">
                    Unanswered
                  </p>

                  <p className="mt-2 text-2xl font-semibold text-stone-900">
                    {Number.isInteger(counts.unanswered)
                      ? counts.unanswered
                      : "—"}
                  </p>
                </div>
              </div>
            ) : (
              <p className="rounded-xl bg-stone-50 px-4 py-6 text-center text-sm text-stone-500">
                Question counts were not recorded for this test.
              </p>
            )}
          </Section>
        </div>

        {/* Scoring scheme */}
        <div className="mt-6">
          <Section
            title="Scoring scheme"
            description="Marking rules recorded for this individual test."
          >
            {scoringScheme &&
            (
              Number.isFinite(scoringScheme.marksPerCorrect) ||
              Number.isFinite(scoringScheme.penaltyPerIncorrect)
            ) ? (
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl bg-stone-50 p-4">
                  <p className="text-xs text-stone-500">
                    Marks per correct answer
                  </p>

                  <p className="mt-2 text-xl font-semibold text-stone-900">
                    {Number.isFinite(scoringScheme.marksPerCorrect)
                      ? `+${formatNumber(scoringScheme.marksPerCorrect)}`
                      : "Not recorded"}
                  </p>
                </div>

                <div className="rounded-xl bg-stone-50 p-4">
                  <p className="text-xs text-stone-500">
                    Penalty per incorrect answer
                  </p>

                  <p className="mt-2 text-xl font-semibold text-stone-900">
                    {Number.isFinite(scoringScheme.penaltyPerIncorrect)
                      ? formatNumber(scoringScheme.penaltyPerIncorrect)
                      : "Not recorded"}
                  </p>
                </div>
              </div>
            ) : (
              <p className="rounded-xl bg-stone-50 px-4 py-6 text-center text-sm text-stone-500">
                No scoring scheme was recorded for this test.
              </p>
            )}
          </Section>
        </div>

        {/* Subject performance */}
        <div className="mt-6">
          <Section
            title="Subject-wise performance"
            description="Marks recorded for each subject."
          >
            {subjectResults.length > 0 ? (
              <div className="space-y-3">
                {subjectResults.map((subject, index) => {
                  const subjectPercentage =
                    Number.isFinite(Number(subject.marksObtained)) &&
                    Number.isFinite(Number(subject.maxMarks)) &&
                    Number(subject.maxMarks) > 0
                      ? (Number(subject.marksObtained) /
                          Number(subject.maxMarks)) *
                        100
                      : null;

                  return (
                    <div
                      key={`${subject.subjectName}-${index}`}
                      className="rounded-xl border border-stone-100 bg-stone-50 p-4"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-stone-900">
                          {subject.subjectName}
                        </p>

                        <p className="text-sm font-semibold text-stone-800">
                          {formatNumber(Number(subject.marksObtained))}
                          {" / "}
                          {formatNumber(Number(subject.maxMarks))}
                        </p>
                      </div>

                      {subjectPercentage !== null && (
                        <>
                          <div className="mt-3 h-2 overflow-hidden rounded-full bg-stone-200">
                            <div
                              className="h-full rounded-full bg-emerald-800"
                              style={{
                                width: `${Math.max(
                                  0,
                                  Math.min(100, subjectPercentage)
                                )}%`,
                              }}
                            />
                          </div>

                          <p className="mt-2 text-right text-xs text-stone-500">
                            {subjectPercentage.toFixed(2)}%
                          </p>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="rounded-xl bg-stone-50 px-4 py-6 text-center text-sm text-stone-500">
                Subject-wise results were not recorded.
              </p>
            )}
          </Section>
        </div>

        {/* Additional information */}
        <div className="mt-6">
          <Section
            title="Additional information"
            description="Other details saved with this test."
          >
            <DetailRow
              label="Test name"
              value={test.name}
            />

            <DetailRow
              label="Test date"
              value={formatDate(test.testDate)}
            />

            <DetailRow
              label="Exam type"
              value={test.examType || "Not specified"}
            />

            <DetailRow
              label="Duration"
              value={
                Number(test.durationMinutes) > 0
                  ? `${test.durationMinutes} minutes`
                  : "Not recorded"
              }
            />

            <DetailRow
              label="Notes"
              value={test.notes || "No notes added"}
            />
          </Section>
        </div>

        {/* Footer */}
        <div className="mt-8 flex justify-start">
          <Link
            to="/tests"
            className="inline-flex items-center gap-2 text-sm font-medium text-stone-600 transition hover:text-stone-950"
          >
            <ArrowLeft size={16} />
            Return to test history
          </Link>
        </div>
      </div>
    </main>
  );
}