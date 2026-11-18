
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import MetricCard from "./MetricCard";
import ChartSummary from "./ChartSummary";
import {
  AXIS_TICK,
  CHART_ANIMATION,
  GRID_STROKE,
  TOOLTIP_STYLE,
} from "../chartTheme";
import {
  formatDurationFromMinutes,
  formatPercentage,
} from "../analytics.utils";

// Chart colours follow a calm, non-neon visual style.
const STATUS_COLORS = {
  Completed: "#426B57",
  "In progress": "#B7793E",
  "To do": "#8A948E",
};

function ChartCard({ title, description, children }) {
  return (
    <section className="rounded-panel border border-line bg-surface p-4 sm:p-5">
      <div className="mb-5">
        <h3 className="text-base font-semibold text-ink">
          {title}
        </h3>

        {description && (
          <p className="mt-1 text-sm text-muted">
            {description}
          </p>
        )}
      </div>

      {children}
    </section>
  );
}

function EmptyChart({ message }) {
  return (
    <div className="flex min-h-[160px] items-center justify-center rounded-control border border-dashed border-line px-5 text-center">
      <p className="max-w-xs text-sm text-muted">
        {message}
      </p>
    </div>
  );
}

function TaskAnalytics({ data }) {
  // Expected input: analytics API response's data property.
  const summary = data?.summary;
  const estimateVariance = Array.isArray(data?.estimateVariance)
    ? data.estimateVariance
    : [];

  if (!summary) {
    return (
      <section className="rounded-panel border border-line bg-surface p-6">
        <h2 className="text-xl font-semibold text-ink">
          Task Analytics
        </h2>

        <p className="mt-2 text-sm text-muted">
          Task analytics data is not available yet.
        </p>
      </section>
    );
  }

  const {
    totalTasks = 0,
    completedTasks = 0,
    pendingTasks = 0,
    inProgressTasks = 0,
    overdueTasks = 0,
    completionRate,
    plannedWorkloadMinutes = 0,
    completedWorkloadMinutes = 0,
    actualLinkedStudyMinutes = 0,
    estimatedTaskCount = 0,
    estimateCoverageRate,
    tasksWithLinkedSessions = 0,
  } = summary;

  const hasTasks = totalTasks > 0;

  const statusData = [
    {
      name: "Completed",
      value: completedTasks,
    },
    {
      name: "To do",
      value: pendingTasks,
    },
    {
      name: "In progress",
      value: inProgressTasks,
    },
  ].filter((item) => item.value > 0);

  const hasEstimateData = estimateVariance.length > 0;

  const estimateChartData = estimateVariance
    .slice(0, 8)
    .map((task) => ({
      name:
        task.title?.length > 15
          ? `${task.title.slice(0, 15)}…`
          : task.title || "Untitled task",
      fullName: task.title || "Untitled task",
      estimated: task.estimateMinutes ?? 0,
      actual: task.actualLinkedMinutes ?? 0,
    }));


  return (
    <section className="space-y-6">
      {/* Metric cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <MetricCard
          title="Total Tasks"
          value={hasTasks ? totalTasks : null}
          description="Tasks planned in this period"
          calculation="Count of tasks whose planned date falls within the selected date range."
        />

        <MetricCard
          title="Completion Rate"
          value={
            completionRate !== null &&
            completionRate !== undefined
              ? formatPercentage(completionRate)
              : null
          }
          description="Share of tasks marked completed"
          calculation="Completed tasks divided by total tasks in the selected period, multiplied by 100. Not available when there are no tasks."
        />

        <MetricCard
          title="Overdue Tasks"
          value={hasTasks ? overdueTasks : null}
          description="Tasks currently overdue"
          calculation="Count of tasks classified as overdue by the backend. Check the selected-period scope before interpreting this number."
        />

        <MetricCard
          title="Actual Linked Time"
          value={
            tasksWithLinkedSessions > 0
              ? formatDurationFromMinutes(actualLinkedStudyMinutes)
              : null
          }
          description="Study time linked to these tasks"
          calculation="Sum of valid study-session duration linked to the tasks. This is not necessarily all study time recorded in the selected period."
        />
      </div>

      {/* Status and workload charts */}
      {!hasTasks ? (
        <EmptyChart message="No tasks are available for this period. Create a task to start exploring your task analytics." />
      ) : (
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
          {/* Task status distribution */}
          <ChartCard
            title="Task Status Distribution"
            description="How your planned tasks are distributed by status."
          >
            {statusData.length === 0 ? (
              <EmptyChart message="There is no task status data to display." />
            ) : (
              <>
                <div className="h-[260px] w-full" aria-hidden="true">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie isAnimationActive={CHART_ANIMATION}
                        data={statusData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={68}
                        outerRadius={100}
                        paddingAngle={3}
                        stroke="none"
                      >
                        {statusData.map((entry) => (
                          <Cell
                            key={entry.name}
                            fill={STATUS_COLORS[entry.name]}
                          />
                        ))}
                      </Pie>

                      <Tooltip
                        contentStyle={TOOLTIP_STYLE}
                        formatter={(value, name) => [
                          `${value} tasks`,
                          name,
                        ]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="flex flex-wrap justify-center gap-x-5 gap-y-3">
                  {statusData.map((item) => (
                    <div
                      key={item.name}
                      className="flex items-center gap-2 text-sm"
                    >
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{
                          backgroundColor: STATUS_COLORS[item.name],
                        }}
                      />

                      <span className="text-muted">
                        {item.name}
                      </span>

                      <span className="font-medium text-ink">
                        {item.value}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </ChartCard>

          {/* Estimated vs actual */}
          <ChartCard
            title="Estimated vs Actual Time"
            description="Compare task estimates with linked study-session time."
          >
            {!hasEstimateData ? (
              <EmptyChart message="No tasks with time estimates are available for comparison." />
            ) : (
              <>
                <div
                  className="w-full"
                  style={{ height: Math.max(220, estimateChartData.length * 54 + 40) }}
                  aria-hidden="true"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      layout="vertical"
                      data={estimateChartData}
                      margin={{ top: 4, right: 12, left: 0, bottom: 4 }}
                      barGap={2}
                      barCategoryGap={10}
                    >
                      <CartesianGrid stroke={GRID_STROKE} strokeDasharray="3 3" horizontal={false} />
                      <XAxis type="number" tick={AXIS_TICK} tickLine={false} axisLine={false} unit="m" />
                      <YAxis type="category" dataKey="name" width={112} interval={0} tick={AXIS_TICK} tickLine={false} axisLine={false} />
                      <Tooltip
                        contentStyle={TOOLTIP_STYLE}
                        labelFormatter={(label, payload) => payload?.[0]?.payload?.fullName ?? label}
                        formatter={(value, name) => [
                          `${value} minutes`,
                          name === "estimated" ? "Estimated" : "Actual linked time",
                        ]}
                      />
                      <Bar isAnimationActive={CHART_ANIMATION} dataKey="estimated" name="Estimated" fill="#8A948E" radius={[0, 5, 5, 0]} maxBarSize={14} />
                      <Bar isAnimationActive={CHART_ANIMATION} dataKey="actual" name="Actual linked time" fill="#426B57" radius={[0, 5, 5, 0]} maxBarSize={14} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <ChartSummary
                  caption="Estimated and actual linked study time per task"
                  columns={["Task", "Estimated (minutes)", "Actual linked (minutes)"]}
                  rows={estimateChartData.map((task) => [task.fullName, task.estimated, task.actual])}
                />

                <div className="flex flex-wrap justify-center gap-5 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-sm bg-[#8A948E]" />
                    <span className="text-muted">
                      Estimated
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-sm bg-primary" />
                    <span className="text-muted">
                      Actual linked time
                    </span>
                  </div>
                </div>
              </>
            )}
          </ChartCard>
        </div>
      )}

      {/* Workload summary */}
      <ChartCard
        title="Workload Summary"
        description="Understand the difference between planned and completed workload."
      >
        {!hasTasks ? (
          <EmptyChart message="Workload information will appear after you create tasks." />
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div className="rounded-control bg-canvas p-4">
              <p className="text-sm text-muted">
                Planned Workload
              </p>

              <p className="mt-2 text-[25px] font-semibold text-ink">
                {formatDurationFromMinutes(plannedWorkloadMinutes)}
              </p>

              <p className="mt-1 text-xs text-muted">
                Sum of available task estimates
              </p>
            </div>

            <div className="rounded-control bg-canvas p-4">
              <p className="text-sm text-muted">
                Completed Workload
              </p>

              <p className="mt-2 text-[25px] font-semibold text-ink">
                {formatDurationFromMinutes(completedWorkloadMinutes)}
              </p>

              <p className="mt-1 text-xs text-muted">
                Estimated workload of completed tasks
              </p>
            </div>
          </div>
        )}

        {hasTasks && (
          <p className="mt-4 border-t border-line pt-4 text-sm text-muted">
            Tasks with linked study sessions:{" "}
            <strong className="font-semibold text-ink">{tasksWithLinkedSessions}</strong>
          </p>
        )}
      </ChartCard>

      {/* Data coverage note */}
      {estimatedTaskCount > 0 && (
        <p className="text-xs leading-relaxed text-muted">
          Time estimates are available for {estimatedTaskCount} tasks
          {estimateCoverageRate !== null &&
          estimateCoverageRate !== undefined
            ? ` (${formatPercentage(estimateCoverageRate)} coverage)`
            : ""}.
          Actual time represents linked study sessions only.
        </p>
      )}
    </section>
  );
}

export default TaskAnalytics;
