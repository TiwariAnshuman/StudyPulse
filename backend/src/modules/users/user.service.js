
import User from "../../models/User.js";

const createServiceError = (
  message,
  statusCode = 400,
  code = "VALIDATION_ERROR"
) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.code = code;

  return error;
};

export const updateUserSettings = async (userId, payload) => {
  const user = await User.findById(userId).select(
    "displayName timezone examPreset dailyTargetMinutes heatmapThresholds"
  );

  if (!user) {
    throw createServiceError(
      "User account was not found.",
      404,
      "USER_NOT_FOUND"
    );
  }

  // Update only the settings explicitly provided.
  if (payload.displayName !== undefined) {
    user.displayName = payload.displayName;
  }

  if (payload.timezone !== undefined) {
    user.timezone = payload.timezone;
  }

  if (payload.examPreset !== undefined) {
    user.examPreset = payload.examPreset;
  }

  if (payload.dailyTargetMinutes !== undefined) {
    user.dailyTargetMinutes = payload.dailyTargetMinutes;
  }

  if (payload.heatmapThresholds !== undefined) {
    user.heatmapThresholds = payload.heatmapThresholds;
  }

  // Run Mongoose schema and nested threshold validation.
  await user.save();

  return {
    id: user._id.toString(),
    displayName: user.displayName,
    timezone: user.timezone,
    examPreset: user.examPreset ?? null,
    dailyTargetMinutes: user.dailyTargetMinutes ?? null,
    heatmapThresholds: {
      level1MaxMinutes:
        user.heatmapThresholds.level1MaxMinutes,
      level2MaxMinutes:
        user.heatmapThresholds.level2MaxMinutes,
      level3MaxMinutes:
        user.heatmapThresholds.level3MaxMinutes,
    },
  };
};
