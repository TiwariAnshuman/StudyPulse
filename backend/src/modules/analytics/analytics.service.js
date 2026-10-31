
import mongoose from "mongoose";

import User from "../../models/User.js";
import Task from "../../models/Task.js";
import StudySession from "../StudySessions/studySession.model.js";
import TestResult from "../tests/test.model.js";

import {
  resolveAnalyticsDateRange,
} from "./utils/dateRange.js";

// --------------------------------------------------
// COMMON HELPERS
// --------------------------------------------------

const createServiceError = (
  message,
  statusCode = 400,
  code = "VALIDATION_ERROR"
) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.code = code;

  return error;
};

const round = (value, decimals = 2) => {
  const factor = 10 ** decimals;

  return (
    Math.round((value + Number.EPSILON) * factor) / factor
  );
};

const percentage = (numerator, denominator) => {
  if (!denominator || denominator <= 0) {
    return null;
  }

  return round((numerator / denominator) * 100);
};

// Get today's date in the user's timezone.
const getTodayInTimezone = (timezone) => {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone || "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const values = Object.fromEntries(
    parts.map(({ type, value }) => [type, value])
  );

  return `${values.year}-${values.month}-${values.day}`;
};

// Convert an existing Date into YYYY-MM-DD
// according to the user's timezone.
const getDateInTimezone = (date, timezone) => {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone || "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const values = Object.fromEntries(
    parts.map(({ type, value }) => [type, value])
  );

  return `${values.year}-${values.month}-${values.day}`;
};

// Add calendar days without using local machine timezone.
const addCalendarDays = (dateOnly, days) => {
  const [year, month, day] = dateOnly.split("-").map(Number);

  const date = new Date(0);

  date.setUTCFullYear(year, month - 1, day + days);
  date.setUTCHours(0, 0, 0, 0);

  return [
    date.getUTCFullYear(),
    String(date.getUTCMonth() + 1).padStart(2, "0"),
    String(date.getUTCDate()).padStart(2, "0"),
  ].join("-");
};

// Generate every calendar date in an inclusive range.
const getCalendarDays = (from, to) => {
  const days = [];

  let current = from;

  while (current <= to) {
    days.push(current);
    current = addCalendarDays(current, 1);
  }

  return days;
};

// --------------------------------------------------
// COMMON ANALYTICS CONTEXT
// --------------------------------------------------

const getAnalyticsContext = async ({
  ownerId,
  from,
  to,
}) => {
  if (!mongoose.Types.ObjectId.isValid(ownerId)) {
    throw createServiceError(
      "Authenticated user is invalid.",
      401,
      "UNAUTHORIZED"
    );
  }

  const user = await User.findById(ownerId).select(
    "timezone dailyTargetMinutes heatmapThresholds createdAt"
  );

  if (!user) {
    throw createServiceError(
      "User account was not found.",
      404,
      "USER_NOT_FOUND"
    );
  }

  const timezone = user.timezone || "Asia/Kolkata";

  const dateRange = resolveAnalyticsDateRange({
    from,
    to,
    timezone,
  });

  return {
    ownerId,
    user,
    timezone,
    today: getTodayInTimezone(timezone),

    from,
    to,

    startUtc: dateRange.startUtc,
    endUtcExclusive: dateRange.endUtcExclusive,

    days: getCalendarDays(from, to),
  };
};

// --------------------------------------------------
// 1. STUDY ANALYTICS
// --------------------------------------------------

