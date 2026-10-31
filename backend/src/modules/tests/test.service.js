import mongoose from "mongoose";

import TestResult from "./test.model.js";
import StudySession from "../StudySessions/studySession.model.js";
import Task from "../../models/Task.js";
import User from "../../models/User.js";

// -------------------------
// COMMON HELPERS
// -------------------------

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

const roundMarks = (value) => Number(value.toFixed(2));

const validateOwnerId = (ownerId) => {
  if (!mongoose.Types.ObjectId.isValid(ownerId)) {
    throw createServiceError(
      "Authenticated user is invalid.",
      401,
      "UNAUTHORIZED"
    );
  }
};

const validateTestId = (testId) => {
  if (!mongoose.Types.ObjectId.isValid(testId)) {
    throw createServiceError(
      "Invalid test result ID.",
      400,
      "INVALID_TEST_ID"
    );
  }
};

const getTodayInTimezone = (timezone) => {
  let dateTimezone = timezone || "Asia/Kolkata";

  try {
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: dateTimezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(new Date());

    const dateParts = Object.fromEntries(
      parts.map(({ type, value }) => [type, value])
    );

    return `${dateParts.year}-${dateParts.month}-${dateParts.day}`;
  } catch {
    dateTimezone = "Asia/Kolkata";

    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: dateTimezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(new Date());

    const dateParts = Object.fromEntries(
      parts.map(({ type, value }) => [type, value])
    );

    return `${dateParts.year}-${dateParts.month}-${dateParts.day}`;
  }
};

const isValidDateOnly = (value) => {
  if (typeof value !== "string") return false;

  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;

  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
};

// -------------------------
// BUSINESS VALIDATORS
// -------------------------

const validateCounts = (counts) => {
  if (counts == null) return;

  const allowedKeys = ["correct", "incorrect", "unanswered"];

  for (const key of Object.keys(counts)) {
    if (!allowedKeys.includes(key)) {
      throw createServiceError(`Invalid count field: ${key}.`);
    }
  }

  for (const key of allowedKeys) {
    const value = counts[key];

    if (
      value !== undefined &&
      (!Number.isInteger(value) || value < 0)
    ) {
      throw createServiceError(
        `${key} count must be a non-negative integer.`
      );
    }
  }
};

const validateScoringScheme = (scoringScheme) => {
  if (scoringScheme == null) return;

  const { marksPerCorrect, penaltyPerIncorrect } = scoringScheme;

  if (
    marksPerCorrect !== undefined &&
    (!Number.isFinite(marksPerCorrect) || marksPerCorrect < 0)
  ) {
    throw createServiceError(
      "marksPerCorrect must be a non-negative number."
    );
  }

  if (
    penaltyPerIncorrect !== undefined &&
    (!Number.isFinite(penaltyPerIncorrect) || penaltyPerIncorrect > 0)
  ) {
    throw createServiceError(
      "penaltyPerIncorrect must be zero or a negative number."
    );
  }
};

const validateSubjectResults = (
  subjectResults,
  overallMarksObtained,
  overallMaxMarks
) => {
  if (subjectResults == null) return;

  if (!Array.isArray(subjectResults) || subjectResults.length === 0) {
    throw createServiceError(
      "Add at least one subject result or use null."
    );
  }

  const subjectNames = new Set();
  let totalSubjectMarks = 0;

  for (const result of subjectResults) {
    if (!result || typeof result !== "object" || Array.isArray(result)) {
      throw createServiceError(
        "Each subject result must be an object."
      );
    }

    const { subjectName, marksObtained, maxMarks } = result;

    if (
      typeof subjectName !== "string" ||
      subjectName.trim().length === 0
    ) {
      throw createServiceError(
        "Every subject result must have a subjectName."
      );
    }

    const normalizedName = subjectName.trim().toLowerCase();

    if (subjectNames.has(normalizedName)) {
      throw createServiceError(
        `Duplicate subject result: ${subjectName}.`
      );
    }

    subjectNames.add(normalizedName);

    if (!Number.isFinite(marksObtained)) {
      throw createServiceError(
        `Invalid marksObtained for ${subjectName}.`
      );
    }

    if (!Number.isFinite(maxMarks) || maxMarks <= 0) {
      throw createServiceError(
        `maxMarks for ${subjectName} must be greater than zero.`
      );
    }

    if (marksObtained > maxMarks) {
      throw createServiceError(
        `Marks obtained cannot exceed maximum marks for ${subjectName}.`
      );
    }

    totalSubjectMarks += marksObtained;
  }

  if (
    roundMarks(totalSubjectMarks) !==
    roundMarks(overallMarksObtained)
  ) {
    throw createServiceError(
      "The sum of subject-wise marks must equal overall marks obtained."
    );
  }

  const totalSubjectMaxMarks = subjectResults.reduce(
    (total, result) => total + result.maxMarks,
    0
  );

  if (roundMarks(totalSubjectMaxMarks) > roundMarks(overallMaxMarks)) {
    throw createServiceError(
      "The sum of subject maximum marks cannot exceed overall maximum marks."
    );
  }
};

