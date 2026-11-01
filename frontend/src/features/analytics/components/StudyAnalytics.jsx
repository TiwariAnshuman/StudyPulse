
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import {
  BookOpen,
  CalendarCheck,
  Clock3,
  Target,
  TrendingUp,
  Users,
} from "lucide-react";

import MetricCard from "./MetricCard";
import {
  formatDurationFromMinutes,
  formatPercentage,
} from "../analytics.utils";

// Calm, consistent chart palette
const CHART_COLORS = [
  "#64748B",
  "#0D9488",
  "#D97706",
  "#6366F1",
  "#0891B2",
  "#8B5CF6",
];

const formatChartDate = (value) => {
  if (!value) return "";

  // Parse date-only values locally to avoid timezone shifts.
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day);

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
  });
};

const formatHours = (minutes) => {
  if (minutes === null || minutes === undefined) return "—";

  const hours = minutes / 60;

  return `${Number(hours.toFixed(1))}h`;
};

const ChartCard = ({ title, description, children, className = "" }) => (
  <section
    className={`rounded-xl border border-border bg-card p-5 shadow-sm ${className}`}
  >
    <div className="mb-5">
      <h3 className="text-base font-semibold text-foreground">{title}</h3>
      {description && (
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      )}
    </div>

    {children}
  </section>
);

const EmptyChart = ({ message = "Not enough study data for this period." }) => (
  <div className="flex min-h-[240px] items-center justify-center rounded-lg border border-dashed border-border px-5 text-center">
    <div>
      <BookOpen className="mx-auto mb-3 h-7 w-7 text-muted-foreground/60" />
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  </div>
);

const CustomTooltip = ({ active, payload, label, valueLabel = "Study time" }) => {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 shadow-lg">
      {label && (
        <p className="mb-1 text-xs text-muted-foreground">{label}</p>
      )}

      {payload.map((item, index) => (
        <p
          key={`${item.name}-${index}`}
          className="text-sm font-medium text-foreground"
        >
          {item.name ? `${item.name}: ` : `${valueLabel}: `}
          {item.value}
        </p>
      ))}
    </div>
  );
};

