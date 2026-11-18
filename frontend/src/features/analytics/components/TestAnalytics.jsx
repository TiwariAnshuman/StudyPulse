
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Bar,
  BarChart,
} from "recharts";

import { BookOpenCheck } from "lucide-react";

import MetricCard from "./MetricCard";
import ChartSummary from "./ChartSummary";
import {
  AXIS_TICK,
  CHART_ANIMATION,
  GRID_STROKE,
  TOOLTIP_STYLE,
} from "../chartTheme";
import { formatPercentage } from "../analytics.utils";

const ChartCard = ({ title, description, children }) => (
  <section className="rounded-panel border border-line bg-surface p-4 sm:p-5">
    <div className="mb-5">
      <h3 className="text-base font-semibold text-ink">{title}</h3>
      {description && (
        <p className="mt-1 text-sm text-muted">{description}</p>
      )}
    </div>
    {children}
  </section>
);

const EmptyChart = ({ message }) => (
  <div className="flex min-h-[160px] items-center justify-center rounded-control border border-dashed border-line px-5 text-center">
    <div>
      <BookOpenCheck className="mx-auto mb-3 h-7 w-7 text-muted" />
      <p className="text-sm text-muted">{message}</p>
    </div>
  </div>
);

const formatTestDate = (value) => {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return String(value);

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
  });
};

