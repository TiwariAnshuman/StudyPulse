
import { Router } from "express";

import { requireAuth } from "../../middleware/requireAuth.js";
import { validateRequest } from "../../middleware/validateRequest.js";

import {
  createTaskSchema,
  updateTaskSchema,
} from "./task.validation.js";

import {
  createTaskController,
  getTasksController,
  getTaskByIdController,
  updateTaskController,
} from "./task.controller.js";

const router = Router();

// All task routes require authentication.
router.use(requireAuth);

// Get all tasks with filters.
router.get("/", getTasksController);

// Create a task.
router.post(
  "/",
  validateRequest(createTaskSchema),
  createTaskController,
);

// Get a single task.
router.get("/:taskId", getTaskByIdController);

// Update a task.
router.patch(
  "/:taskId",
  validateRequest(updateTaskSchema),
  updateTaskController,
);

export default router;
