import User from "../../models/User.js";
import Subject from "../../models/Subject.js";
import Task from "../../models/Task.js";

import StudySession from "../StudySessions/studySession.model.js";
import ActiveTimer from "../studyTimer/activeTimer.model.js";
import TestResult from "../tests/test.model.js";

const DEFAULT_TIMEZONE = "Asia/Kolkata";

// ---------------------------------------------
// DATE HELPERS
// ---------------------------------------------

const getDateInTimezone = (date, timezone) => {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const values = Object.fromEntries(
    parts.map(({ type, value }) => [type, value])
  );

  return `${values.year}-${values.month}-${values.day}`;
};

const addCalendarDays = (dateOnly, amount) => {
  const [year, month, day] = dateOnly.split("-").map(Number);

  const date = new Date(0);

  date.setUTCFullYear(year, month - 1, day + amount);
  date.setUTCHours(0, 0, 0, 0);

  return [
    date.getUTCFullYear(),
    String(date.getUTCMonth() + 1).padStart(2, "0"),
    String(date.getUTCDate()).padStart(2, "0"),
  ].join("-");
};

const getCalendarDays = (from, to) => {
  const days = [];

  let current = from;

  while (current <= to) {
    days.push(current);
    current = addCalendarDays(current, 1);
  }

  return days;
};

const roundMinutes = (seconds) => {
  return Math.round((seconds / 60) * 100) / 100;
};

// ---------------------------------------------
// ACTIVE TIMER SUMMARY
// ---------------------------------------------

const getTimerSummary = (timer) => {
  if (!timer) {
    return null;
  }

  let elapsedSeconds = timer.accumulatedSeconds || 0;

  if (
    timer.status === "running" &&
    timer.runningSince
  ) {
    const currentRunningSeconds = Math.max(
      0,
      Math.floor(
        (Date.now() - new Date(timer.runningSince).getTime()) /
          1000
      )
    );

    elapsedSeconds += currentRunningSeconds;
  }

  return {
    id: timer._id,
    status: timer.status,
    subjectId: timer.subjectId,
    subjectName: timer.subjectNameSnapshot,
    taskId: timer.taskId,
    taskTitle: timer.taskTitleSnapshot,
    activityType: timer.activityType,
    startAt: timer.startAt,
    runningSince: timer.runningSince,
    elapsedSeconds,
  };
};

// ---------------------------------------------
// MAIN DASHBOARD SERVICE
// ---------------------------------------------

