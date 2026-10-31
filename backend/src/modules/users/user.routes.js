import { Router } from "express";

import { requireAuth } from "../../middleware/requireAuth.js";
import { validateRequest } from "../../middleware/validateRequest.js";

import {
  updateMySettings,
} from "./user.controller.js";

import {
  updateUserSettingsSchema,
} from "./user.validation.js";

const router = Router();

router.use(requireAuth);

router.patch(
  "/me",
  validateRequest(updateUserSettingsSchema),
  updateMySettings
);

export default router;