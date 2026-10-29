
import { Router } from "express";

import { requireAuth } from "../../middleware/requireAuth.js";

import {
  createSubjectController,
  listSubjectsController,
  updateSubjectController,
  deleteSubjectController,
} from "./subject.controller.js";

const router = Router();

// All subject routes require authentication.
router.use(requireAuth);

router.get("/", listSubjectsController);
router.post("/", createSubjectController);
router.patch("/:subjectId", updateSubjectController);
router.delete("/:subjectId", deleteSubjectController);

export default router;
