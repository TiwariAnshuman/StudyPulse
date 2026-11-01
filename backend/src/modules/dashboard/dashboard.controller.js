import { getDashboard } from "./dashboard.service.js";

export const getDashboardController = async (req, res, next) => {
  try {
    const ownerId = req.auth.userId;

    const dashboard = await getDashboard(ownerId);

    return res.status(200).json({
      success: true,
      message: "Dashboard data fetched successfully.",
      data: dashboard,
    });
  } catch (error) {
    return next(error);
  }
};