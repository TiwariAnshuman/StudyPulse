
import { Router } from "express";

import { requireAuth } from "../../middleware/requireAuth.js";
import { validateRequest } from "../../middleware/validateRequest.js";

import { startTimerSchema } from "./activeTimer.validation.js";

import {
  startStudyTimer,
  pauseStudyTimer,
  resumeStudyTimer,
  getActiveStudyTimer,
  finishStudyTimer,
  discardStudyTimer,
} from "./activeTimer.controller.js";

const router = Router();

// All timer routes require authentication.
router.use(requireAuth);

// GET ACTIVE TIMER
router.get("/active", getActiveStudyTimer);

// START TIMER
router.post(
  "/start",
  validateRequest(startTimerSchema),
  startStudyTimer
);

// PAUSE TIMER
router.patch("/pause", pauseStudyTimer);

// RESUME TIMER
router.patch("/resume", resumeStudyTimer);

// FINISH TIMER AND SAVE STUDY SESSION
router.post("/finish", finishStudyTimer);

// DISCARD TIMER
router.post("/discard", discardStudyTimer);

export default router;
