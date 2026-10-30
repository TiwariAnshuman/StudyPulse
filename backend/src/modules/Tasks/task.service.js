
import mongoose from "mongoose";

import Task from "../../models/Task.js";
import Subject from "../../models/Subject.js";
import User from "../../models/User.js";

// ---------------------------------------------
// 1. Constants
// ---------------------------------------------

const DEFAULT_TIMEZONE = "Asia/Kolkata";

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

const ALLOWED_VIEWS = [
  "today",
  "upcoming",
  "carried-over",
  "completed",
  "all",
];

// ---------------------------------------------
// 2. Service error helper
// ---------------------------------------------

function createServiceError(message, statusCode, code) {
  const error = new Error(message);

  error.statusCode = statusCode;
  error.code = code;

  return error;
}

// ---------------------------------------------
// 3. ObjectId validation
// ---------------------------------------------

function validateObjectId(id, fieldName = "ID") {
  if (!mongoose.isValidObjectId(id)) {
    throw createServiceError(
      `Invalid ${fieldName}`,
      400,
      "VALIDATION_ERROR"
    );
  }
}

// ---------------------------------------------
// 4. Get user's timezone
// ---------------------------------------------

async function getUserTimezone(ownerId) {
  const user = await User.findById(ownerId)
    .select("timezone")
    .lean();

  const timezone = user?.timezone || DEFAULT_TIMEZONE;

  try {
    new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
    });

    return timezone;
  } catch {
    return DEFAULT_TIMEZONE;
  }
}

// ---------------------------------------------
// 5. Get today's date in user's timezone
// ---------------------------------------------

function getTodayInTimezone(timezone) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const values = {};

  for (const part of parts) {
    if (part.type !== "literal") {
      values[part.type] = part.value;
    }
  }

  return `${values.year}-${values.month}-${values.day}`;
}

// ---------------------------------------------
// 6. Validate planned and due dates
// ---------------------------------------------

function validateTaskDates(plannedDate, dueDate) {
  if (dueDate && plannedDate && dueDate < plannedDate) {
    throw createServiceError(
      "Due date cannot be before planned date",
      400,
      "VALIDATION_ERROR"
    );
  }
}

// ---------------------------------------------
// 7. Check subject ownership and availability
// ---------------------------------------------

async function validateActiveSubject(subjectId, ownerId) {
  validateObjectId(subjectId, "subject ID");

  const subject = await Subject.findOne({
    _id: subjectId,
    ownerId,
    archivedAt: null,
  })
    .select("_id")
    .lean();

  if (!subject) {
    throw createServiceError(
      "Subject not found or unavailable",
      404,
      "NOT_FOUND"
    );
  }

  return subject;
}

// =============================================
// CREATE TASK
// =============================================

export async function createTask(ownerId, payload) {
  const timezone = await getUserTimezone(ownerId);

  const today = getTodayInTimezone(timezone);

  const plannedDate = payload.plannedDate || today;

  const dueDate = payload.dueDate ?? null;

  validateTaskDates(plannedDate, dueDate);

  // Verify that the subject belongs to this user
  // and is not archived.

  await validateActiveSubject(
    payload.subjectId,
    ownerId
  );

  const status = payload.status || "To do";

  const task = await Task.create({
    ownerId,

    subjectId: payload.subjectId,

    title: payload.title,

    topic: payload.topic ?? null,

    estimateMinutes:
      payload.estimateMinutes ?? null,

    priority: payload.priority || "Medium",

    plannedDate,

    dueDate,

    status,

    completedAt:
      status === "Completed" ? new Date() : null,

    notes: payload.notes ?? null,
  });

  return task;
}

// =============================================
// GET ALL TASKS
// =============================================