const validateLinkedRecords = async ({
  ownerId,
  linkedSessionId,
  linkedTaskIds,
}) => {
  if (linkedSessionId) {
    if (!mongoose.Types.ObjectId.isValid(linkedSessionId)) {
      throw createServiceError("Invalid linked session ID.");
    }

    const session = await StudySession.findOne({
      _id: linkedSessionId,
      ownerId,
    }).select("_id");

    if (!session) {
      throw createServiceError(
        "Linked session was not found.",
        404,
        "SESSION_NOT_FOUND"
      );
    }
  }

  if (linkedTaskIds?.length) {
    const uniqueTaskIds = [...new Set(linkedTaskIds.map(String))];

    if (uniqueTaskIds.length !== linkedTaskIds.length) {
      throw createServiceError(
        "Duplicate task IDs are not allowed."
      );
    }

    const tasks = await Task.find({
      _id: { $in: uniqueTaskIds },
      ownerId,
    }).select("_id");

    if (tasks.length !== uniqueTaskIds.length) {
      throw createServiceError(
        "One or more linked tasks were not found.",
        404,
        "TASK_NOT_FOUND"
      );
    }
  }
};

// Validate a complete record.
// Used for both create and merged PATCH data.
const validateCompleteTestData = async (ownerId, data) => {
  const {
    name,
    testDate,
    marksObtained,
    maxMarks,
    scoringScheme,
    counts,
    subjectResults,
    linkedSessionId,
    linkedTaskIds,
  } = data;

  if (typeof name !== "string" || !name.trim()) {
    throw createServiceError("Test name is required.");
  }

  if (name.trim().length > 100) {
    throw createServiceError(
      "Test name cannot exceed 100 characters."
    );
  }

  if (!isValidDateOnly(testDate)) {
    throw createServiceError(
      "testDate must be a valid date in YYYY-MM-DD format."
    );
  }

  const user = await User.findById(ownerId).select("timezone");

  if (!user) {
    throw createServiceError(
      "User account was not found.",
      404,
      "USER_NOT_FOUND"
    );
  }

  if (testDate > getTodayInTimezone(user.timezone)) {
    throw createServiceError(
      "Test date cannot be in the future."
    );
  }

  if (!Number.isFinite(marksObtained)) {
    throw createServiceError(
      "marksObtained must be a valid number."
    );
  }

  if (!Number.isFinite(maxMarks) || maxMarks <= 0) {
    throw createServiceError(
      "maxMarks must be greater than zero."
    );
  }

  if (marksObtained > maxMarks) {
    throw createServiceError(
      "marksObtained cannot exceed maxMarks."
    );
  }

  validateScoringScheme(scoringScheme);
  validateCounts(counts);

  if (marksObtained < 0) {
    const hasNegativePenalty =
      scoringScheme?.penaltyPerIncorrect < 0;

    const hasIncorrectAnswers =
      Number.isInteger(counts?.incorrect) && counts.incorrect > 0;

    if (!hasNegativePenalty || !hasIncorrectAnswers) {
      throw createServiceError(
        "Negative marks require a negative-marking scheme and at least one incorrect answer."
      );
    }
  }

  if (
    data.durationMinutes !== undefined &&
    data.durationMinutes !== null &&
    (!Number.isInteger(data.durationMinutes) || data.durationMinutes <= 0)
  ) {
    throw createServiceError(
      "durationMinutes must be a positive whole number."
    );
  }

  validateSubjectResults(
    subjectResults,
    marksObtained,
    maxMarks
  );

  await validateLinkedRecords({
    ownerId,
    linkedSessionId,
    linkedTaskIds,
  });
};

