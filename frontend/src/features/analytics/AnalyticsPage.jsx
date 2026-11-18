import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { RefreshCw, ChartNoAxesCombined } from "lucide-react";

import { PageContainer, PageHeader } from "../../components/ui/Page";

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

const SECTIONS = [
  { id: "study", label: "Study" },
  { id: "tasks", label: "Tasks" },
  { id: "exams", label: "Exams" },
  { id: "consistency", label: "Consistency" },
  { id: "insights", label: "Insights" },
];

// Jump to a section of this long page (smooth unless reduced motion is on).
function scrollToSection(id) {
  const target = document.getElementById(id);

  if (!target) return;

  const reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  target.scrollIntoView({
    behavior: reduceMotion ? "auto" : "smooth",
    block: "start",
  });
}

function SectionNav() {
  return (
    <nav
      aria-label="Analytics sections"
      className="sticky top-0 z-30 -mx-4 border-b border-line bg-canvas px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8"
    >
      <ul className="flex gap-1 overflow-x-auto py-1">
        {SECTIONS.map((section) => (
          <li key={section.id} className="shrink-0">
            <button
              type="button"
              onClick={() => scrollToSection(section.id)}
              className="btn btn-quiet min-h-11"
            >
              {section.label}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}

function SectionMessage({ title, message, error = false, action }) {
  return (
    <div
      className={`rounded-panel border p-4 ${
        error ? "border-danger/30 bg-danger-subtle" : "border-line bg-surface"
      }`}
    >
      <h3 className="text-sm font-semibold text-ink">{title}</h3>

      <p className="mt-1 text-sm text-muted">{message}</p>

      {action}
    </div>
  );
}

function SectionLink({ to, children }) {
  return (
    <Link
      to={to}
      className="mt-3 inline-flex min-h-11 items-center text-sm font-semibold text-primary underline underline-offset-4"
    >
      {children}
    </Link>
  );
}

function AnalyticsSection({ id, title, description, children }) {
  return (
    <section id={id} aria-labelledby={`${id}-heading`} className="space-y-4">
      <div>
        <h2 id={`${id}-heading`} className="text-xl font-semibold text-ink">
          {title}
        </h2>

        <p className="mt-1 text-sm text-muted">{description}</p>
      </div>

      {children}
    </section>
  );
}

function LoadingState() {
  return (
    <div
      role="status"
      className="card flex min-h-[40dvh] flex-col items-center justify-center gap-3"
    >
      <RefreshCw size={22} className="animate-spin text-muted" />

      <p className="text-sm text-muted">Loading analytics...</p>
    </div>
  );
}

// Shown once for a new user instead of many empty charts.
function NoDataState() {
  return (
    <div className="card px-5 py-10 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-panel bg-primary-subtle text-primary">
        <ChartNoAxesCombined size={24} />
      </div>

      <h2 className="mt-4 text-xl font-semibold text-ink">
        Nothing to analyse for this period yet
      </h2>

      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted">
        Analytics are built only from your own records. Record a study
        session, plan a task or add a mock test, then come back here.
      </p>

      <div className="mt-6 flex flex-col items-stretch justify-center gap-2 sm:flex-row sm:items-center">
        <Link to="/timer" className="btn btn-primary">
          Start studying
        </Link>

        <Link to="/tasks" className="btn btn-secondary">
          Add a task
        </Link>

        <Link to="/tests" className="btn btn-secondary">
          Add a mock test
        </Link>
      </div>
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
          result.reason?.message || `Unable to load ${key} analytics.`;
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

  // Which parts of the page have real records to show (display decisions only).
  const hasStudyData =
    Number(analytics.study?.summary?.totalStudySeconds) > 0 ||
    (analytics.study?.dailyStudy ?? []).some(
      (day) => Number(day.durationMinutes) > 0
    );

  const hasTaskData = Number(analytics.tasks?.summary?.totalTasks) > 0;
  const hasTestData = Number(analytics.tests?.summary?.totalTests) > 0;

  const hasAnyData = hasStudyData || hasTaskData || hasTestData;

  return (
    <PageContainer>
      <PageHeader
        title="Analytics"
        description="Understand your study patterns and progress from your recorded data."
      />

      <DateRangeSelector value={dateRange} onChange={handleDateRangeChange} />

      {/* Partial API error notice */}
      {hasAnyError && !loading && (
        <div
          role="alert"
          className="mt-4 rounded-panel border border-danger/30 bg-danger-subtle p-4"
        >
          <p className="text-sm font-medium text-ink">
            Some analytics could not be loaded.
          </p>

          <p className="mt-1 text-sm text-muted">
            Check your connection or try refreshing the data.
          </p>

          <button
            type="button"
            onClick={retryAnalytics}
            className="mt-2 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-ink underline underline-offset-4"
          >
            <RefreshCw size={14} />
            Retry
          </button>
        </div>
      )}

      {loading ? (
        <div className="mt-6">
          <LoadingState />
        </div>
      ) : !hasAnyError && !hasAnyData ? (
        <div className="mt-6">
          <NoDataState />
        </div>
      ) : (
        <>
          <div className="mt-4">
            <SectionNav />
          </div>

          <div className="mt-6 space-y-10">
            {/* Study analytics */}
            <AnalyticsSection
              id="study"
              title="Study"
              description="Recorded study time and subject-wise activity."
            >
              {errors.study ? (
                <SectionMessage
                  title="Study analytics unavailable"
                  message={errors.study}
                  error
                />
              ) : hasStudyData ? (
                <StudyAnalytics data={analytics.study} />
              ) : (
                <SectionMessage
                  title="No study sessions in this period"
                  message="Sessions you record with the timer or add manually will appear here."
                  action={<SectionLink to="/timer">Start studying</SectionLink>}
                />
              )}
            </AnalyticsSection>

            {/* Task analytics */}
            <AnalyticsSection
              id="tasks"
              title="Tasks"
              description="Task completion, workload and estimated versus recorded time."
            >
              {errors.tasks ? (
                <SectionMessage
                  title="Task analytics unavailable"
                  message={errors.tasks}
                  error
                />
              ) : hasTaskData ? (
                <TaskAnalytics data={analytics.tasks} />
              ) : (
                <SectionMessage
                  title="No tasks planned in this period"
                  message="Tasks with a planned date in this period will appear here."
                  action={<SectionLink to="/tasks">Plan a task</SectionLink>}
                />
              )}
            </AnalyticsSection>

            {/* Exam analytics */}
            <AnalyticsSection
              id="exams"
              title="Exams"
              description="Mock-test performance and subject-wise trends."
            >
              {errors.tests ? (
                <SectionMessage
                  title="Exam analytics unavailable"
                  message={errors.tests}
                  error
                />
              ) : hasTestData ? (
                <TestAnalytics data={analytics.tests} />
              ) : (
                <SectionMessage
                  title="No mock tests in this period"
                  message="Tests you record will appear here with their percentage and trend."
                  action={<SectionLink to="/tests">Add a mock test</SectionLink>}
                />
              )}
            </AnalyticsSection>

            {/* Study consistency heatmap */}
            <AnalyticsSection
              id="consistency"
              title="Study consistency"
              description="Your recorded study activity across calendar days."
            >
              {errors.heatmap ? (
                <SectionMessage
                  title="Study consistency unavailable"
                  message={errors.heatmap}
                  error
                />
              ) : analytics.heatmap && hasStudyData ? (
                <Heatmap data={analytics.heatmap} />
              ) : (
                <SectionMessage
                  title="No study activity to show yet"
                  message="Days with recorded study will appear on this calendar."
                />
              )}
            </AnalyticsSection>

            {/* Evidence-based insights */}
            <AnalyticsSection
              id="insights"
              title="Insights"
              description="Evidence-based observations from your recorded data."
            >
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
                  title="No insights yet"
                  message="Insights appear when there is enough recorded data."
                />
              )}
            </AnalyticsSection>
          </div>
        </>
      )}
    </PageContainer>
  );
}