export async function getTasks(ownerId, filters = {}) {
  const timezone = await getUserTimezone(ownerId);

  const today = getTodayInTimezone(timezone);

  const page = Math.max(
    1,
    Number(filters.page) || DEFAULT_PAGE
  );

  const limit = Math.min(
    MAX_LIMIT,
    Math.max(
      1,
      Number(filters.limit) || DEFAULT_LIMIT
    )
  );

  const skip = (page - 1) * limit;

  const view = filters.view || "all";

  if (!ALLOWED_VIEWS.includes(view)) {
    throw createServiceError(
      "Invalid task view",
      400,
      "VALIDATION_ERROR"
    );
  }

  const conditions = [
    {
      ownerId: new mongoose.Types.ObjectId(ownerId),
    },
  ];

  // Subject filter

  if (filters.subjectId) {
    validateObjectId(filters.subjectId, "subject ID");

    conditions.push({
      subjectId: new mongoose.Types.ObjectId(
        filters.subjectId
      ),
    });
  }

  // Priority filter

  if (filters.priority) {
    conditions.push({
      priority: filters.priority,
    });
  }

  // Status filter

  if (filters.status) {
    conditions.push({
      status: filters.status,
    });
  }

  // -------------------------------------------
  // View-specific conditions
  // -------------------------------------------

  if (view === "today") {
    conditions.push({
      plannedDate: today,
    });
  }

  if (view === "upcoming") {
    conditions.push({
      plannedDate: { $gt: today },
      status: { $ne: "Completed" },
    });
  }

  if (view === "carried-over") {
    conditions.push({
      plannedDate: { $lt: today },
      status: { $ne: "Completed" },
      $or: [
        { dueDate: null },
        { dueDate: { $gte: today } },
      ],
    });
  }

  if (view === "completed") {
    conditions.push({
      status: "Completed",
    });
  }

  const matchFilter = {
    $and: conditions,
  };

  // -------------------------------------------
  // Sorting
  // -------------------------------------------

  const sort = filters.sort || "date";

  if (!["date", "priority"].includes(sort)) {
    throw createServiceError(
      "Invalid task sorting option",
      400,
      "VALIDATION_ERROR"
    );
  }

  const sortStage =
    sort === "priority"
      ? {
          priorityRank: -1,
          plannedDate: 1,
          createdAt: -1,
        }
      : {
          plannedDate: 1,
          createdAt: -1,
        };

  // -------------------------------------------
  // Fetch paginated tasks
  // -------------------------------------------

  const [items, total] = await Promise.all([
    Task.aggregate([
      {
        $match: matchFilter,
      },
      {
        $addFields: {
          priorityRank: {
            $switch: {
              branches: [
                {
                  case: {
                    $eq: ["$priority", "High"],
                  },
                  then: 3,
                },
                {
                  case: {
                    $eq: ["$priority", "Medium"],
                  },
                  then: 2,
                },
                {
                  case: {
                    $eq: ["$priority", "Low"],
                  },
                  then: 1,
                },
              ],
              default: 0,
            },
          },
        },
      },
      {
        $sort: sortStage,
      },
      {
        $skip: skip,
      },
      {
        $limit: limit,
      },
      {
        $project: {
          priorityRank: 0,
        },
      },
    ]),

    Task.countDocuments(matchFilter),
  ]);

  return {
    items,
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  };
}

// =============================================
// GET SINGLE TASK
// =============================================

export async function getTaskById(ownerId, taskId) {
  validateObjectId(taskId, "task ID");

  const task = await Task.findOne({
    _id: taskId,
    ownerId,
  }).lean();

  if (!task) {
    throw createServiceError(
      "Task not found",
      404,
      "NOT_FOUND"
    );
  }

  return task;
}

// =============================================
// UPDATE TASK
// =============================================

export async function updateTask(
  ownerId,
  taskId,
  payload
) {
  validateObjectId(taskId, "task ID");

  const task = await Task.findOne({
    _id: taskId,
    ownerId,
  });

  if (!task) {
    throw createServiceError(
      "Task not found",
      404,
      "NOT_FOUND"
    );
  }

  const updates = {};

  // -------------------------------------------
  // Subject update
  // -------------------------------------------

  if (Object.hasOwn(payload, "subjectId")) {
    await validateActiveSubject(
      payload.subjectId,
      ownerId
    );

    updates.subjectId = payload.subjectId;
  }

  // -------------------------------------------
  // Date validation
  // -------------------------------------------

  const plannedDate = Object.hasOwn(
    payload,
    "plannedDate"
  )
    ? payload.plannedDate
    : task.plannedDate;

  const dueDate = Object.hasOwn(
    payload,
    "dueDate"
  )
    ? payload.dueDate
    : task.dueDate;

  validateTaskDates(plannedDate, dueDate);

  // -------------------------------------------
  // Allowlisted fields
  // -------------------------------------------

  const allowedFields = [
    "title",
    "topic",
    "estimateMinutes",
    "priority",
    "plannedDate",
    "dueDate",
    "notes",
  ];

  for (const field of allowedFields) {
    if (Object.hasOwn(payload, field)) {
      updates[field] = payload[field];
    }
  }

  // -------------------------------------------
  // Completion timestamp management
  // -------------------------------------------

  if (Object.hasOwn(payload, "status")) {
    updates.status = payload.status;

    if (payload.status === "Completed") {
      if (task.status !== "Completed") {
        updates.completedAt = new Date();
      }
    } else {
      updates.completedAt = null;
    }
  }

  // Apply updates

  Object.assign(task, updates);

  await task.save();

  return task;
}
