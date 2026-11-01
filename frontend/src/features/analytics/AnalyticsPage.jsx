
import { useCallback, useEffect, useRef, useState } from "react";
import { RefreshCw, ChartNoAxesCombined } from "lucide-react";

import DateRangeSelector from "./components/DateRangeSelector";
import StudyAnalytics from "./components/StudyAnalytics";
import TaskAnalytics from "./components/TaskAnalytics";
import TestAnalytics from "./components/TestAnalytics";
import Heatmap from "./components/Heatmap";
import Insights from "./components/Insights";

import {
  getStudyAnalytics,
  getTaskAnalytics,
  getTestAnalytics,
  getHeatmapAnalytics,
  getInsights,
} from "./analytics.api";

// Local date ko YYYY-MM-DD mein convert karta hai.
function getLocalDateString(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

// Default range: today + previous 6 days.
function getInitialDateRange() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const from = new Date(today);
  from.setDate(today.getDate() - 6);

  return {
    preset: "7days",
    from: getLocalDateString(from),
    to: getLocalDateString(today),
  };
}

function SectionMessage({ title, message, error = false }) {
  return (
    <div
      className={`rounded-xl border p-4 ${
        error
          ? "border-red-500/20 bg-red-500/5"
          : "border-[var(--border)] bg-[var(--surface)]"
      }`}
    >
      <h3 className="text-sm font-semibold text-[var(--foreground)]">
        {title}
      </h3>

      <p className="mt-1 text-sm text-[var(--muted-foreground)]">
        {message}
      </p>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex min-h-48 flex-col items-center justify-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)]">
      <RefreshCw
        size={22}
        className="animate-spin text-[var(--muted-foreground)]"
      />

      <p className="text-sm text-[var(--muted-foreground)]">
        Loading analytics...
      </p>
    </div>
  );
}

