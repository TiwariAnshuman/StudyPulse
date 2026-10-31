
import {
  getStudyAnalytics,
  getTaskAnalytics,
  getTestAnalytics,
  getHeatmapAnalytics,
  getInsightsAnalytics,
} from "./analytics.service.js";

const sendAnalyticsResponse = (res, message, data) => {
  return res.status(200).json({
    success: true,
    message,
    data,
  });
};

const getAnalyticsParams = (req) => ({
  ownerId: req.auth.userId,
  from: req.validated.query.from,
  to: req.validated.query.to,
});

export const getStudyAnalyticsController = async (req, res, next) => {
  try {
    const data = await getStudyAnalytics(getAnalyticsParams(req));

    return sendAnalyticsResponse(
      res,
      "Study analytics fetched successfully.",
      data
    );
  } catch (error) {
    return next(error);
  }
};

export const getTaskAnalyticsController = async (req, res, next) => {
  try {
    const data = await getTaskAnalytics(getAnalyticsParams(req));

    return sendAnalyticsResponse(
      res,
      "Task analytics fetched successfully.",
      data
    );
  } catch (error) {
    return next(error);
  }
};

export const getTestAnalyticsController = async (req, res, next) => {
  try {
    const data = await getTestAnalytics(getAnalyticsParams(req));

    return sendAnalyticsResponse(
      res,
      "Test analytics fetched successfully.",
      data
    );
  } catch (error) {
    return next(error);
  }
};

export const getHeatmapAnalyticsController = async (req, res, next) => {
  try {
    const data = await getHeatmapAnalytics(getAnalyticsParams(req));

    return sendAnalyticsResponse(
      res,
      "Heatmap analytics fetched successfully.",
      data
    );
  } catch (error) {
    return next(error);
  }
};

export const getInsightsController = async (req, res, next) => {
  try {
    const data = await getInsightsAnalytics(getAnalyticsParams(req));

    return sendAnalyticsResponse(
      res,
      "Insights fetched successfully.",
      data
    );
  } catch (error) {
    return next(error);
  }
};
