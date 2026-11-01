import { Router } from "express";

import { requireAuth } from "../../middleware/requireAuth.js";

import {
  getDashboardController,
} from "./dashboard.controller.js";

const router = Router();

// All dashboard routes require authentication.
router.use(requireAuth);

// GET /api/v1/dashboard
router.get("/", getDashboardController);

export default router;