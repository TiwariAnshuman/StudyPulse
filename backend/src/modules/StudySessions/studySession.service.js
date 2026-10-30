import mongoose from "mongoose";

import StudySession from "./studySession.model.js";

import Task from "../../models/task.js";
import Subject from "../../models/subject.js";
import User from "../../models/User.js";

const DEFAULT_TIMEZONE = "Asia/Kolkata";

const ACTIVITY_TYPES = [
  "Reading",
  "Lecture",
  "Practice questions",
  "Revision",
  "Mock test",
  "Other",
];

const SESSION_SOURCES = ["timer", "manual"];

// ------------------------------------------
// ERROR HELPER
// ------------------------------------------

const createServiceError = (message, statusCode, code) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.code = code;
  return error;
};

// ------------------------------------------
// DATE HELPERS
// ------------------------------------------

const parseDate = (value, fieldName) => {
  const date = value instanceof Date
    ? value
    : new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw createServiceError(
      `${fieldName} must be a valid date.`,
      400,
      `INVALID_${fieldName.toUpperCase()}`
    );
  }

  return date;
};

const isValidDateOnly = (value) => {
  if (typeof value !== "string") {
    return false;
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const date = new Date(`${value}T00:00:00.000Z`);

  return (
    !Number.isNaN(date.getTime()) &&
    date.toISOString().slice(0, 10) === value
  );
};

// ------------------------------------------
// TIMEZONE HELPERS
// ------------------------------------------

const getUserTimezone = async (userId) => {
  const user = await User.findById(userId).select("timezone");

  const timezone = user?.timezone || DEFAULT_TIMEZONE;

  try {
    new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
    });

    return timezone;
  } catch {
    return DEFAULT_TIMEZONE;
  }
};

const getDateInTimezone = (date, timezone) => {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const values = {};

  for (const part of parts) {
    if (part.type !== "literal") {
      values[part.type] = part.value;
    }
  }

  return `${values.year}-${values.month}-${values.day}`;
};

// ------------------------------------------
// OWNERSHIP HELPERS
// ------------------------------------------

const findActiveSubject = async (subjectId, ownerId) => {
  const subject = await Subject.findOne({
    _id: subjectId,
    ownerId,
    archivedAt: null,
  });

  if (!subject) {
    throw createServiceError(
      "Subject not found or is archived.",
      404,
      "SUBJECT_NOT_FOUND"
    );
  }

  return subject;
};

const findOwnedTask = async (taskId, ownerId) => {
  const task = await Task.findOne({
    _id: taskId,
    ownerId,
  });

  if (!task) {
    throw createServiceError(
      "Task not found.",
      404,
      "TASK_NOT_FOUND"
    );
  }

  return task;
};

// ------------------------------------------
// SESSION OVERLAP CHECK
// ------------------------------------------

const checkSessionOverlap = async ({
  ownerId,
  startAt,
  endAt,
}) => {
  const overlappingSession = await StudySession.findOne({
    ownerId,
    startAt: { $lt: endAt },
    endAt: { $gt: startAt },
  }).select("_id startAt endAt");

  if (overlappingSession) {
    throw createServiceError(
      "This study session overlaps with an existing session.",
      409,
      "SESSION_OVERLAP"
    );
  }
};

// ------------------------------------------
// CREATE MANUAL STUDY SESSION
// ------------------------------------------

export const createManualStudySession = async (ownerId, data) => {
  if (!mongoose.isValidObjectId(ownerId)) {
    throw createServiceError(
      "Invalid authenticated user.",
      401,
      "INVALID_USER"
    );
  }

  const startAt = parseDate(data.startAt, "startAt");
  const endAt = parseDate(data.endAt, "endAt");

  const durationMs = endAt.getTime() - startAt.getTime();

  const durationSeconds = Math.floor(
    durationMs / 1000
  );

  if (durationSeconds < 1) {
    throw createServiceError(
      "Study session must be at least one second long.",
      400,
      "INVALID_SESSION_DURATION"
    );
  }

  if (durationSeconds > 43200) {
    throw createServiceError(
      "Study session cannot exceed 12 hours.",
      400,
      "SESSION_DURATION_EXCEEDED"
    );
  }

  if (!ACTIVITY_TYPES.includes(data.activityType)) {
    throw createServiceError(
      "Invalid activity type.",
      400,
      "INVALID_ACTIVITY_TYPE"
    );
  }

  // Resolve optional task.
  let task = null;

  if (data.taskId) {
    if (!mongoose.isValidObjectId(data.taskId)) {
      throw createServiceError(
        "Invalid task ID.",
        400,
        "INVALID_TASK_ID"
      );
    }

    task = await findOwnedTask(data.taskId, ownerId);
  }

  // Resolve subject.
  const resolvedSubjectId = data.subjectId || task?.subjectId;

  if (!resolvedSubjectId) {
    throw createServiceError(
      "Subject is required when no linked task provides one.",
      400,
      "SUBJECT_REQUIRED"
    );
  }

  if (!mongoose.isValidObjectId(resolvedSubjectId)) {
    throw createServiceError(
      "Invalid subject ID.",
      400,
      "INVALID_SUBJECT_ID"
    );
  }

  const subject = await findActiveSubject(
    resolvedSubjectId,
    ownerId
  );

  // Task and subject must match.
  if (
    task &&
    task.subjectId.toString() !== subject._id.toString()
  ) {
    throw createServiceError(
      "Selected subject does not match the task subject.",
      400,
      "TASK_SUBJECT_MISMATCH"
    );
  }

  await checkSessionOverlap({
    ownerId,
    startAt,
    endAt,
  });

  const timezone = await getUserTimezone(ownerId);

  const sessionDate = getDateInTimezone(
    startAt,
    timezone
  );

  const session = await StudySession.create({
    ownerId,

    taskId: task ? task._id : null,
    taskTitleSnapshot: task ? task.title : null,

    subjectId: subject._id,
    subjectNameSnapshot: subject.name,

    startAt,
    endAt,

    durationSeconds,

    activityType: data.activityType,

    pauseEvents: [],

    sessionDate,

    topic: data.topic ?? null,
    notes: data.notes ?? null,

    // Source is controlled by backend.
    source: "manual",
  });

  return session;
};

