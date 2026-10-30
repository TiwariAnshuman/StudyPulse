
import {
  startTimer,
  pauseTimer,
  resumeTimer,
  getActiveTimer,
  finishTimer,
  discardTimer,
} from "./activeTimer.service.js";

// START STUDY TIMER
export const startStudyTimer = async (req, res, next) => {
  try {
    const ownerId = req.auth.userId;

    const timer = await startTimer(ownerId, req.body);

    return res.status(201).json({
      success: true,
      message: "Study timer started successfully.",
      data: timer,
    });
  } catch (error) {
    next(error);
  }
};

// PAUSE STUDY TIMER
export const pauseStudyTimer = async (req, res, next) => {
  try {
    const ownerId = req.auth.userId;

    const timer = await pauseTimer(ownerId);

    return res.status(200).json({
      success: true,
      message: "Study timer paused successfully.",
      data: timer,
    });
  } catch (error) {
    next(error);
  }
};

// RESUME STUDY TIMER
export const resumeStudyTimer = async (req, res, next) => {
  try {
    const ownerId = req.auth.userId;

    const timer = await resumeTimer(ownerId);

    return res.status(200).json({
      success: true,
      message: "Study timer resumed successfully.",
      data: timer,
    });
  } catch (error) {
    next(error);
  }
};

// GET ACTIVE STUDY TIMER
export const getActiveStudyTimer = async (req, res, next) => {
  try {
    const ownerId = req.auth.userId;

    const timer = await getActiveTimer(ownerId);

    return res.status(200).json({
      success: true,
      message: timer
        ? "Active timer retrieved successfully."
        : "No active timer found.",
      data: timer,
    });
  } catch (error) {
    next(error);
  }
};

// FINISH TIMER AND CREATE STUDY SESSION
export const finishStudyTimer = async (req, res, next) => {
  try {
    const ownerId = req.auth.userId;

    const session = await finishTimer(ownerId, req.body);

    return res.status(200).json({
      success: true,
      message: "Study session saved successfully.",
      data: session,
    });
  } catch (error) {
    next(error);
  }
};

// DISCARD ACTIVE TIMER
export const discardStudyTimer = async (req, res, next) => {
  try {
    const ownerId = req.auth.userId;

    const timer = await discardTimer(ownerId);

    return res.status(200).json({
      success: true,
      message: "Study timer discarded successfully.",
      data: timer,
    });
  } catch (error) {
    next(error);
  }
};
