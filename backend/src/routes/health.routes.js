import { Router } from "express";
import mongoose from "mongoose";

const router = Router();

router.get("/", (_req, res) => {
  const databaseConnected = mongoose.connection.readyState === 1;

  return res.status(databaseConnected ? 200 : 503).json({
    success: databaseConnected,
    message: databaseConnected
      ? "StudyPulse API is healthy"
      : "Database connection is unavailable",
    data: {
      api: "ok",
      database: databaseConnected ? "connected" : "disconnected",
    },
  });
});

export default router;