export const getStudyAnalytics = async (params) => {
  const context = await getAnalyticsContext(params);

  const {
    ownerId,
    from,
    to,
    days,
    user,
    today,
    timezone,
  } = context;

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
      "sessionDate durationSeconds subjectNameSnapshot activityType taskId"
    )
    .lean();

  const dailyMap = new Map();
  const subjectMap = new Map();
  const activityMap = new Map();

  let totalSeconds = 0;

  for (const session of sessions) {
    const seconds = session.durationSeconds;

    totalSeconds += seconds;

    // Daily totals.
    const daily = dailyMap.get(session.sessionDate) || {
      date: session.sessionDate,
      durationSeconds: 0,
      sessionCount: 0,
    };

    daily.durationSeconds += seconds;
    daily.sessionCount += 1;

    dailyMap.set(session.sessionDate, daily);

    // Subject distribution.
    const subjectName =
      session.subjectNameSnapshot || "Unknown";

    subjectMap.set(
      subjectName,
      (subjectMap.get(subjectName) || 0) + seconds
    );

    // Activity distribution.
    const activityType =
      session.activityType || "Other";

    activityMap.set(
      activityType,
      (activityMap.get(activityType) || 0) + seconds
    );
  }

  const dailyStudy = days.map((date) => {
    const item = dailyMap.get(date);

    return {
      date,
      durationSeconds: item?.durationSeconds || 0,

      durationMinutes: round(
        (item?.durationSeconds || 0) / 60
      ),

      sessionCount: item?.sessionCount || 0,
    };
  });

  // Account creation date in user's local timezone.
  const accountCreatedDate = user.createdAt
    ? getDateInTimezone(user.createdAt, timezone)
    : from;

  // Available days exclude future dates and dates
  // before the account was created.
  const availableDays = days.filter((date) => {
    return (
      date <= today &&
      date >= accountCreatedDate
    );
  });

  const availableDayCount = availableDays.length;

  const availableDaySet = new Set(availableDays);

  // Count active days only within available days.
  const activeDays = dailyStudy.filter(
    (day) =>
      availableDaySet.has(day.date) &&
      day.durationSeconds > 0
  ).length;

  const dailyTargetMinutes = user.dailyTargetMinutes;

  const hasDailyTarget =
    Number.isInteger(dailyTargetMinutes) &&
    dailyTargetMinutes > 0;

  const targetEligibleDays = hasDailyTarget
    ? dailyStudy.filter(
        (day) =>
          availableDaySet.has(day.date) &&
          day.durationMinutes >= dailyTargetMinutes
      ).length
    : null;

  const targetAvailableDays = hasDailyTarget
    ? availableDayCount
    : null;

  // Subject distribution.
  const subjectDistribution = [
    ...subjectMap.entries(),
  ].map(([subject, seconds]) => ({
    subject,
    durationSeconds: seconds,
    durationMinutes: round(seconds / 60),
    percentage: percentage(seconds, totalSeconds),
  }));

  // Activity distribution.
  const activityDistribution = [
    ...activityMap.entries(),
  ].map(([activityType, seconds]) => ({
    activityType,
    durationSeconds: seconds,
    durationMinutes: round(seconds / 60),
    percentage: percentage(seconds, totalSeconds),
  }));

  // Session duration distribution.
  const sessionDurationDistribution = {
    under15Minutes: 0,
    from15To29Minutes: 0,
    from30To59Minutes: 0,
    from60To119Minutes: 0,
    from120Minutes: 0,
  };

  for (const session of sessions) {
    const minutes = session.durationSeconds / 60;

    if (minutes < 15) {
      sessionDurationDistribution.under15Minutes++;
    } else if (minutes < 30) {
      sessionDurationDistribution.from15To29Minutes++;
    } else if (minutes < 60) {
      sessionDurationDistribution.from30To59Minutes++;
    } else if (minutes < 120) {
      sessionDurationDistribution.from60To119Minutes++;
    } else {
      sessionDurationDistribution.from120Minutes++;
    }
  }

  return {
    range: {
      from,
      to,
      timezone,
      totalCalendarDays: days.length,
      availableDays: availableDayCount,
    },

    summary: {
      totalStudySeconds: totalSeconds,

      totalStudyMinutes: round(totalSeconds / 60),

      dailyAverageMinutes:
        availableDayCount > 0
          ? round(
              totalSeconds / 60 / availableDayCount
            )
          : 0,

      activeDayAverageMinutes:
        activeDays > 0
          ? round(
              totalSeconds / 60 / activeDays
            )
          : 0,

      activeDays,

      consistencyRate: percentage(
        activeDays,
        availableDayCount
      ),

      dailyTargetCompletionRate:
        targetEligibleDays !== null &&
        targetAvailableDays > 0
          ? percentage(
              targetEligibleDays,
              targetAvailableDays
            )
          : null,
    },

    dailyStudy,

    subjectDistribution,

    activityDistribution,

    sessionDurationDistribution,
  };
};