const StudyAnalytics = ({ data }) => {
  const summary = data?.summary ?? {};

  const dailyStudy = Array.isArray(data?.dailyStudy)
    ? data.dailyStudy
    : [];

  const subjectDistribution = Array.isArray(data?.subjectDistribution)
    ? data.subjectDistribution
    : [];

  const activityDistribution = Array.isArray(data?.activityDistribution)
    ? data.activityDistribution
    : [];

  const sessionDurationDistribution = data?.sessionDurationDistribution ?? {};

  const hasStudyData =
    Number(summary.totalStudySeconds) > 0 ||
    dailyStudy.some((item) => Number(item.durationMinutes) > 0);

  const hasSubjectData = subjectDistribution.length > 0;
  const hasActivityData = activityDistribution.length > 0;

  const sessionDurationData = [
    {
      label: "Under 15 min",
      count: sessionDurationDistribution.under15Minutes,
    },
    {
      label: "15–29 min",
      count: sessionDurationDistribution.from15To29Minutes,
    },
    {
      label: "30–59 min",
      count: sessionDurationDistribution.from30To59Minutes,
    },
    {
      label: "60–119 min",
      count: sessionDurationDistribution.from60To119Minutes,
    },
    {
      label: "120+ min",
      count: sessionDurationDistribution.from120Minutes,
    },
  ].map((item) => ({
    ...item,
    count: Number(item.count ?? 0),
  }));

  const hasSessionDurationData = sessionDurationData.some(
    (item) => item.count > 0
  );

  const metrics = [
    {
      title: "Total study time",
      value: hasStudyData
        ? formatDurationFromMinutes(summary.totalStudyMinutes)
        : "—",
      description: "Recorded study time in this period",
      calculation:
        "Sum of the duration of all valid study sessions within the selected date range.",
      icon: <Clock3 className="h-5 w-5" />,
    },
    {
      title: "Daily average",
      value: hasStudyData
        ? formatDurationFromMinutes(summary.dailyAverageMinutes)
        : "—",
      description: "Average across calendar days",
      calculation:
        "Total study time divided by the number of calendar days in the selected range.",
      icon: <TrendingUp className="h-5 w-5" />,
    },
    {
      title: "Active-day average",
      value:
        summary.activeDays > 0
          ? formatDurationFromMinutes(summary.activeDayAverageMinutes)
          : "—",
      description: "Average on days with recorded study",
      calculation:
        "Total study time divided by the number of days with recorded study sessions.",
      icon: <CalendarCheck className="h-5 w-5" />,
    },
    {
      title: "Active days",
      value: summary.activeDays ?? "—",
      description: "Days with recorded study sessions",
      calculation:
        "Count of calendar days that contain at least one recorded study session.",
      icon: <Users className="h-5 w-5" />,
    },
    {
      title: "Consistency rate",
      value:
        summary.consistencyRate !== null &&
        summary.consistencyRate !== undefined
          ? formatPercentage(summary.consistencyRate)
          : "—",
      description: "Study activity across the selected period",
      calculation:
        "The percentage of calendar days in the selected range that contain recorded study activity.",
      icon: <Target className="h-5 w-5" />,
    },
    {
      title: "Daily target completion",
      value:
        summary.dailyTargetCompletionRate !== null &&
        summary.dailyTargetCompletionRate !== undefined
          ? formatPercentage(summary.dailyTargetCompletionRate)
          : "—",
      description: "Days that reached the daily target",
      calculation:
        "The percentage of eligible days on which recorded study time reached the configured daily target. Unavailable when no target is configured.",
      icon: <Target className="h-5 w-5" />,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Study summary */}
      <section>
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-foreground">
            Study overview
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Understand how your study time is distributed across the selected
            period.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {metrics.map((metric) => (
            <MetricCard key={metric.title} {...metric} />
          ))}
        </div>
      </section>

      {/* Daily study trend */}
      <ChartCard
        title="Daily study trend"
        description="Your recorded study time day by day."
      >
        {hasStudyData && dailyStudy.length > 0 ? (
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={dailyStudy}
                margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
              >
                <defs>
                  <linearGradient
                    id="studyTimeGradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="0%"
                      stopColor="#0D9488"
                      stopOpacity={0.22}
                    />
                    <stop
                      offset="95%"
                      stopColor="#0D9488"
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>

                <CartesianGrid
                  stroke="var(--border)"
                  strokeDasharray="3 3"
                  vertical={false}
                />

                <XAxis
                  dataKey="date"
                  tickFormatter={formatChartDate}
                  tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
                  axisLine={false}
                  tickLine={false}
                  minTickGap={24}
                />

                <YAxis
                  tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(value) => `${value}m`}
                />

                <Tooltip
                  labelFormatter={formatChartDate}
                  formatter={(value) => [
                    formatDurationFromMinutes(value),
                    "Study time",
                  ]}
                  contentStyle={{
                    backgroundColor: "var(--card)",
                    border: "1px solid var(--border)",
                    borderRadius: "10px",
                    fontSize: "12px",
                  }}
                />

                <Area
                  type="monotone"
                  dataKey="durationMinutes"
                  name="Study time"
                  stroke="#0D9488"
                  strokeWidth={2.5}
                  fill="url(#studyTimeGradient)"
                  activeDot={{ r: 5 }}
                  connectNulls={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <EmptyChart message="No recorded study sessions for this date range." />
        )}
      </ChartCard>

      {/* Subject and activity distribution */}
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <ChartCard
          title="Subject distribution"
          description="How your recorded study time is divided between subjects."
        >
          {hasSubjectData ? (
            <>
              <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={subjectDistribution}
                      dataKey="durationMinutes"
                      nameKey="subject"
                      cx="50%"
                      cy="50%"
                      innerRadius={65}
                      outerRadius={95}
                      paddingAngle={3}
                    >
                      {subjectDistribution.map((item, index) => (
                        <Cell
                          key={`${item.subject}-${index}`}
                          fill={CHART_COLORS[index % CHART_COLORS.length]}
                        />
                      ))}
                    </Pie>

                    <Tooltip
                      formatter={(value, name) => [
                        formatDurationFromMinutes(value),
                        name,
                      ]}
                      contentStyle={{
                        backgroundColor: "var(--card)",
                        border: "1px solid var(--border)",
                        borderRadius: "10px",
                        fontSize: "12px",
                      }}
                    />

                    <Legend
                      verticalAlign="bottom"
                      iconType="circle"
                      wrapperStyle={{ fontSize: "12px" }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="mt-3 space-y-3">
                {subjectDistribution.map((item, index) => (
                  <div
                    key={`${item.subject}-${index}`}
                    className="flex items-center justify-between gap-3 text-sm"
                  >
                    <div className="flex min-w-0 items-center gap-2">
                      <span
                        className="h-2.5 w-2.5 shrink-0 rounded-full"
                        style={{
                          backgroundColor:
                            CHART_COLORS[index % CHART_COLORS.length],
                        }}
                      />
                      <span className="truncate text-foreground">
                        {item.subject}
                      </span>
                    </div>

                    <div className="shrink-0 text-right">
                      <span className="font-medium text-foreground">
                        {formatPercentage(item.percentage)}
                      </span>
                      <span className="ml-2 text-muted-foreground">
                        {formatDurationFromMinutes(item.durationMinutes)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <EmptyChart message="Subject distribution will appear after you record study sessions." />
          )}
        </ChartCard>

        <ChartCard
          title="Activity distribution"
          description="Study time grouped by the type of activity recorded."
        >
          {hasActivityData ? (
            <div className="space-y-5 pt-2">
              {activityDistribution.map((item, index) => (
                <div key={`${item.activityType}-${index}`}>
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <span className="text-sm font-medium capitalize text-foreground">
                      {String(item.activityType).replace(/[-_]/g, " ")}
                    </span>

                    <span className="text-sm text-muted-foreground">
                      {formatPercentage(item.percentage)}
                    </span>
                  </div>

                  <div className="h-2.5 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${Math.min(
                          100,
                          Math.max(0, Number(item.percentage) || 0)
                        )}%`,
                        backgroundColor:
                          CHART_COLORS[index % CHART_COLORS.length],
                      }}
                    />
                  </div>

                  <p className="mt-1.5 text-xs text-muted-foreground">
                    {formatDurationFromMinutes(item.durationMinutes)}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <EmptyChart message="Activity distribution will appear after you record study sessions." />
          )}
        </ChartCard>
      </div>

      {/* Session duration distribution */}
      <ChartCard
        title="Session duration distribution"
        description="Number of sessions grouped by their recorded duration."
      >
        {hasSessionDurationData ? (
          <div className="h-[260px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={sessionDurationData}
                margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
              >
                <CartesianGrid
                  stroke="var(--border)"
                  strokeDasharray="3 3"
                  vertical={false}
                />

                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                  axisLine={false}
                  tickLine={false}
                />

                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
                  axisLine={false}
                  tickLine={false}
                />

                <Tooltip
                  formatter={(value) => [value, "Sessions"]}
                  contentStyle={{
                    backgroundColor: "var(--card)",
                    border: "1px solid var(--border)",
                    borderRadius: "10px",
                    fontSize: "12px",
                  }}
                />

                <Bar
                  dataKey="count"
                  name="Sessions"
                  fill="#64748B"
                  radius={[5, 5, 0, 0]}
                  maxBarSize={48}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <EmptyChart message="Session duration data will appear after you save study sessions." />
        )}
      </ChartCard>
    </div>
  );
};

export default StudyAnalytics;
