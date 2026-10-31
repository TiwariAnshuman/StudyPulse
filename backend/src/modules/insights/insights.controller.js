
import { getInsights } from "./insights.service.js";

export const getInsightsController = async (
  req,
  res,
  next
) => {
  try {
    const ownerId = req.auth.userId;

    const { from, to } = req.validated.query;

    const result = await getInsights(ownerId, {
      from,
      to,
    });

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    return next(error);
  }
};