// --------------------------------------------------
// 2. TASK ANALYTICS
// --------------------------------------------------

export const getTaskAnalytics = async (params) => {
  const context = await getAnalyticsContext(params);

  const {
    ownerId,
    from,
    to,
    today,
  } = context;

  // Tasks planned in the selected date range.
  const tasks = await Task.find({
    ownerId,
    plannedDate: {
      $gte: from,
      $lte: to,
    },
  })
    .select(
      "title subjectId plannedDate dueDate estimateMinutes status"
    )
    .lean();

  const taskIds = tasks.map((task) => task._id);

  // Actual study time is counted only through linked sessions.
  const linkedSessions = taskIds.length
    ? await StudySession.aggregate([
        {
          $match: {
            ownerId: new mongoose.Types.ObjectId(ownerId),

            taskId: {
              $in: taskIds,
            },

            durationSeconds: {
              $gt: 0,
            },
          },
        },
        {
          $group: {
            _id: "$taskId",

            actualSeconds: {
              $sum: "$durationSeconds",
            },
          },
        },
      ])
    : [];

  const actualTimeMap = new Map(
    linkedSessions.map((item) => [
      String(item._id),
      item.actualSeconds,
    ])
  );

  const completedTasks = tasks.filter(
    (task) => task.status === "Completed"
  );

  const inProgressTasks = tasks.filter(
    (task) => task.status === "In progress"
  );

  const pendingTasks = tasks.filter(
    (task) => task.status === "To do"
  );

  const estimatedTasks = tasks.filter(
    (task) =>
      Number.isInteger(task.estimateMinutes) &&
      task.estimateMinutes > 0
  );

  const plannedMinutes = estimatedTasks.reduce(
    (total, task) => total + task.estimateMinutes,
    0
  );

  const completedPlannedMinutes = completedTasks.reduce(
    (total, task) => {
      return (
        total +
        (
          Number.isInteger(task.estimateMinutes)
            ? task.estimateMinutes
            : 0
        )
      );
    },
    0
  );

  const actualLinkedSeconds = tasks.reduce(
    (total, task) => {
      return (
        total +
        (actualTimeMap.get(String(task._id)) || 0)
      );
    },
    0
  );

  const tasksWithLinkedSessions = tasks.filter(
    (task) =>
      (actualTimeMap.get(String(task._id)) || 0) > 0
  );

  const estimateCoverageRate = percentage(
    estimatedTasks.length,
    tasks.length
  );

  // Completion by subject.
  const completionBySubjectMap = new Map();

  for (const task of tasks) {
    const subjectId = String(task.subjectId);

    const subject =
      completionBySubjectMap.get(subjectId) || {
        subjectId,
        totalTasks: 0,
        completedTasks: 0,
      };

    subject.totalTasks++;

    if (task.status === "Completed") {
      subject.completedTasks++;
    }

    completionBySubjectMap.set(subjectId, subject);
  }

  const completionBySubject = [
    ...completionBySubjectMap.values(),
  ].map((subject) => ({
    ...subject,

    completionRate: percentage(
      subject.completedTasks,
      subject.totalTasks
    ),
  }));

  // Overdue tasks are calculated dynamically.
  const overdueTasks = await Task.countDocuments({
    ownerId,

    dueDate: {
      $lt: today,
      $ne: null,
    },

    status: {
      $ne: "Completed",
    },
  });

  // Estimated versus actual linked time.
  const estimateVariance = estimatedTasks.map((task) => {
    const actualSeconds =
      actualTimeMap.get(String(task._id)) || 0;

    const actualMinutes = round(actualSeconds / 60);

    return {
      taskId: task._id,

      title: task.title,

      estimatedMinutes: task.estimateMinutes,

      actualLinkedMinutes: actualMinutes,

      varianceMinutes: round(
        actualMinutes - task.estimateMinutes
      ),
    };
  });

  return {
    range: {
      from,
      to,
      timezone: context.timezone,
    },

    summary: {
      totalTasks: tasks.length,

      completedTasks: completedTasks.length,

      pendingTasks: pendingTasks.length,

      inProgressTasks: inProgressTasks.length,

      completionRate: percentage(
        completedTasks.length,
        tasks.length
      ),

      overdueTasks,

      estimatedTaskCount: estimatedTasks.length,

      estimateCoverageRate,

      plannedWorkloadMinutes: plannedMinutes,

      completedWorkloadMinutes:
        completedPlannedMinutes,

      actualLinkedStudyMinutes: round(
        actualLinkedSeconds / 60
      ),

      tasksWithLinkedSessions:
        tasksWithLinkedSessions.length,
    },

    completionBySubject,

    estimateVariance,
  };
};

