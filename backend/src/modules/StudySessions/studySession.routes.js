
import { Router } from "express";

import { requireAuth } from "../../middleware/requireAuth.js";
import { validateRequest } from "../../middleware/validateRequest.js";

import {
  createStudySessionSchema,
} from "./studySession.validation.js";

import {
  createStudySession,
  getStudySessionHistory,
} from "./studySession.controller.js";

const router = Router();

// All study session routes require authentication.
router.use(requireAuth);

// Get study session history.
router.get("/", getStudySessionHistory);

// Create a manually recorded study session.
router.post(
  "/",
  validateRequest(createStudySessionSchema),
  createStudySession
);

export default router;
