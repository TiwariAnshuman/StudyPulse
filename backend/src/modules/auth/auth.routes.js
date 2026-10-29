import { Router } from "express";
import rateLimit from "express-rate-limit";

import {
  register,
  login,
  refresh,
  logout,
  getMe,
} from "./auth.controller.js";

import { requireAuth } from "../../middleware/requireAuth.js";

const router = Router();
const authAttemptLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: "RATE_LIMITED",
      message: "Too many attempts. Please try again later.",
    },
  },
});

const refreshLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: "RATE_LIMITED",
      message: "Too many refresh attempts. Please try again later.",
    },
  },
});

router.post("/register", register);
router.post("/login", login);
router.post("/refresh", refresh);
router.post("/logout", logout);
router.get("/me", requireAuth, getMe);

export default router;