// --------------------------------------------------
// 3. TEST ANALYTICS
// --------------------------------------------------

const getTestPercentage = (test) => {
  if (
    !Number.isFinite(test.marksObtained) ||
    !Number.isFinite(test.maxMarks) ||
    test.maxMarks <= 0
  ) {
    return null;
  }

  return round(
    (test.marksObtained / test.maxMarks) * 100
  );
};

const getValidCounts = (counts) => {
  if (!counts || typeof counts !== "object") {
    return null;
  }

  const {
    correct,
    incorrect,
    unanswered,
  } = counts;

  const values = [
    correct,
    incorrect,
    unanswered,
  ];

  if (
    !values.every(
      (value) =>
        Number.isInteger(value) && value >= 0
    )
  ) {
    return null;
  }

  return {
    correct,
    incorrect,
    unanswered,
  };
};

export const getTestAnalytics = async (params) => {
  const context = await getAnalyticsContext(params);

  const {
    ownerId,
    from,
    to,
  } = context;

  const tests = await TestResult.find({
    ownerId,

    testDate: {
      $gte: from,
      $lte: to,
    },
  })
    .select(
      "name testDate marksObtained maxMarks examType scoringScheme counts durationMinutes subjectResults"
    )
    .sort({
      testDate: 1,
      createdAt: 1,
    })
    .lean();

  const testTrend = tests.map((test) => {
    const testPercentage = getTestPercentage(test);

    const counts = getValidCounts(test.counts);

    const attempted = counts
      ? counts.correct + counts.incorrect
      : null;

    const accuracy =
      attempted > 0
        ? percentage(counts.correct, attempted)
        : null;

    const totalQuestions = counts
      ? counts.correct +
        counts.incorrect +
        counts.unanswered
      : null;

    const attemptRate =
      totalQuestions > 0
        ? percentage(attempted, totalQuestions)
        : null;

    const timePerQuestion =
      Number.isInteger(test.durationMinutes) &&
      test.durationMinutes > 0 &&
      Number.isInteger(totalQuestions) &&
      totalQuestions > 0
        ? round(
            test.durationMinutes / totalQuestions,
            3
          )
        : null;

    return {
      testId: test._id,

      name: test.name,

      testDate: test.testDate,

      marksObtained: test.marksObtained,

      maxMarks: test.maxMarks,

      percentage: testPercentage,

      examType: test.examType || null,

      accuracy,

      attemptRate,

      durationMinutes: test.durationMinutes ?? null,

      totalQuestions,

      timePerQuestionMinutes: timePerQuestion,
    };
  });

  const validTests = testTrend.filter(
    (test) => test.percentage !== null
  );

  const latestTest =
    validTests.length > 0
      ? validTests[validTests.length - 1]
      : null;

  // Subject-wise trend from stored subject snapshots.
  const subjectMap = new Map();

  for (const test of tests) {
    if (!Array.isArray(test.subjectResults)) {
      continue;
    }

    for (const result of test.subjectResults) {
      if (
        !result ||
        typeof result.subjectName !== "string" ||
        !Number.isFinite(result.marksObtained) ||
        !Number.isFinite(result.maxMarks) ||
        result.maxMarks <= 0
      ) {
        continue;
      }

      const subjectName = result.subjectName;

      const subjectPercentage = round(
        (result.marksObtained / result.maxMarks) * 100
      );

      const entries =
        subjectMap.get(subjectName) || [];

      entries.push({
        testDate: test.testDate,
        percentage: subjectPercentage,
      });

      subjectMap.set(subjectName, entries);
    }
  }

  const subjectTrend = [
    ...subjectMap.entries(),
  ].map(([subject, results]) => ({
    subject,
    results,
  }));

  const accuracyValues = validTests
    .map((test) => test.accuracy)
    .filter((value) => value !== null);

  const attemptValues = validTests
    .map((test) => test.attemptRate)
    .filter((value) => value !== null);

  return {
    range: {
      from,
      to,
      timezone: context.timezone,
    },

    summary: {
      totalTests: tests.length,

      latestTest,

      averagePercentage:
        validTests.length > 0
          ? round(
              validTests.reduce(
                (total, test) =>
                  total + test.percentage,
                0
              ) / validTests.length
            )
          : null,

      averageAccuracy:
        accuracyValues.length > 0
          ? round(
              accuracyValues.reduce(
                (total, value) => total + value,
                0
              ) / accuracyValues.length
            )
          : null,

      averageAttemptRate:
        attemptValues.length > 0
          ? round(
              attemptValues.reduce(
                (total, value) => total + value,
                0
              ) / attemptValues.length
            )
          : null,
    },

    testTrend,

    subjectTrend,

    comparableScoreChange: null,

    comparableScoreChangeNote:
      "Comparable test format metadata is not available. Raw percentages are shown without an improvement or decline claim.",
  };
};