// ------------------------------------------
// GET STUDY SESSION HISTORY
// ------------------------------------------

export const getStudySessions = async (ownerId, query = {}) => {
  if (!mongoose.isValidObjectId(ownerId)) {
    throw createServiceError(
      "Invalid authenticated user.",
      401,
      "INVALID_USER"
    );
  }

  const {
    startDate,
    endDate,
    subjectId,
    taskId,
    activityType,
    source,
  } = query;

  const page = Number(query.page ?? 1);
  const limit = Number(query.limit ?? 10);

  if (
    !Number.isInteger(page) ||
    page < 1 ||
    !Number.isInteger(limit) ||
    limit < 1 ||
    limit > 50
  ) {
    throw createServiceError(
      "Page must be a positive integer and limit must be between 1 and 50.",
      400,
      "INVALID_PAGINATION"
    );
  }

  // Validate dates.
  if (startDate && !isValidDateOnly(startDate)) {
    throw createServiceError(
      "startDate must be a valid YYYY-MM-DD date.",
      400,
      "INVALID_START_DATE"
    );
  }

  if (endDate && !isValidDateOnly(endDate)) {
    throw createServiceError(
      "endDate must be a valid YYYY-MM-DD date.",
      400,
      "INVALID_END_DATE"
    );
  }

  if (startDate && endDate && startDate > endDate) {
    throw createServiceError(
      "startDate cannot be after endDate.",
      400,
      "INVALID_DATE_RANGE"
    );
  }

  // Validate IDs.
  if (subjectId && !mongoose.isValidObjectId(subjectId)) {
    throw createServiceError(
      "Invalid subjectId.",
      400,
      "INVALID_SUBJECT_ID"
    );
  }

  if (taskId && !mongoose.isValidObjectId(taskId)) {
    throw createServiceError(
      "Invalid taskId.",
      400,
      "INVALID_TASK_ID"
    );
  }

  // Validate activity type.
  if (
    activityType &&
    !ACTIVITY_TYPES.includes(activityType)
  ) {
    throw createServiceError(
      "Invalid activityType.",
      400,
      "INVALID_ACTIVITY_TYPE"
    );
  }

  // Validate source.
  if (
    source &&
    !SESSION_SOURCES.includes(source)
  ) {
    throw createServiceError(
      "source must be either timer or manual.",
      400,
      "INVALID_SESSION_SOURCE"
    );
  }

  // Always restrict records to authenticated user.
  const filter = {
    ownerId: new mongoose.Types.ObjectId(ownerId),
  };

  if (startDate || endDate) {
    filter.sessionDate = {};

    if (startDate) {
      filter.sessionDate.$gte = startDate;
    }

    if (endDate) {
      filter.sessionDate.$lte = endDate;
    }
  }

  if (subjectId) {
    filter.subjectId = new mongoose.Types.ObjectId(subjectId);
  }

  if (taskId) {
    filter.taskId = new mongoose.Types.ObjectId(taskId);
  }

  if (activityType) {
    filter.activityType = activityType;
  }

  if (source) {
    filter.source = source;
  }

  const skip = (page - 1) * limit;

  const [sessions, total] = await Promise.all([
    StudySession.find(filter)
      .sort({
        sessionDate: -1,
        startAt: -1,
      })
      .skip(skip)
      .limit(limit)
      .lean(),

    StudySession.countDocuments(filter),
  ]);

  const totalPages = Math.ceil(total / limit);

  return {
    sessions,

    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    },
  };
};