export default function AnalyticsPage() {
  const [dateRange, setDateRange] = useState(getInitialDateRange);

  const [analytics, setAnalytics] = useState({
    study: null,
    tasks: null,
    tests: null,
    heatmap: null,
    insights: null,
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(true);

  // Prevents an older API request from overwriting newer results.
  const requestIdRef = useRef(0);

  const handleDateRangeChange = (nextDateRange) => {
    setDateRange(nextDateRange);
    setErrors({});
    setLoading(
      Boolean(
        nextDateRange.from &&
          nextDateRange.to &&
          nextDateRange.from <= nextDateRange.to
      )
    );
  };

  const loadAnalytics = useCallback(async () => {
    if (!dateRange.from || !dateRange.to) {
      return;
    }

    if (dateRange.from > dateRange.to) {
      return;
    }

    const requestId = ++requestIdRef.current;

    const requests = [
      ["study", () => getStudyAnalytics(dateRange)],
      ["tasks", () => getTaskAnalytics(dateRange)],
      ["tests", () => getTestAnalytics(dateRange)],
      ["heatmap", () => getHeatmapAnalytics(dateRange)],
      ["insights", () => getInsights(dateRange)],
    ];

    const results = await Promise.allSettled(
      requests.map(async ([key, request]) => {
        const response = await request();

        return {
          key,
          data: response?.data ?? response,
        };
      })
    );

    // Ignore results if a newer request has already started.
    if (requestId !== requestIdRef.current) return;

    const nextAnalytics = {
      study: null,
      tasks: null,
      tests: null,
      heatmap: null,
      insights: null,
    };

    const nextErrors = {};

    results.forEach((result, index) => {
      const key = requests[index][0];

      if (result.status === "fulfilled") {
        nextAnalytics[key] = result.value.data;
      } else {
        nextErrors[key] =
          result.reason?.message ||
          `Unable to load ${key} analytics.`;
      }
    });

    setAnalytics(nextAnalytics);
    setErrors(nextErrors);
    setLoading(false);
  }, [dateRange]);

  const retryAnalytics = () => {
    setErrors({});
    setLoading(true);
    loadAnalytics();
  };

  useEffect(() => {
    loadAnalytics();

    return () => {
      // Invalidate the previous request on date change or unmount.
      requestIdRef.current += 1;
    };
  }, [loadAnalytics]);

  const hasAnyError = Object.keys(errors).length > 0;

  return (
    <main className="mx-auto w-full max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">

      {/* Page heading */}
      <header className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--muted)]">
            <ChartNoAxesCombined
              size={20}
              className="text-[var(--foreground)]"
            />
          </div>

          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[var(--foreground)]">
              Analytics
            </h1>

            <p className="text-sm text-[var(--muted-foreground)]">
              Understand your study patterns and progress.
            </p>
          </div>
        </div>
      </header>

      {/* Date range selector */}
      <DateRangeSelector
        value={dateRange}
        onChange={handleDateRangeChange}
      />

      {/* Partial API error notice */}
      {hasAnyError && !loading && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4">
          <p className="text-sm font-medium text-[var(--foreground)]">
            Some analytics could not be loaded.
          </p>

          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            Check your connection or try refreshing the data.
          </p>

          <button
            type="button"
            onClick={retryAnalytics}
            className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-[var(--foreground)] underline underline-offset-4"
          >
            <RefreshCw size={14} />
            Retry
          </button>
        </div>
      )}

      {/* Analytics content */}
      {loading ? (
        <LoadingState />
      ) : (
        <div className="space-y-8">

          {/* Study analytics */}
          <section className="space-y-3">
            <div>
              <h2 className="text-lg font-semibold text-[var(--foreground)]">
                Study analytics
              </h2>

              <p className="text-sm text-[var(--muted-foreground)]">
                Recorded study time and subject-wise activity.
              </p>
            </div>

            {errors.study ? (
              <SectionMessage
                title="Study analytics unavailable"
                message={errors.study}
                error
              />
            ) : analytics.study ? (
              <StudyAnalytics data={analytics.study} />
            ) : (
              <SectionMessage
                title="Study analytics unavailable"
                message="There is no study analytics data available for this date range."
              />
            )}
          </section>

          {/* Task analytics */}
          <section className="space-y-3">
            <div>
              <h2 className="text-lg font-semibold text-[var(--foreground)]">
                Task analytics
              </h2>

              <p className="text-sm text-[var(--muted-foreground)]">
                Task completion, workload and estimated versus recorded time.
              </p>
            </div>

            {errors.tasks ? (
              <SectionMessage
                title="Task analytics unavailable"
                message={errors.tasks}
                error
              />
            ) : analytics.tasks ? (
              <TaskAnalytics data={analytics.tasks} />
            ) : (
              <SectionMessage
                title="Task analytics unavailable"
                message="There is no task analytics data available for this date range."
              />
            )}
          </section>

          {/* Exam analytics */}
          <section className="space-y-3">
            <div>
              <h2 className="text-lg font-semibold text-[var(--foreground)]">
                Exam analytics
              </h2>

              <p className="text-sm text-[var(--muted-foreground)]">
                Mock-test performance and subject-wise trends.
              </p>
            </div>

            {errors.tests ? (
              <SectionMessage
                title="Exam analytics unavailable"
                message={errors.tests}
                error
              />
            ) : analytics.tests ? (
              <TestAnalytics data={analytics.tests} />
            ) : (
              <SectionMessage
                title="Exam analytics unavailable"
                message="There is no exam analytics data available for this date range."
              />
            )}
          </section>

          {/* Study consistency heatmap */}
          <section className="space-y-3">
            <div>
              <h2 className="text-lg font-semibold text-[var(--foreground)]">
                Study consistency
              </h2>

              <p className="text-sm text-[var(--muted-foreground)]">
                Your recorded study activity across calendar days.
              </p>
            </div>

            {errors.heatmap ? (
              <SectionMessage
                title="Study consistency unavailable"
                message={errors.heatmap}
                error
              />
            ) : analytics.heatmap ? (
              <Heatmap data={analytics.heatmap} />
            ) : (
              <SectionMessage
                title="Study consistency unavailable"
                message="There is no heatmap data available for this date range."
              />
            )}
          </section>

          {/* Evidence-based insights */}
          <section className="space-y-3">
            <div>
              <h2 className="text-lg font-semibold text-[var(--foreground)]">
                Insights
              </h2>

              <p className="text-sm text-[var(--muted-foreground)]">
                Evidence-based observations from your recorded data.
              </p>
            </div>

            {errors.insights ? (
              <SectionMessage
                title="Insights unavailable"
                message={errors.insights}
                error
              />
            ) : analytics.insights ? (
              <Insights data={analytics.insights} />
            ) : (
              <SectionMessage
                title="Insights unavailable"
                message="There are no insights available for this date range."
              />
            )}
          </section>

        </div>
      )}
    </main>
  );
}