const TestAnalytics = ({ data }) => {
  const summary = data?.summary ?? {};
  const latestTest = summary.latestTest ?? null;

  const testTrend = Array.isArray(data?.testTrend)
    ? data.testTrend
    : [];

  const subjectTrend = Array.isArray(data?.subjectTrend)
    ? data.subjectTrend
    : [];

  const hasTestData = Number(summary.totalTests) > 0;

  // Keep unavailable values as null rather than converting them to zero.
  const metrics = [
    {
      title: "Latest test",
      value:
        latestTest?.percentage !== null &&
        latestTest?.percentage !== undefined
          ? formatPercentage(latestTest.percentage)
          : "—",
      description: latestTest?.testName
        ? `${latestTest.testName}${
            latestTest.testDate
              ? ` · ${formatTestDate(latestTest.testDate)}`
              : ""
          }`
        : "Most recently recorded test",
      calculation:
        "Percentage calculated from the latest recorded test using its saved marks and maximum marks.",
    },
    {
      title: "Average percentage",
      value:
        summary.averagePercentage !== null &&
        summary.averagePercentage !== undefined
          ? formatPercentage(summary.averagePercentage)
          : "—",
      description: "Average across recorded tests",
      calculation:
        "Average percentage of valid recorded tests in the selected date range.",
    },
    {
      title: "Average accuracy",
      value:
        summary.averageAccuracy !== null &&
        summary.averageAccuracy !== undefined
          ? formatPercentage(summary.averageAccuracy)
          : "—",
      description: "Correct answers among attempted questions",
      calculation:
        "Accuracy is based on valid correct and attempted question counts. It is unavailable when the required counts are missing or invalid.",
    },
    {
      title: "Average attempt rate",
      value:
        summary.averageAttemptRate !== null &&
        summary.averageAttemptRate !== undefined
          ? formatPercentage(summary.averageAttemptRate)
          : "—",
      description: "Questions attempted out of total questions",
      calculation:
        "Attempt rate is based on attempted questions divided by total questions, where valid question counts are available.",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Overview */}
      <section aria-label="Exam summary">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {metrics.map((metric) => (
            <MetricCard key={metric.title} {...metric} />
          ))}
        </div>
      </section>

      {/* Test score trend */}
      <ChartCard
        title="Test score trend"
        description="Percentage recorded in each test over the selected period."
      >
        {hasTestData && testTrend.length > 0 ? (
          <div className="h-[280px] w-full" aria-hidden="true">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={testTrend}
                margin={{ top: 10, right: 10, left: -15, bottom: 5 }}
              >
                <CartesianGrid
                  stroke={GRID_STROKE}
                  strokeDasharray="3 3"
                  vertical={false}
                />

                <XAxis
                  dataKey="date"
                  tickFormatter={formatTestDate}
                  tick={AXIS_TICK}
                  axisLine={false}
                  tickLine={false}
                  minTickGap={24}
                />

                <YAxis
                  domain={[0, 100]}
                  tick={AXIS_TICK}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(value) => `${value}%`}
                />

                <Tooltip
                  labelFormatter={formatTestDate}
                  formatter={(value) => [
                    formatPercentage(value),
                    "Percentage",
                  ]}
                  contentStyle={TOOLTIP_STYLE}
                />

                <Line isAnimationActive={CHART_ANIMATION}
                  type="monotone"
                  dataKey="percentage"
                  name="Test percentage"
                  stroke="#426B57"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: "#426B57" }}
                  activeDot={{ r: 6 }}
                  connectNulls={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <EmptyChart message="Your test score trend will appear after you record mock-test results." />
        )}

        {hasTestData && testTrend.length > 0 && (
          <ChartSummary
            caption="Percentage in each recorded test"
            columns={["Test date", "Percentage"]}
            rows={testTrend.map((test) => [formatTestDate(test.date), formatPercentage(test.percentage)])}
          />
        )}
      </ChartCard>

      {/* Subject-wise performance */}
      <ChartCard
        title="Subject-wise performance"
        description="Compare recorded performance across subjects."
      >
        {hasTestData && subjectTrend.length > 0 ? (
          <div className="h-[280px] w-full" aria-hidden="true">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={subjectTrend}
                layout="vertical"
                margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
              >
                <CartesianGrid
                  stroke={GRID_STROKE}
                  strokeDasharray="3 3"
                  horizontal={false}
                />

                <XAxis
                  type="number"
                  domain={[0, 100]}
                  tickFormatter={(value) => `${value}%`}
                  tick={AXIS_TICK}
                  axisLine={false}
                  tickLine={false}
                />

                <YAxis
                  type="category"
                  dataKey="subject"
                  width={90}
                  tick={AXIS_TICK}
                  axisLine={false}
                  tickLine={false}
                />

                <Tooltip
                  formatter={(value) => [
                    formatPercentage(value),
                    "Performance",
                  ]}
                  contentStyle={TOOLTIP_STYLE}
                />

                <Bar isAnimationActive={CHART_ANIMATION}
                  dataKey="percentage"
                  name="Subject percentage"
                  fill="#426B57"
                  radius={[0, 5, 5, 0]}
                  maxBarSize={28}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <EmptyChart message="Subject-wise performance will appear when valid subject test results are available." />
        )}

        {hasTestData && subjectTrend.length > 0 && (
          <ChartSummary
            caption="Percentage by subject"
            columns={["Subject", "Percentage"]}
            rows={subjectTrend.map((item) => [item.subject, formatPercentage(item.percentage)])}
          />
        )}
      </ChartCard>

      {/* Comparable test information */}
      <ChartCard
        title="Comparable test performance"
        description="Score changes are shown only when the tests can be fairly compared."
      >
        {summary.comparableScoreChange !== null &&
        summary.comparableScoreChange !== undefined ? (
          <div className="rounded-control border border-line bg-canvas p-4">
            <p className="text-[25px] font-semibold text-ink">
              {summary.comparableScoreChange > 0 ? "+" : ""}
              {summary.comparableScoreChange}%
            </p>
            <p className="mt-1 text-sm text-muted">
              Change between comparable tests
            </p>
          </div>
        ) : (
          <div className="rounded-control border border-dashed border-line p-4">
            <p className="text-sm font-medium text-ink">
              Comparison is currently unavailable
            </p>
            <p className="mt-1 text-sm text-muted">
              {summary.comparableScoreChangeNote ||
                "More comparable test records are needed before a score change can be calculated."}
            </p>
          </div>
        )}
      </ChartCard>
    </div>
  );
};

export default TestAnalytics;
