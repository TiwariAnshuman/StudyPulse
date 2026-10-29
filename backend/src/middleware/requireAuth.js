import jwt from "jsonwebtoken";

import { env } from "../config/env.js";
import User from "../models/User.js";
import RefreshSession from "../models/RefreshSession.js";

export async function requireAuth(req, res, next) {
  const authorization = req.get("authorization");

  if (!authorization?.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      error: {
        code: "UNAUTHENTICATED",
        message: "Authentication is required.",
      },
    });
  }

  let payload;

  try {
    payload = jwt.verify(
      authorization.slice("Bearer ".length),
      env.JWT_SECRET,
      {
        issuer: "studypulse-api",
        audience: "studypulse-web",
      },
    );
  } catch {
    return res.status(401).json({
      success: false,
      error: {
        code: "INVALID_ACCESS_TOKEN",
        message: "Access token is invalid or expired.",
      },
    });
  }

  if (
    typeof payload === "string" ||
    !payload.sub ||
    !payload.sid ||
    typeof payload.tv !== "number"
  ) {
    return res.status(401).json({
      success: false,
      error: {
        code: "INVALID_ACCESS_TOKEN",
        message: "Access token is invalid or expired.",
      },
    });
  }

  try {
    const session = await RefreshSession.findOne({
      _id: payload.sid,
      userId: payload.sub,
      tokenVersion: payload.tv,
      revokedAt: null,
      expiresAt: { $gt: new Date() },
    }).select("_id");

    if (!session) {
      return res.status(401).json({
        success: false,
        error: {
          code: "SESSION_INVALID",
          message: "Your session is invalid or expired.",
        },
      });
    }

    const user = await User.findById(payload.sub)
      .select("_id tokenVersion");

    if (!user || user.tokenVersion !== payload.tv) {
      return res.status(401).json({
        success: false,
        error: {
          code: "SESSION_INVALID",
          message: "Your session is invalid or expired.",
        },
      });
    }

    req.auth = {
      userId: user._id.toString(),
      sessionId: session._id.toString(),
    };

    return next();
  } catch (error) {
    return next(error);
  }
}