export const getDashboard = async (ownerId) => {
  // 1. Get user preferences.
  const user = await User.findById(ownerId)
    .select("timezone dailyTargetMinutes createdAt")
    .lean();

  if (!user) {
    const error = new Error("User account was not found.");
    error.statusCode = 404;
    error.code = "USER_NOT_FOUND";
    throw error;
  }

  const timezone = user.timezone || DEFAULT_TIMEZONE;
  const today = getDateInTimezone(new Date(), timezone);

  const weekStart = addCalendarDays(today, -6);
  const weekDays = getCalendarDays(weekStart, today);

  // 2. Fetch dashboard data in parallel.
  const [
    todayTasks,
    todaySessions,
    weeklySessions,
    recentSessions,
    activeTimer,
    latestTest,
    subjectCount,
    firstTask,
    firstSession,
    firstTest,
  ] = await Promise.all([
    // Today's tasks.
    Task.find({
      ownerId,
      plannedDate: today,
    })
      .select("title subjectId plannedDate priority status dueDate")
      .populate("subjectId", "name color")
      .sort({ priority: -1, createdAt: 1 })
      .lean(),

    // Today's recorded study sessions.
    StudySession.find({
      ownerId,
      sessionDate: today,
      durationSeconds: { $gt: 0 },
    })
      .select("durationSeconds")
      .lean(),

    // Last seven calendar days of study sessions.
    StudySession.find({
      ownerId,
      sessionDate: {
        $gte: weekStart,
        $lte: today,
      },
      durationSeconds: { $gt: 0 },
    })
      .select(
        "durationSeconds sessionDate subjectNameSnapshot"
      )
      .lean(),

    // Five most recent sessions.
    StudySession.find({ ownerId })
      .select(
        "subjectNameSnapshot taskTitleSnapshot activityType startAt endAt durationSeconds sessionDate"
      )
      .sort({ startAt: -1 })
      .limit(5)
      .lean(),

    // Current active timer.
    ActiveTimer.findOne({ ownerId }).lean(),

    // Latest test with a valid percentage.
    TestResult.findOne({
      ownerId,
      marksObtained: { $gte: 0 },
      maxMarks: { $gt: 0 },
    })
      .select(
        "name testDate marksObtained maxMarks examType"
      )
      .sort({ testDate: -1, createdAt: -1 })
      .lean(),

    // Active subjects for onboarding checklist.
    Subject.countDocuments({
      ownerId,
      archivedAt: null,
    }),

    // Has the user created at least one task?
    Task.exists({ ownerId }),

    // Has the user recorded at least one session?
    StudySession.exists({ ownerId }),

    // Has the user recorded at least one test?
    TestResult.exists({ ownerId }),
  ]);

  // ---------------------------------------------
  // TODAY'S TASK SUMMARY
  // ---------------------------------------------

  const taskSummary = {
    total: todayTasks.length,
    completed: 0,
    inProgress: 0,
    pending: 0,
  };

  for (const task of todayTasks) {
    if (task.status === "Completed") {
      taskSummary.completed++;
    } else if (task.status === "In progress") {
      taskSummary.inProgress++;
    } else if (task.status === "To do") {
      taskSummary.pending++;
    }
  }

  // ---------------------------------------------
  // TODAY'S STUDY TIME
  // ---------------------------------------------

  const todayStudySeconds = todaySessions.reduce(
    (total, session) => total + session.durationSeconds,
    0
  );

  const dailyTargetMinutes =
    Number.isInteger(user.dailyTargetMinutes) &&
    user.dailyTargetMinutes > 0
      ? user.dailyTargetMinutes
      : null;

  const todayStudy = {
    durationSeconds: todayStudySeconds,
    durationMinutes: roundMinutes(todayStudySeconds),
    dailyTargetMinutes,
    targetProgress:
      dailyTargetMinutes !== null
        ? Math.min(
            100,
            Math.round(
              (todayStudySeconds /
                (dailyTargetMinutes * 60)) *
                100
            )
          )
        : null,
  };

  // ---------------------------------------------
  // WEEKLY STUDY TREND
  // ---------------------------------------------

  const weeklyMap = new Map(
    weekDays.map((date) => [
      date,
      {
        date,
        durationSeconds: 0,
        sessionCount: 0,
      },
    ])
  );

  // Subject-wise distribution for the same 7-day period.
  const subjectMap = new Map();

  for (const session of weeklySessions) {
    const day = weeklyMap.get(session.sessionDate);

    if (day) {
      day.durationSeconds += session.durationSeconds;
      day.sessionCount++;
    }

    const subjectName =
      session.subjectNameSnapshot || "Unknown";

    subjectMap.set(
      subjectName,
      (subjectMap.get(subjectName) || 0) +
        session.durationSeconds
    );
  }

  const weeklyStudy = [...weeklyMap.values()].map((day) => ({
    ...day,
    durationMinutes: roundMinutes(day.durationSeconds),
  }));

  const weeklySubjectDistribution = [...subjectMap.entries()]
    .map(([subject, durationSeconds]) => ({
      subject,
      durationSeconds,
      durationMinutes: roundMinutes(durationSeconds),
    }))
    .sort(
      (a, b) => b.durationSeconds - a.durationSeconds
    );

  // ---------------------------------------------
  // LATEST TEST SUMMARY
  // ---------------------------------------------

  const latestTestSummary = latestTest
    ? {
        id: latestTest._id,
        name: latestTest.name,
        testDate: latestTest.testDate,
        marksObtained: latestTest.marksObtained,
        maxMarks: latestTest.maxMarks,
        percentage:
          Math.round(
            (latestTest.marksObtained /
              latestTest.maxMarks) *
              10000
          ) / 100,
        examType: latestTest.examType || null,
      }
    : null;

  // ---------------------------------------------
  // ONBOARDING CHECKLIST
  // ---------------------------------------------

  const onboardingChecklist = {
    hasSubject: subjectCount > 0,
    hasTask: Boolean(firstTask),
    hasStudySession: Boolean(firstSession),
    hasTest: Boolean(firstTest),
  };

  onboardingChecklist.completedCount = Object.values(
    onboardingChecklist
  ).filter(Boolean).length;

  onboardingChecklist.totalSteps = 4;

  onboardingChecklist.isComplete =
    onboardingChecklist.completedCount ===
    onboardingChecklist.totalSteps;

  // ---------------------------------------------
  // FINAL DASHBOARD RESPONSE
  // ---------------------------------------------

  return {
    date: today,
    timezone,

    today: {
      study: todayStudy,
      tasks: {
        summary: taskSummary,
        items: todayTasks,
      },
    },

    timer: getTimerSummary(activeTimer),

    recentSessions,

    weeklyStudy,

    subjectDistribution: weeklySubjectDistribution,

    latestTest: latestTestSummary,

    onboardingChecklist,
  };
};