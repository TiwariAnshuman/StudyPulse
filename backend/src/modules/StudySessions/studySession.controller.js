
import {
  createManualStudySession,
  getStudySessions,
} from "./studySession.service.js";

// Create a manually recorded study session.
export const createStudySession = async (req, res, next) => {
  try {
    const ownerId = req.auth.userId;

    const session = await createManualStudySession(
      ownerId,
      req.body
    );

    return res.status(201).json({
      success: true,
      message: "Study session created successfully",
      data: session,
    });
  } catch (error) {
    next(error);
  }
};

// Get study session history.
export const getStudySessionHistory = async (req, res, next) => {
  try {
    const ownerId = req.auth.userId;

    const result = await getStudySessions(
      ownerId,
      req.query
    );

    return res.status(200).json({
      success: true,
      message: "Study sessions fetched successfully",
      data: result.sessions,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
};
