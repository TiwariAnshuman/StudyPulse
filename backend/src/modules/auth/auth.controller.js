
import { env } from "../../config/env.js";
import User from "../../models/User.js";

import {
  registerUser,
  loginUser,
  refreshUserSession,
  logoutUser,
} from "./auth.service.js";

import {
  registerSchema,
  loginSchema,
} from "./auth.validation.js";

const REFRESH_COOKIE = "sp_refresh";

function cookieOptions() {
  return {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/api/v1/auth",
  };
}

function setRefreshCookie(res, token, expiresAt) {
  const maxAge = Math.max(0, expiresAt.getTime() - Date.now());

  res.cookie(REFRESH_COOKIE, token, {
    ...cookieOptions(),
    maxAge,
  });
}

function clearRefreshCookie(res) {
  res.clearCookie(REFRESH_COOKIE, cookieOptions());
}

function originIsAllowed(req, res) {
  const origin = req.get("origin");

  // Non-browser clients such as Postman may omit Origin.
  // If a browser sends it, it must match the configured frontend.
  if (origin && origin !== env.CLIENT_ORIGIN) {
    res.status(403).json({
      success: false,
      error: {
        code: "ORIGIN_NOT_ALLOWED",
        message: "Request origin is not allowed.",
      },
    });

    return false;
  }

  return true;
}

function sendInvalidRefreshResponse(res) {
  clearRefreshCookie(res);

  return res.status(401).json({
    success: false,
    error: {
      code: "INVALID_REFRESH_TOKEN",
      message: "Your session is invalid or expired. Please log in again.",
    },
  });
}

export async function register(req, res, next) {
  const validation = registerSchema.safeParse(req.body);

  if (!validation.success) {
    return res.status(400).json({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Please correct the submitted fields.",
        fields: validation.error.flatten().fieldErrors,
      },
    });
  }

  try {
    const user = await registerUser(validation.data);

    return res.status(201).json({
      success: true,
      message: "Account created successfully.",
      data: { user },
    });
  } catch (error) {
    if (error.code === "EMAIL_ALREADY_EXISTS") {
      return res.status(409).json({
        success: false,
        error: {
          code: "CONFLICT",
          message: "Unable to create an account with these details.",
        },
      });
    }

    return next(error);
  }
}

export async function login(req, res, next) {
  const validation = loginSchema.safeParse(req.body);

  if (!validation.success) {
    return res.status(400).json({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Please correct the submitted fields.",
        fields: validation.error.flatten().fieldErrors,
      },
    });
  }

  try {
    const result = await loginUser(validation.data);

    setRefreshCookie(res, result.refreshToken, result.expiresAt);

    return res.status(200).json({
      success: true,
      message: "Login successful.",
      data: {
        user: result.user,
        accessToken: result.accessToken,
        expiresIn: 900,
      },
    });
  } catch (error) {
    if (error.code === "INVALID_CREDENTIALS") {
      return res.status(401).json({
        success: false,
        error: {
          code: "INVALID_CREDENTIALS",
          message: "Invalid email or password.",
        },
      });
    }

    return next(error);
  }
}

export async function refresh(req, res, next) {
  if (!originIsAllowed(req, res)) return;

  const rawRefreshToken = req.cookies?.[REFRESH_COOKIE];

  if (!rawRefreshToken) {
    return sendInvalidRefreshResponse(res);
  }

  try {
    const result = await refreshUserSession(rawRefreshToken);

    setRefreshCookie(res, result.refreshToken, result.expiresAt);

    return res.status(200).json({
      success: true,
      message: "Session refreshed.",
      data: {
        user: result.user,
        accessToken: result.accessToken,
        expiresIn: 900,
      },
    });
  } catch (error) {
    if (error.code === "INVALID_REFRESH_TOKEN") {
      return sendInvalidRefreshResponse(res);
    }

    return next(error);
  }
}

export async function logout(req, res, next) {
  if (!originIsAllowed(req, res)) return;

  try {
    await logoutUser(req.cookies?.[REFRESH_COOKIE]);
    clearRefreshCookie(res);

    return res.status(200).json({
      success: true,
      message: "Logged out successfully.",
    });
  } catch (error) {
    return next(error);
  }
}

export async function getMe(req, res, next) {
  try {
    const user = await User.findById(req.auth.userId);

    if (!user) {
      return res.status(401).json({
        success: false,
        error: {
          code: "UNAUTHENTICATED",
          message: "Please log in again.",
        },
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        user: {
          id: user._id.toString(),
          displayName: user.displayName,
          email: user.emailNormalized,

          // Profile settings
          timezone: user.timezone,
          examPreset: user.examPreset ?? null,

          // Optional daily study target
          dailyTargetMinutes: user.dailyTargetMinutes ?? null,

          // Heatmap intensity boundaries
          heatmapThresholds: {
            level1MaxMinutes:
              user.heatmapThresholds.level1MaxMinutes,
            level2MaxMinutes:
              user.heatmapThresholds.level2MaxMinutes,
            level3MaxMinutes:
              user.heatmapThresholds.level3MaxMinutes,
          },

          createdAt: user.createdAt,
        },
      },
    });
  } catch (error) {
    return next(error);
  }
}
