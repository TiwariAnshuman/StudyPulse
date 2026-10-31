
import { Router } from "express";

import { requireAuth } from "../../middleware/requireAuth.js";
import { validateRequest } from "../../middleware/validateRequest.js";

import {
  analyticsDateRangeSchema,
} from "./analytics.validation.js";

import {
  getStudyAnalyticsController,
  getTaskAnalyticsController,
  getTestAnalyticsController,
  getHeatmapAnalyticsController,
  getInsightsController,
} from "./analytics.controller.js";

const analyticsRouter = Router();
const insightsRouter = Router();

// All analytics endpoints require authentication.
analyticsRouter.use(requireAuth);
insightsRouter.use(requireAuth);

// Shared date-range validation middleware.
const validateAnalyticsRange = validateRequest(
  analyticsDateRangeSchema,
  "query"
);

// GET /api/v1/analytics/study
analyticsRouter.get(
  "/study",
  validateAnalyticsRange,
  getStudyAnalyticsController
);

// GET /api/v1/analytics/tasks
analyticsRouter.get(
  "/tasks",
  validateAnalyticsRange,
  getTaskAnalyticsController
);

// GET /api/v1/analytics/tests
analyticsRouter.get(
  "/tests",
  validateAnalyticsRange,
  getTestAnalyticsController
);

// GET /api/v1/analytics/heatmap
analyticsRouter.get(
  "/heatmap",
  validateAnalyticsRange,
  getHeatmapAnalyticsController
);

// GET /api/v1/insights
insightsRouter.get(
  "/",
  validateAnalyticsRange,
  getInsightsController
);

export {
  analyticsRouter,
  insightsRouter,
};