// --------------------------------------------------
// 4. HEATMAP ANALYTICS
// --------------------------------------------------

const getHeatmapLevel = (minutes, thresholds) => {
  if (minutes <= 0) {
    return 0;
  }

  if (minutes <= thresholds.level1MaxMinutes) {
    return 1;
  }

  if (minutes <= thresholds.level2MaxMinutes) {
    return 2;
  }

  if (minutes <= thresholds.level3MaxMinutes) {
    return 3;
  }

  return 4;
};

export const getHeatmapAnalytics = async (params) => {
  const context = await getAnalyticsContext(params);

  const {
    ownerId,
    from,
    to,
    days,
    today,
    user,
    timezone,
  } = context;

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
    .select("sessionDate durationSeconds")
    .lean();

  const dailyMap = new Map();

  for (const session of sessions) {
    const current =
      dailyMap.get(session.sessionDate) || {
        durationSeconds: 0,
        sessionCount: 0,
      };

    current.durationSeconds += session.durationSeconds;

    current.sessionCount++;

    dailyMap.set(session.sessionDate, current);
  }

  const thresholds = user.heatmapThresholds || {
    level1MaxMinutes: 29,
    level2MaxMinutes: 89,
    level3MaxMinutes: 179,
  };

  // Use actual account creation date, not today's date.
  const accountCreatedDate = user.createdAt
    ? getDateInTimezone(user.createdAt, timezone)
    : from;

  const cells = days.map((date) => {
    const data = dailyMap.get(date);

    let state;

    if (date > today) {
      state = "future";
    } else if (date < accountCreatedDate) {
      state = "unavailable";
    } else if (!data) {
      state = "no-entry";
    } else {
      state = "recorded";
    }

    const durationSeconds =
      data?.durationSeconds || 0;

    const durationMinutes = round(
      durationSeconds / 60
    );

    return {
      date,

      state,

      durationSeconds,

      durationMinutes,

      sessionCount: data?.sessionCount || 0,

      level:
        state === "recorded"
          ? getHeatmapLevel(
              durationMinutes,
              thresholds
            )
          : null,

      goalReached:
        Number.isInteger(user.dailyTargetMinutes) &&
        user.dailyTargetMinutes > 0 &&
        state === "recorded"
          ? durationMinutes >= user.dailyTargetMinutes
          : null,
    };
  });

  return {
    range: {
      from,
      to,
      timezone,
    },

    thresholds,

    cells,

    legend: [
      {
        level: 0,
        label: "No recorded time",
      },
      {
        level: 1,
        label: `1–${thresholds.level1MaxMinutes} minutes`,
      },
      {
        level: 2,
        label: `${thresholds.level1MaxMinutes + 1}–${thresholds.level2MaxMinutes} minutes`,
      },
      {
        level: 3,
        label: `${thresholds.level2MaxMinutes + 1}–${thresholds.level3MaxMinutes} minutes`,
      },
      {
        level: 4,
        label: `${thresholds.level3MaxMinutes + 1}+ minutes`,
      },
    ],
  };
};

