
import { Router } from "express";

import { requireAuth } from "../../middleware/requireAuth.js";
import { validateRequest } from "../../middleware/validateRequest.js";

import {
  analyticsDateRangeSchema,
} from "../analytics/analytics.validation.js";

import {
  getInsightsController,
} from "./insights.controller.js";

const router = Router();

// Authentication required.
router.use(requireAuth);

// Validate from and to query parameters.
router.get(
  "/",
  validateRequest(
    analyticsDateRangeSchema,
    "query"
  ),
  getInsightsController
);

export default router;
