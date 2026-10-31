import { updateUserSettings } from "./user.service.js";

export const updateMySettings = async (req, res, next) => {
  try {
    const updatedSettings = await updateUserSettings(
      req.auth.userId,
      req.body
    );

    return res.status(200).json({
      success: true,
      message: "User settings updated successfully.",
      data: updatedSettings,
    });
  } catch (error) {
    next(error);
  }
};