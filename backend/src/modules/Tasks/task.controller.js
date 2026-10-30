
import {
  createTask,
  getTasks,
  getTaskById,
  updateTask,
} from "./task.service.js";

// --------------------------------------------------
// CREATE TASK
// POST /api/v1/tasks
// --------------------------------------------------

export const createTaskController = async (req, res, next) => {
  try {
    const ownerId = req.auth.userId;

    const task = await createTask(ownerId, req.body);

    return res.status(201).json({
      success: true,
      message: "Task created successfully",
      data: task,
    });
  } catch (error) {
    next(error);
  }
};

// --------------------------------------------------
// GET ALL TASKS
// GET /api/v1/tasks
// --------------------------------------------------

export const getTasksController = async (req, res, next) => {
  try {
    const ownerId = req.auth.userId;

    const result = await getTasks(ownerId, req.query);

    return res.status(200).json({
      success: true,
      message: "Tasks fetched successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// --------------------------------------------------
// GET SINGLE TASK
// GET /api/v1/tasks/:taskId
// --------------------------------------------------

export const getTaskByIdController = async (req, res, next) => {
  try {
    const ownerId = req.auth.userId;
    const { taskId } = req.params;

    const task = await getTaskById(ownerId, taskId);

    return res.status(200).json({
      success: true,
      message: "Task fetched successfully",
      data: task,
    });
  } catch (error) {
    next(error);
  }
};

// --------------------------------------------------
// UPDATE TASK
// PATCH /api/v1/tasks/:taskId
// --------------------------------------------------

export const updateTaskController = async (req, res, next) => {
  try {
    const ownerId = req.auth.userId;
    const { taskId } = req.params;

    const task = await updateTask(
      ownerId,
      taskId,
      req.body
    );

    return res.status(200).json({
      success: true,
      message: "Task updated successfully",
      data: task,
    });
  } catch (error) {
    next(error);
  }
};
