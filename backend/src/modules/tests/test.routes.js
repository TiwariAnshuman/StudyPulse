import { Router } from "express";

import { requireAuth } from "../../middleware/requireAuth.js";

import {
  validateCreateTest,
  validateUpdateTest,
  validateListTests,
  validateTestId,
} from "./test.validation.js";

import {
  createTest,
  listTests,
  getTest,
  updateTest,
  deleteTest,
} from "./test.controller.js";

const router = Router();

// GET /api/v1/tests
// List test results with filters and pagination.
router.get(
  "/",
  requireAuth,
  validateListTests,
  listTests
);

// POST /api/v1/tests
// Create a test result.
router.post(
  "/",
  requireAuth,
  validateCreateTest,
  createTest
);

// GET /api/v1/tests/:testId
// Fetch one test result.
router.get(
  "/:testId",
  requireAuth,
  validateTestId,
  getTest
);

// PATCH /api/v1/tests/:testId
// Partially update a test result.
router.patch(
  "/:testId",
  requireAuth,
  validateTestId,
  validateUpdateTest,
  updateTest
);

// DELETE /api/v1/tests/:testId
// Delete a test result.
router.delete(
  "/:testId",
  requireAuth,
  validateTestId,
  deleteTest
);

export default router;