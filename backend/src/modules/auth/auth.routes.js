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

router.post("/register", authAttemptLimiter, register);
router.post("/login", authAttemptLimiter, login);
router.post("/refresh", refreshLimiter, refresh);
router.post("/logout", requireAuth, logout);
router.get("/me", requireAuth, getMe);

export default router;