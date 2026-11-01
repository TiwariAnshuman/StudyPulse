
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

import {
  CheckCircle2,
  Clock3,
  ListTodo,
  Timer,
} from "lucide-react";

import MetricCard from "./MetricCard";
import {
  formatDurationFromMinutes,
  formatPercentage,
} from "../analytics.utils";

// Chart colours follow a calm, non-neon visual style.
const STATUS_COLORS = {
  Completed: "#16A34A",
  "To do": "#94A3B8",
  "In progress": "#D97706",
};

function ChartCard({ title, description, children }) {
  return (
    <section className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <div className="mb-5">
        <h3 className="text-base font-semibold text-foreground">
          {title}
        </h3>

        {description && (
          <p className="mt-1 text-sm text-muted-foreground">
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
    <div className="flex min-h-[240px] items-center justify-center rounded-lg border border-dashed border-border px-5 text-center">
      <p className="max-w-xs text-sm text-muted-foreground">
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
      <section className="rounded-xl border border-border bg-card p-6">
        <h2 className="text-lg font-semibold text-foreground">
          Task Analytics
        </h2>

        <p className="mt-2 text-sm text-muted-foreground">
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
        task.title?.length > 18
          ? `${task.title.slice(0, 18)}...`
          : task.title || "Untitled task",
      estimated: task.estimateMinutes ?? 0,
      actual: task.actualLinkedMinutes ?? 0,
    }));

  const tooltipStyle = {
    backgroundColor: "var(--tooltip-background, #ffffff)",
    border: "1px solid var(--border, #e5e7eb)",
    borderRadius: "10px",
    fontSize: "12px",
  };

  return (
    <section className="space-y-6">
      {/* Section heading */}
      <div>
        <h2 className="text-xl font-semibold tracking-tight text-foreground">
          Task Analytics
        </h2>

        <p className="mt-1 text-sm text-muted-foreground">
          Understand your task completion and planned workload.
        </p>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Total Tasks"
          value={hasTasks ? totalTasks : null}
          description="Tasks planned in this period"
          calculation="Count of tasks whose planned date falls within the selected date range."
          icon={ListTodo}
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
          icon={CheckCircle2}
        />

        <MetricCard
          title="Overdue Tasks"
          value={hasTasks ? overdueTasks : null}
          description="Tasks currently overdue"
          calculation="Count of tasks classified as overdue by the backend. Check the selected-period scope before interpreting this number."
          icon={Clock3}
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
          icon={Timer}
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
                <div className="h-[260px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
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
                        contentStyle={tooltipStyle}
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

                      <span className="text-muted-foreground">
                        {item.name}
                      </span>

                      <span className="font-medium text-foreground">
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
                <div className="h-[260px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={estimateChartData}
                      margin={{
                        top: 10,
                        right: 8,
                        left: -18,
                        bottom: 8,
                      }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                        stroke="var(--border, #e5e7eb)"
                      />

                      <XAxis
                        dataKey="name"
                        tick={{ fontSize: 11 }}
                        tickLine={false}
                        axisLine={false}
                      />

                      <YAxis
                        tick={{ fontSize: 11 }}
                        tickLine={false}
                        axisLine={false}
                        unit="m"
                      />

                      <Tooltip
                        contentStyle={tooltipStyle}
                        formatter={(value, name) => [
                          `${value} minutes`,
                          name === "estimated"
                            ? "Estimated"
                            : "Actual linked time",
                        ]}
                      />

                      <Bar
                        dataKey="estimated"
                        name="Estimated"
                        fill="#94A3B8"
                        radius={[5, 5, 0, 0]}
                      />

                      <Bar
                        dataKey="actual"
                        name="Actual linked time"
                        fill="#D97706"
                        radius={[5, 5, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="flex flex-wrap justify-center gap-5 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-sm bg-slate-400" />
                    <span className="text-muted-foreground">
                      Estimated
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-sm bg-amber-600" />
                    <span className="text-muted-foreground">
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
            <div className="rounded-lg bg-muted/50 p-4">
              <p className="text-sm text-muted-foreground">
                Planned Workload
              </p>

              <p className="mt-2 text-2xl font-semibold text-foreground">
                {formatDurationFromMinutes(plannedWorkloadMinutes)}
              </p>

              <p className="mt-1 text-xs text-muted-foreground">
                Sum of available task estimates
              </p>
            </div>

            <div className="rounded-lg bg-muted/50 p-4">
              <p className="text-sm text-muted-foreground">
                Completed Workload
              </p>

              <p className="mt-2 text-2xl font-semibold text-foreground">
                {formatDurationFromMinutes(completedWorkloadMinutes)}
              </p>

              <p className="mt-1 text-xs text-muted-foreground">
                Estimated workload of completed tasks
              </p>
            </div>
          </div>
        )}

        {hasTasks && (
          <div className="mt-5 grid grid-cols-2 gap-4 border-t border-border pt-5 sm:grid-cols-4">
            <div>
              <p className="text-xs text-muted-foreground">Completed</p>
              <p className="mt-1 text-lg font-semibold text-foreground">
                {completedTasks}
              </p>
            </div>

            <div>
              <p className="text-xs text-muted-foreground">To do</p>
              <p className="mt-1 text-lg font-semibold text-foreground">
                {pendingTasks}
              </p>
            </div>

            <div>
              <p className="text-xs text-muted-foreground">In progress</p>
              <p className="mt-1 text-lg font-semibold text-foreground">
                {inProgressTasks}
              </p>
            </div>

            <div>
              <p className="text-xs text-muted-foreground">With linked sessions</p>
              <p className="mt-1 text-lg font-semibold text-foreground">
                {tasksWithLinkedSessions}
              </p>
            </div>
          </div>
        )}
      </ChartCard>

      {/* Data coverage note */}
      {estimatedTaskCount > 0 && (
        <p className="text-xs leading-relaxed text-muted-foreground">
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
