
import express from "express";
import cookieParser from "cookie-parser";

import { env } from "./config/env.js";
import healthRoutes from "./routes/health.routes.js";
import authRoutes from "./modules/auth/auth.routes.js";
import subjectRoutes from "./modules/subjects/subject.routes.js";
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
app.use("/api/v1/subjects", subjectRoutes);

// Unknown route
app.use((_req, res) => {
  return res.status(404).json({
    success: false,
    message: "Route not found",
    data: null,
  });
});

// Unexpected errors
app.use((error, _req, res, _next) => {
  console.error("Unhandled application error:", error.message);

  return res.status(500).json({
    success: false,
    message: "Internal server error",
    data: null,
  });
});

export default app;
