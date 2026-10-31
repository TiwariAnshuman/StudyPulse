import mongoose from "mongoose";

import ActiveTimer from "./activeTimer.model.js";
import StudySession from "../StudySessions/studySession.model.js";

import Task from "../../models/Task.js";
import Subject from "../../models/Subject.js";
import User from "../../models/User.js";

const DEFAULT_TIMEZONE = "Asia/Kolkata";

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
// VALIDATION HELPERS
// ------------------------------------------

const isValidObjectId = (id) =>
  mongoose.isValidObjectId(id);

const isValidDate = (date) =>
  date instanceof Date && !Number.isNaN(date.getTime());

const validateOptionalText = (value, fieldName, maxLength) => {
  if (value === undefined || value === null) {
    return null;
  }

  if (typeof value !== "string") {
    throw createServiceError(
      `${fieldName} must be a string.`,
      400,
      `INVALID_${fieldName.toUpperCase()}`
    );
  }

  const trimmed = value.trim();

  if (trimmed.length > maxLength) {
    throw createServiceError(
      `${fieldName} cannot exceed ${maxLength} characters.`,
      400,
      `INVALID_${fieldName.toUpperCase()}`
    );
  }

  return trimmed || null;
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
// START TIMER
// ------------------------------------------

export const startTimer = async (ownerId, data) => {
  if (!isValidObjectId(ownerId)) {
    throw createServiceError(
      "Invalid user information.",
      401,
      "INVALID_USER"
    );
  }

  const { subjectId, taskId, activityType } = data;

  const existingTimer = await ActiveTimer.findOne({ ownerId });

  if (existingTimer) {
    throw createServiceError(
      "You already have an active timer. Finish or discard it before starting another.",
      409,
      "ACTIVE_TIMER_EXISTS"
    );
  }

  let selectedSubject;
  let selectedTask = null;

  const hasTaskId =
    taskId !== undefined &&
    taskId !== null &&
    taskId !== "";

  if (hasTaskId) {
    if (!isValidObjectId(taskId)) {
      throw createServiceError(
        "Invalid task ID.",
        400,
        "INVALID_TASK_ID"
      );
    }

    selectedTask = await Task.findOne({
      _id: taskId,
      ownerId,
    });

    if (!selectedTask) {
      throw createServiceError(
        "Task not found.",
        404,
        "TASK_NOT_FOUND"
      );
    }

    selectedSubject = await Subject.findOne({
      _id: selectedTask.subjectId,
      ownerId,
      archivedAt: null,
    });

    if (!selectedSubject) {
      throw createServiceError(
        "The subject linked to this task was not found or is archived.",
        404,
        "SUBJECT_NOT_FOUND"
      );
    }

    if (subjectId && !isValidObjectId(subjectId)) {
      throw createServiceError(
        "Invalid subject ID.",
        400,
        "INVALID_SUBJECT_ID"
      );
    }

    if (
      subjectId &&
      selectedTask.subjectId.toString() !== subjectId.toString()
    ) {
      throw createServiceError(
        "The selected subject does not match the task subject.",
        400,
        "TASK_SUBJECT_MISMATCH"
      );
    }
  } else {
    if (!subjectId || !isValidObjectId(subjectId)) {
      throw createServiceError(
        "A valid subject is required for a general study session.",
        400,
        "INVALID_SUBJECT_ID"
      );
    }

    selectedSubject = await Subject.findOne({
      _id: subjectId,
      ownerId,
      archivedAt: null,
    });

    if (!selectedSubject) {
      throw createServiceError(
        "Subject not found or archived.",
        404,
        "SUBJECT_NOT_FOUND"
      );
    }
  }

  const now = new Date();

  try {
    return await ActiveTimer.create({
      ownerId,

      subjectId: selectedSubject._id,
      subjectNameSnapshot: selectedSubject.name,

      taskId: selectedTask?._id ?? null,
      taskTitleSnapshot: selectedTask?.title ?? null,

      activityType,

      startAt: now,
      runningSince: now,

      accumulatedSeconds: 0,

      status: "running",

      pauseEvents: [],
    });
  } catch (error) {
    if (error.code === 11000) {
      throw createServiceError(
        "You already have an active timer. Finish or discard it before starting another.",
        409,
        "ACTIVE_TIMER_EXISTS"
      );
    }

    throw error;
  }
};

// ------------------------------------------
// PAUSE TIMER
// ------------------------------------------

export const pauseTimer = async (ownerId) => {
  if (!isValidObjectId(ownerId)) {
    throw createServiceError(
      "Invalid user information.",
      401,
      "INVALID_USER"
    );
  }

  const timer = await ActiveTimer.findOne({ ownerId });

  if (!timer) {
    throw createServiceError(
      "No active timer found.",
      404,
      "ACTIVE_TIMER_NOT_FOUND"
    );
  }

  if (timer.finishAt) {
    throw createServiceError(
      "Timer is being finished. Please wait.",
      409,
      "TIMER_FINISH_IN_PROGRESS"
    );
  }

  if (timer.status !== "running") {
    throw createServiceError(
      "Timer is not running.",
      409,
      "TIMER_NOT_RUNNING"
    );
  }

  if (!isValidDate(timer.runningSince)) {
    throw createServiceError(
      "Timer running timestamp is invalid.",
      500,
      "INVALID_RUNNING_TIMESTAMP"
    );
  }

  const now = new Date();

  const elapsedMilliseconds =
    now.getTime() - timer.runningSince.getTime();

  if (elapsedMilliseconds < 0) {
    throw createServiceError(
      "Timer timestamp is ahead of the current server time.",
      409,
      "INVALID_TIMER_TIMESTAMP"
    );
  }

  const elapsedSeconds = Math.floor(
    elapsedMilliseconds / 1000
  );

  const updatedTimer = await ActiveTimer.findOneAndUpdate(
    {
      _id: timer._id,
      ownerId,
      status: "running",
      runningSince: timer.runningSince,
      finishAt: null,
    },
    {
      $inc: {
        accumulatedSeconds: elapsedSeconds,
      },

      $set: {
        status: "paused",
        runningSince: null,
      },

      $push: {
        pauseEvents: {
          pausedAt: now,
          resumedAt: null,
          durationSeconds: null,
        },
      },
    },
    {
      new: true,
      runValidators: true,
    }
  );

  if (!updatedTimer) {
    throw createServiceError(
      "Timer state changed. Please refresh and try again.",
      409,
      "TIMER_STATE_CONFLICT"
    );
  }

  return updatedTimer;
};

// ------------------------------------------
// RESUME TIMER
// ------------------------------------------

export const resumeTimer = async (ownerId) => {
  if (!isValidObjectId(ownerId)) {
    throw createServiceError(
      "Invalid user information.",
      401,
      "INVALID_USER"
    );
  }

  const timer = await ActiveTimer.findOne({ ownerId });

  if (!timer) {
    throw createServiceError(
      "No active timer found.",
      404,
      "ACTIVE_TIMER_NOT_FOUND"
    );
  }

  if (timer.finishAt) {
    throw createServiceError(
      "Timer is being finished. Please wait.",
      409,
      "TIMER_FINISH_IN_PROGRESS"
    );
  }

  if (timer.status !== "paused") {
    throw createServiceError(
      "Timer is not paused.",
      409,
      "TIMER_NOT_PAUSED"
    );
  }

  let openPauseEvent = null;

  for (let i = timer.pauseEvents.length - 1; i >= 0; i--) {
    if (!timer.pauseEvents[i].resumedAt) {
      openPauseEvent = timer.pauseEvents[i];
      break;
    }
  }

  if (!openPauseEvent || !isValidDate(openPauseEvent.pausedAt)) {
    throw createServiceError(
      "No valid open pause event found.",
      500,
      "INVALID_PAUSE_EVENT"
    );
  }

  const now = new Date();

  const pauseMilliseconds =
    now.getTime() - openPauseEvent.pausedAt.getTime();

  if (pauseMilliseconds < 0) {
    throw createServiceError(
      "Pause timestamp is ahead of the current server time.",
      409,
      "INVALID_PAUSE_TIMESTAMP"
    );
  }

  const pauseDurationSeconds = Math.floor(
    pauseMilliseconds / 1000
  );

  const updatedTimer = await ActiveTimer.findOneAndUpdate(
    {
      _id: timer._id,
      ownerId,
      status: "paused",
      finishAt: null,
      pauseEvents: {
        $elemMatch: {
          resumedAt: null,
        },
      },
    },
    {
      $set: {
        status: "running",
        runningSince: now,
        "pauseEvents.$.resumedAt": now,
        "pauseEvents.$.durationSeconds": pauseDurationSeconds,
      },
    },
    {
      new: true,
      runValidators: true,
    }
  );

  if (!updatedTimer) {
    throw createServiceError(
      "Timer state changed. Please refresh and try again.",
      409,
      "TIMER_STATE_CONFLICT"
    );
  }

  return updatedTimer;
};

// ------------------------------------------
// GET ACTIVE TIMER
// ------------------------------------------

export const getActiveTimer = async (ownerId) => {
  if (!isValidObjectId(ownerId)) {
    throw createServiceError(
      "Invalid user information.",
      401,
      "INVALID_USER"
    );
  }

  const activeTimer = await ActiveTimer.findOne({
    ownerId,
  }).lean();

  return activeTimer || null;
};

// ------------------------------------------
// FINISH TIMER
// ------------------------------------------

export const finishTimer = async (ownerId, data = {}) => {
  if (!isValidObjectId(ownerId)) {
    throw createServiceError(
      "Invalid user information.",
      401,
      "INVALID_USER"
    );
  }

  const { timerId } = data;

  if (!isValidObjectId(timerId)) {
    throw createServiceError(
      "A valid timer ID is required.",
      400,
      "INVALID_TIMER_ID"
    );
  }

  const topic = validateOptionalText(data.topic, "topic", 100);
  const notes = validateOptionalText(data.notes, "notes", 1000);

  // Return existing session if this timer was already finished.
  const existingSession = await StudySession.findOne({
    ownerId,
    sourceTimerId: timerId,
  });

  if (existingSession) {
    await ActiveTimer.deleteOne({
      _id: timerId,
      ownerId,
    });

    return {
      session: existingSession,
      alreadyFinished: true,
    };
  }

  let timer = await ActiveTimer.findOne({
    _id: timerId,
    ownerId,
  });

  if (!timer) {
    throw createServiceError(
      "Timer not found.",
      404,
      "TIMER_NOT_FOUND"
    );
  }

  if (!["running", "paused"].includes(timer.status)) {
    throw createServiceError(
      "Timer cannot be finished in its current state.",
      409,
      "INVALID_TIMER_STATE"
    );
  }

  // Fix the end timestamp once. Retries reuse this timestamp.
  if (!timer.finishAt) {
    const finishAt = new Date();

    const lockedTimer = await ActiveTimer.findOneAndUpdate(
      {
        _id: timer._id,
        ownerId,
        status: timer.status,
        runningSince: timer.runningSince,
        finishAt: null,
      },
      {
        $set: { finishAt },
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!lockedTimer) {
      throw createServiceError(
        "Timer state changed. Please refresh and try again.",
        409,
        "TIMER_STATE_CONFLICT"
      );
    }

    timer = lockedTimer;
  } else {
    timer = await ActiveTimer.findOne({
      _id: timerId,
      ownerId,
    });
  }

  if (!timer || !isValidDate(timer.finishAt)) {
    throw createServiceError(
      "Timer finish timestamp is invalid.",
      500,
      "INVALID_FINISH_TIMESTAMP"
    );
  }

  // Calculate actual study duration.
  let durationSeconds = timer.accumulatedSeconds;

  if (timer.status === "running") {
    if (!isValidDate(timer.runningSince)) {
      throw createServiceError(
        "Timer running timestamp is invalid.",
        500,
        "INVALID_RUNNING_TIMESTAMP"
      );
    }

    const runningMilliseconds =
      timer.finishAt.getTime() - timer.runningSince.getTime();

    if (runningMilliseconds < 0) {
      throw createServiceError(
        "Timer finish timestamp is invalid.",
        409,
        "INVALID_TIMER_TIMESTAMP"
      );
    }

    durationSeconds += Math.floor(
      runningMilliseconds / 1000
    );
  }

  // Validate duration.
  if (durationSeconds < 1 || durationSeconds > 43200) {
    await ActiveTimer.updateOne(
      {
        _id: timer._id,
        ownerId,
        finishAt: timer.finishAt,
      },
      {
        $set: { finishAt: null },
      }
    );

    if (durationSeconds < 1) {
      throw createServiceError(
        "Study for at least one second before finishing.",
        400,
        "INVALID_SESSION_DURATION"
      );
    }

    throw createServiceError(
      "This timer exceeds the 12-hour limit. Please review it.",
      409,
      "TIMER_NEEDS_REVIEW"
    );
  }

  // Check for overlapping sessions.
  const overlappingSession = await StudySession.findOne({
    ownerId,
    startAt: { $lt: timer.finishAt },
    endAt: { $gt: timer.startAt },
  }).select("_id");

  if (overlappingSession) {
    await ActiveTimer.updateOne(
      {
        _id: timer._id,
        ownerId,
        finishAt: timer.finishAt,
      },
      {
        $set: { finishAt: null },
      }
    );

    throw createServiceError(
      "This timer overlaps with an existing study session.",
      409,
      "SESSION_OVERLAP"
    );
  }

  const timezone = await getUserTimezone(ownerId);

  const sessionDate = getDateInTimezone(
    timer.startAt,
    timezone
  );

  // If the task was deleted, preserve its snapshot but unlink it.
  let validTaskId = null;

  if (timer.taskId) {
    const task = await Task.findOne({
      _id: timer.taskId,
      ownerId,
    }).select("_id");

    if (task) {
      validTaskId = task._id;
    }
  }

  try {
    const session = await StudySession.create({
      ownerId,

      subjectId: timer.subjectId,
      subjectNameSnapshot: timer.subjectNameSnapshot,

      taskId: validTaskId,
      taskTitleSnapshot: timer.taskTitleSnapshot,

      sourceTimerId: timer._id,

      startAt: timer.startAt,
      endAt: timer.finishAt,

      durationSeconds,

      activityType: timer.activityType,

      pauseEvents: timer.pauseEvents,

      sessionDate,

      topic,
      notes,

      source: "timer",
    });

    // Delete the timer only after session creation succeeds.
    await ActiveTimer.deleteOne({
      _id: timer._id,
      ownerId,
    });

    return {
      session,
      alreadyFinished: false,
    };
  } catch (error) {
    if (error.code === 11000) {
      const savedSession = await StudySession.findOne({
        ownerId,
        sourceTimerId: timer._id,
      });

      if (savedSession) {
        await ActiveTimer.deleteOne({
          _id: timer._id,
          ownerId,
        });

        return {
          session: savedSession,
          alreadyFinished: true,
        };
      }
    }

    // Keep timer for retry if saving failed.
    throw error;
  }
};

// ------------------------------------------
// DISCARD TIMER
// ------------------------------------------

export const discardTimer = async (ownerId) => {
  if (!isValidObjectId(ownerId)) {
    throw createServiceError(
      "Invalid user information.",
      401,
      "INVALID_USER"
    );
  }

  const timer = await ActiveTimer.findOne({ ownerId });

  if (!timer) {
    throw createServiceError(
      "No active timer found.",
      404,
      "ACTIVE_TIMER_NOT_FOUND"
    );
  }

  if (timer.finishAt) {
    throw createServiceError(
      "Timer finish is already in progress. Please wait.",
      409,
      "TIMER_FINISH_IN_PROGRESS"
    );
  }

  const result = await ActiveTimer.deleteOne({
    _id: timer._id,
    ownerId,
    finishAt: null,
  });

  if (result.deletedCount !== 1) {
    throw createServiceError(
      "Timer state changed. Please refresh and try again.",
      409,
      "TIMER_STATE_CONFLICT"
    );
  }

  return {
    discarded: true,
  };
};