// -------------------------
// CREATE TEST RESULT
// -------------------------

export const createTestResult = async (ownerId, payload) => {
  validateOwnerId(ownerId);

  await validateCompleteTestData(ownerId, payload);

  const testResult = await TestResult.create({
    ownerId,
    name: payload.name,
    testDate: payload.testDate,
    marksObtained: payload.marksObtained,
    maxMarks: payload.maxMarks,
    examType: payload.examType,
    scoringScheme: payload.scoringScheme ?? null,
    counts: payload.counts ?? null,
    durationMinutes: payload.durationMinutes,
    subjectResults: payload.subjectResults ?? null,
    notes: payload.notes,
    linkedSessionId: payload.linkedSessionId ?? null,
    linkedTaskIds: payload.linkedTaskIds ?? [],
  });

  return testResult;
};

// -------------------------
// GET ALL TEST RESULTS
// -------------------------

export const getTestResults = async (ownerId, filters = {}) => {
  validateOwnerId(ownerId);

  const {
    from,
    to,
    examType,
    page = 1,
    limit = 20,
  } = filters;

  const query = { ownerId };

  // Date range filter.
  if (from || to) {
    query.testDate = {};

    if (from) query.testDate.$gte = from;
    if (to) query.testDate.$lte = to;
  }

  // Exam type filter.
  if (examType) {
    query.examType = examType;
  }

  const skip = (page - 1) * limit;

  const [items, totalItems] = await Promise.all([
    TestResult.find(query)
      .sort({ testDate: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),

    TestResult.countDocuments(query),
  ]);

  return {
    items,
    pagination: {
      page,
      limit,
      totalItems,
      totalPages: Math.ceil(totalItems / limit),
    },
  };
};

// -------------------------
// GET SINGLE TEST RESULT
// -------------------------

export const getTestResultById = async (ownerId, testId) => {
  validateOwnerId(ownerId);
  validateTestId(testId);

  const testResult = await TestResult.findOne({
    _id: testId,
    ownerId,
  }).lean();

  if (!testResult) {
    throw createServiceError(
      "Test result was not found.",
      404,
      "TEST_NOT_FOUND"
    );
  }

  return testResult;
};

// -------------------------
// UPDATE TEST RESULT
// -------------------------

export const updateTestResult = async (
  ownerId,
  testId,
  payload
) => {
  validateOwnerId(ownerId);
  validateTestId(testId);

  const existingTest = await TestResult.findOne({
    _id: testId,
    ownerId,
  });

  if (!existingTest) {
    throw createServiceError(
      "Test result was not found.",
      404,
      "TEST_NOT_FOUND"
    );
  }

  // Merge existing data with supplied PATCH fields.
  // This lets us validate the complete updated record.
  const existingData = existingTest.toObject();

  const mergedData = {
    ...existingData,
    ...payload,
  };

  await validateCompleteTestData(ownerId, mergedData);

  // Only update fields sent by the client.
  existingTest.set(payload);

  await existingTest.save();

  return existingTest;
};

// -------------------------
// DELETE TEST RESULT
// -------------------------

export const deleteTestResult = async (ownerId, testId) => {
  validateOwnerId(ownerId);
  validateTestId(testId);

  const deletedTest = await TestResult.findOneAndDelete({
    _id: testId,
    ownerId,
  });

  if (!deletedTest) {
    throw createServiceError(
      "Test result was not found.",
      404,
      "TEST_NOT_FOUND"
    );
  }

  return deletedTest;
};