// --------------------------------------------------
// 5. RULE-BASED INSIGHTS
// --------------------------------------------------

export const getInsightsAnalytics = async (params) => {
  const context = await getAnalyticsContext(params);

  const study = await getStudyAnalytics(params);

  const tasks = await getTaskAnalytics(params);

  const tests = await getTestAnalytics(params);

  const insights = [];

  // INS-01: Study pattern.
  // Requires at least 14 available days
  // and at least 5 active study days.
  if (
    study.range.availableDays >= 14 &&
    study.summary.activeDays >= 5
  ) {
    insights.push({
      ruleId: "INS-01",

      title: "Study activity recorded",

      observation:
        `${study.summary.activeDays} active study days were recorded in the selected period.`,

      dateWindow: {
        from: context.from,
        to: context.to,
      },

      sampleSize: study.range.availableDays,

      evidence: {
        activeDays: study.summary.activeDays,

        availableDays: study.range.availableDays,

        consistencyRate: study.summary.consistencyRate,
      },

      caveat:
        "This reflects saved study sessions, not every study activity.",
    });
  }

  // INS-02: Study sessions.
  if (
    study.summary.totalStudyMinutes >= 60 &&
    study.dailyStudy.reduce(
      (total, day) => total + day.sessionCount,
      0
    ) >= 5
  ) {
    const sessionCount = study.dailyStudy.reduce(
      (total, day) => total + day.sessionCount,
      0
    );

    insights.push({
      ruleId: "INS-02",

      title: "Study sessions recorded",

      observation:
        "At least five study sessions and sixty minutes of recorded study time are available.",

      dateWindow: {
        from: context.from,
        to: context.to,
      },

      sampleSize: sessionCount,

      evidence: {
        totalStudyMinutes:
          study.summary.totalStudyMinutes,

        sessionCount,
      },

      caveat:
        "The insight is based only on saved sessions.",
    });
  }

  // INS-03: Task estimates and linked sessions.
  if (
    tasks.summary.estimatedTaskCount >= 5 &&
    tasks.summary.tasksWithLinkedSessions >= 3
  ) {
    insights.push({
      ruleId: "INS-03",

      title: "Task effort data available",

      observation:
        "Several estimated tasks have linked study sessions.",

      dateWindow: {
        from: context.from,
        to: context.to,
      },

      sampleSize: tasks.summary.estimatedTaskCount,

      evidence: {
        estimatedTasks:
          tasks.summary.estimatedTaskCount,

        tasksWithLinkedSessions:
          tasks.summary.tasksWithLinkedSessions,
      },

      caveat:
        "Only explicitly linked sessions contribute to task actual time.",
    });
  }

  // INS-04 is withheld until comparable
  // test format metadata is available.
  //
  // INS-05 is withheld because reliable pre-test
  // subject windows are not yet established.

  // INS-06: Daily target tracking.
  if (
    Number.isInteger(context.user.dailyTargetMinutes) &&
    context.user.dailyTargetMinutes > 0 &&
    study.range.availableDays >= 7
  ) {
    insights.push({
      ruleId: "INS-06",

      title: "Daily study target tracking",

      observation:
        `${study.summary.dailyTargetCompletionRate ?? 0}% of available days reached the configured daily target.`,

      dateWindow: {
        from: context.from,
        to: context.to,
      },

      sampleSize: study.range.availableDays,

      evidence: {
        dailyTargetMinutes:
          context.user.dailyTargetMinutes,

        completionRate:
          study.summary.dailyTargetCompletionRate,

        availableDays:
          study.range.availableDays,
      },

      caveat:
        "This uses recorded study time and the saved daily target.",
    });
  }

  return {
    range: {
      from: context.from,
      to: context.to,
      timezone: context.timezone,
    },

    insights,
  };
};
