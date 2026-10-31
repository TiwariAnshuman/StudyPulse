
import User from "../../models/User.js";
import Task from "../../models/Task.js";
import StudySession from "../StudySessions/studySession.model.js";

// Convert an instant into YYYY-MM-DD in the user's timezone.
const getLocalDate = (instant, timezone) => {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(instant);

  const values = Object.fromEntries(
    parts.map(({ type, value }) => [type, value])
  );

  return `${values.year}-${values.month}-${values.day}`;
};

// Generate inclusive available calendar dates.
// Dates before account creation and after local today are excluded.
const getAvailableDates = ({
  from,
  to,
  accountCreatedAt,
  timezone,
  today,
}) => {
  const accountCreatedDate = getLocalDate(
    accountCreatedAt,
    timezone
  );

  const startDate =
    from > accountCreatedDate ? from : accountCreatedDate;

  const endDate = to < today ? to : today;

  if (startDate > endDate) {
    return [];
  }

  const dates = [];

  const cursor = new Date(`${startDate}T00:00:00.000Z`);
  const end = new Date(`${endDate}T00:00:00.000Z`);

  while (cursor <= end) {
    dates.push(cursor.toISOString().slice(0, 10));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  return dates;
};

const round = (value, decimals = 1) => {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
};

const createInsight = ({
  ruleId,
  title,
  observation,
  from,
  to,
  sampleSize,
  evidence,
  caveat,
}) => ({
  ruleId,
  title,
  observation,
  window: {
    from,
    to,
  },
  sampleSize,
  evidence,
  caveat,
});

// Main rule-based insights service.
export const getInsights = async (
  ownerId,
  { from, to }
) => {
  const user = await User.findById(ownerId).select(
    "timezone createdAt dailyTargetMinutes"
  );

  if (!user) {
    const error = new Error("User account was not found.");
    error.statusCode = 404;
    error.code = "USER_NOT_FOUND";
    throw error;
  }

  const timezone = user.timezone || "Asia/Kolkata";

  const today = getLocalDate(new Date(), timezone);

  const availableDates = getAvailableDates({
    from,
    to,
    accountCreatedAt: user.createdAt,
    timezone,
    today,
  });

  const sessions = await StudySession.find({
    ownerId,
    sessionDate: {
      $gte: from,
      $lte: to,
    },
    durationSeconds: {
      $gt: 0,
    },
  })
    .select(
      "sessionDate durationSeconds subjectNameSnapshot taskId activityType"
    )
    .lean();

  const insights = [];

  // Group valid session data by local calendar date.
  const dailyStudy = new Map();

  for (const session of sessions) {
    const current = dailyStudy.get(session.sessionDate) || {
      durationSeconds: 0,
      sessionCount: 0,
    };

    current.durationSeconds += session.durationSeconds;
    current.sessionCount += 1;

    dailyStudy.set(session.sessionDate, current);
  }

  const activeDays = [...dailyStudy.entries()]
    .filter(([, value]) => value.durationSeconds > 0)
    .length;

  const totalRecordedSeconds = sessions.reduce(
    (total, session) => total + session.durationSeconds,
    0
  );

  // --------------------------------------------------
  // INS-01: Study pattern
  // Minimum: 14 available days, 5 active days,
  // and an exactly 30-calendar-day selected window.
  // --------------------------------------------------

  const selectedRangeDays =
    Math.round(
      (
        new Date(`${to}T00:00:00.000Z`).getTime() -
        new Date(`${from}T00:00:00.000Z`).getTime()
      ) / 86400000
    ) + 1;

  if (
    selectedRangeDays === 30 &&
    availableDates.length >= 14 &&
    activeDays >= 5
  ) {
    insights.push(
      createInsight({
        ruleId: "INS-01",
        title: "Your study pattern",
        observation:
          `You recorded study sessions on ${activeDays} of ${availableDates.length} available days.`,
        from,
        to,
        sampleSize: {
          availableDays: availableDates.length,
          activeDays,
          sessions: sessions.length,
        },
        evidence: {
          activeDays,
          availableDays: availableDates.length,
          totalStudyMinutes: round(
            totalRecordedSeconds / 60
          ),
        },
        caveat:
          "Unlogged study may be missing from these records.",
      })
    );
  }

  // --------------------------------------------------
  // INS-02: Subject allocation
  // Minimum: 5 sessions and 60 recorded minutes.
  // --------------------------------------------------

  if (
    sessions.length >= 5 &&
    totalRecordedSeconds >= 60 * 60
  ) {
    const subjectTotals = new Map();

    for (const session of sessions) {
      const subjectName =
        session.subjectNameSnapshot || "Unknown subject";

      subjectTotals.set(
        subjectName,
        (subjectTotals.get(subjectName) || 0) +
          session.durationSeconds
      );
    }

    const subjectAllocation = [...subjectTotals.entries()]
      .map(([subjectName, durationSeconds]) => ({
        subjectName,
        durationSeconds,
        percentage:
          (durationSeconds / totalRecordedSeconds) * 100,
      }))
      .sort(
        (a, b) => b.durationSeconds - a.durationSeconds
      );

    const topSubject = subjectAllocation[0];

    insights.push(
      createInsight({
        ruleId: "INS-02",
        title: "Subject time allocation",
        observation:
          `${topSubject.subjectName} accounted for ${round(topSubject.percentage)}% of your recorded study time.`,
        from,
        to,
        sampleSize: {
          sessions: sessions.length,
          recordedMinutes: round(
            totalRecordedSeconds / 60
          ),
          subjects: subjectAllocation.length,
        },
        evidence: {
          subjectName: topSubject.subjectName,
          subjectMinutes: round(
            topSubject.durationSeconds / 60
          ),
          subjectPercentage: round(
            topSubject.percentage
          ),
          totalRecordedMinutes: round(
            totalRecordedSeconds / 60
          ),
        },
        caveat:
          "Time allocation describes recorded effort, not subject mastery.",
      })
    );
  }

  // --------------------------------------------------
  // INS-03: Estimate variance
  // Minimum: 5 estimated tasks and 3 tasks
  // with linked study sessions in the selected range.
  // --------------------------------------------------

  const estimatedTasks = await Task.find({
    ownerId,
    plannedDate: {
      $gte: from,
      $lte: to,
    },
    estimateMinutes: {
      $gt: 0,
    },
  })
    .select("_id title estimateMinutes")
    .lean();

  if (estimatedTasks.length >= 5) {
    const taskIds = estimatedTasks.map((task) => task._id);

    const linkedSessions = await StudySession.find({
      ownerId,
      taskId: {
        $in: taskIds,
      },
      sessionDate: {
        $gte: from,
        $lte: to,
      },
      durationSeconds: {
        $gt: 0,
      },
    })
      .select("taskId durationSeconds")
      .lean();

    const actualSecondsByTask = new Map();

    for (const session of linkedSessions) {
      const taskId = session.taskId?.toString();

      if (!taskId) continue;

      actualSecondsByTask.set(
        taskId,
        (actualSecondsByTask.get(taskId) || 0) +
          session.durationSeconds
      );
    }

    const tasksWithLinkedSessions = estimatedTasks.filter(
      (task) =>
        actualSecondsByTask.has(task._id.toString())
    );

    if (tasksWithLinkedSessions.length >= 3) {
      const totalEstimatedMinutes =
        tasksWithLinkedSessions.reduce(
          (total, task) => total + task.estimateMinutes,
          0
        );

      const totalActualMinutes =
        tasksWithLinkedSessions.reduce(
          (total, task) =>
            total +
            actualSecondsByTask.get(task._id.toString()) / 60,
          0
        );

      const variancePercentage =
        (
          (totalActualMinutes - totalEstimatedMinutes) /
          totalEstimatedMinutes
        ) * 100;

      const direction =
        variancePercentage > 0
          ? "above"
          : variancePercentage < 0
            ? "below"
            : "equal to";

      insights.push(
        createInsight({
          ruleId: "INS-03",
          title: "Estimated vs recorded time",
          observation:
            `For tasks with linked sessions, recorded time was ${round(Math.abs(variancePercentage))}% ${direction} the combined estimate.`,
          from,
          to,
          sampleSize: {
            estimatedTasks: estimatedTasks.length,
            tasksWithLinkedSessions:
              tasksWithLinkedSessions.length,
          },
          evidence: {
            estimatedTasks: estimatedTasks.length,
            tasksWithLinkedSessions:
              tasksWithLinkedSessions.length,
            estimatedMinutes: round(
              totalEstimatedMinutes
            ),
            actualRecordedMinutes: round(
              totalActualMinutes
            ),
            variancePercentage: round(
              variancePercentage
            ),
          },
          caveat:
            "This comparison uses only tasks with estimates and linked sessions in the selected date range. A positive variance does not imply poor planning.",
        })
      );
    }
  }

  // --------------------------------------------------
  // INS-06: Goal recording
  // Minimum: target configured and 7 available days.
  // --------------------------------------------------

  const dailyTargetMinutes = user.dailyTargetMinutes;

  if (
    Number.isInteger(dailyTargetMinutes) &&
    dailyTargetMinutes > 0 &&
    availableDates.length >= 7
  ) {
    const daysMeetingTarget = availableDates.filter(
      (date) => {
        const day = dailyStudy.get(date);

        return (
          day &&
          day.durationSeconds >= dailyTargetMinutes * 60
        );
      }
    ).length;

    insights.push(
      createInsight({
        ruleId: "INS-06",
        title: "Daily study target",
        observation:
          `You recorded at least your daily target on ${daysMeetingTarget} of ${availableDates.length} available days.`,
        from,
        to,
        sampleSize: {
          availableDays: availableDates.length,
          targetMinutes: dailyTargetMinutes,
        },
        evidence: {
          dailyTargetMinutes,
          daysMeetingTarget,
          availableDays: availableDates.length,
        },
        caveat:
          "This reflects recorded study sessions. Unlogged study time is not included.",
      })
    );
  }

  return {
    range: {
      from,
      to,
      timezone,
    },
    items: insights,
  };
};
