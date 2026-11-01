
import express from "express";
import cookieParser from "cookie-parser";

import { env } from "./config/env.js";
import healthRoutes from "./routes/health.routes.js";
import authRoutes from "./modules/auth/auth.routes.js";
import subjectRoutes from "./modules/subjects/subject.routes.js";
import taskRoutes from "./modules/Tasks/task.routes.js";
import studySessionRoutes from "./modules/StudySessions/studySession.routes.js";
import activeTimerRoutes from "./modules/studyTimer/activeTimer.routes.js";
import testRoutes from "./modules/tests/test.routes.js";
import userRoutes from "./modules/users/user.routes.js";
import {
  analyticsRouter,
  insightsRouter,
} from "./modules/analytics/analytics.routes.js";
import insightsRoutes from "./modules/insights/insights.routes.js";
import dashboardRoutes from "./modules/dashboard/dashboard.routes.js";
const app = express();

app.disable("x-powered-by");

// Parse JSON request bodies
app.use(express.json({ limit: "100kb" }));

// Restrict browser requests to the configured frontend origin
app.use((req, res, next) => {
  const origin = req.get("origin");

  if (origin === env.CLIENT_ORIGIN) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Vary", "Origin");
    res.setHeader(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization",
    );
    res.setHeader(
      "Access-Control-Allow-Methods",
      "GET, POST, PUT, PATCH, DELETE, OPTIONS",
    );
  }

  if (req.method === "OPTIONS") {
    if (origin && origin !== env.CLIENT_ORIGIN) {
      return res.sendStatus(403);
    }

    return res.sendStatus(204);
  }

  return next();
});

// Parse cookies before authentication routes
app.use(cookieParser());

// API routes
app.use("/api/v1/health", healthRoutes);
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/dashboard", dashboardRoutes);
app.use("/api/v1/subjects", subjectRoutes);
app.use("/api/v1/tasks", taskRoutes);
app.use("/api/v1/sessions", studySessionRoutes);
app.use("/api/v1/timer", activeTimerRoutes);
app.use("/api/v1/tests", testRoutes);
app.use("/api/v1/users", userRoutes);

app.use("/api/v1/analytics", analyticsRouter);
app.use("/api/v1/insights", insightsRouter);
app.use("/api/v1/insights", insightsRoutes);
// Unknown route
app.use((_req, res) => {
  return res.status(404).json({
    success: false,
    message: "Route not found",
    data: null,
  });
});

// Central error handler
app.use((error, _req, res, _next) => {
  const statusCode =
    Number.isInteger(error.statusCode) &&
    error.statusCode >= 400 &&
    error.statusCode <= 499
      ? error.statusCode
      : 500;

  if (statusCode === 500) {
    console.error("Unhandled application error:", error);
  }

  return res.status(statusCode).json({
    success: false,
    message:
      statusCode === 500
        ? "Internal server error"
        : error.message,
    data: null,
  });
});

export default app;
