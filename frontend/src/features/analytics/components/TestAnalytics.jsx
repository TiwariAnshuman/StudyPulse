
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

import {
  BookOpenCheck,
  Target,
  TrendingUp,
  ClipboardCheck,
} from "lucide-react";

import MetricCard from "./MetricCard";
import { formatPercentage } from "../analytics.utils";

const ChartCard = ({ title, description, children }) => (
  <section className="rounded-xl border border-border bg-card p-5 shadow-sm">
    <div className="mb-5">
      <h3 className="text-base font-semibold text-foreground">{title}</h3>
      {description && (
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      )}
    </div>
    {children}
  </section>
);

const EmptyChart = ({ message }) => (
  <div className="flex min-h-[240px] items-center justify-center rounded-lg border border-dashed border-border px-5 text-center">
    <div>
      <BookOpenCheck className="mx-auto mb-3 h-7 w-7 text-muted-foreground/60" />
      <p className="text-sm text-muted-foreground">{message}</p>
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
      icon: <ClipboardCheck className="h-5 w-5" />,
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
      icon: <TrendingUp className="h-5 w-5" />,
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
      icon: <Target className="h-5 w-5" />,
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
      icon: <BookOpenCheck className="h-5 w-5" />,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Overview */}
      <section>
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-foreground">
            Exam performance
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Review your recorded mock-test results and performance patterns.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
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
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={testTrend}
                margin={{ top: 10, right: 10, left: -15, bottom: 5 }}
              >
                <CartesianGrid
                  stroke="var(--border)"
                  strokeDasharray="3 3"
                  vertical={false}
                />

                <XAxis
                  dataKey="date"
                  tickFormatter={formatTestDate}
                  tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
                  axisLine={false}
                  tickLine={false}
                  minTickGap={24}
                />

                <YAxis
                  domain={[0, 100]}
                  tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
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
                  contentStyle={{
                    backgroundColor: "var(--card)",
                    border: "1px solid var(--border)",
                    borderRadius: "10px",
                    fontSize: "12px",
                  }}
                />

                <Line
                  type="monotone"
                  dataKey="percentage"
                  name="Test percentage"
                  stroke="#0D9488"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: "#0D9488" }}
                  activeDot={{ r: 6 }}
                  connectNulls={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <EmptyChart message="Your test score trend will appear after you record mock-test results." />
        )}
      </ChartCard>

      {/* Subject-wise performance */}
      <ChartCard
        title="Subject-wise performance"
        description="Compare recorded performance across subjects."
      >
        {hasTestData && subjectTrend.length > 0 ? (
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={subjectTrend}
                layout="vertical"
                margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
              >
                <CartesianGrid
                  stroke="var(--border)"
                  strokeDasharray="3 3"
                  horizontal={false}
                />

                <XAxis
                  type="number"
                  domain={[0, 100]}
                  tickFormatter={(value) => `${value}%`}
                  tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
                  axisLine={false}
                  tickLine={false}
                />

                <YAxis
                  type="category"
                  dataKey="subject"
                  width={90}
                  tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
                  axisLine={false}
                  tickLine={false}
                />

                <Tooltip
                  formatter={(value) => [
                    formatPercentage(value),
                    "Performance",
                  ]}
                  contentStyle={{
                    backgroundColor: "var(--card)",
                    border: "1px solid var(--border)",
                    borderRadius: "10px",
                    fontSize: "12px",
                  }}
                />

                <Bar
                  dataKey="percentage"
                  name="Subject percentage"
                  fill="#64748B"
                  radius={[0, 5, 5, 0]}
                  maxBarSize={28}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <EmptyChart message="Subject-wise performance will appear when valid subject test results are available." />
        )}
      </ChartCard>

      {/* Comparable test information */}
      <ChartCard
        title="Comparable test performance"
        description="Score changes are shown only when the tests can be fairly compared."
      >
        {summary.comparableScoreChange !== null &&
        summary.comparableScoreChange !== undefined ? (
          <div className="rounded-lg border border-border bg-muted/30 p-4">
            <p className="text-2xl font-semibold text-foreground">
              {summary.comparableScoreChange > 0 ? "+" : ""}
              {summary.comparableScoreChange}%
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Change between comparable tests
            </p>
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-border p-4">
            <p className="text-sm font-medium text-foreground">
              Comparison is currently unavailable
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
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
