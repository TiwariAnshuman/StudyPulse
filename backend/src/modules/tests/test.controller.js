import {
  createTestResult,
  getTestResults,
  getTestResultById,
  updateTestResult,
  deleteTestResult,
} from "./test.service.js";

// -------------------------
// CREATE TEST
// POST /api/v1/tests
// -------------------------

export const createTest = async (req, res, next) => {
  try {
    const ownerId = req.auth?.userId;

    if (!ownerId) {
      const error = new Error("Authentication is required.");
      error.statusCode = 401;
      error.code = "UNAUTHENTICATED";
      throw error;
    }

    const testResult = await createTestResult(ownerId, req.body);

    return res.status(201).json({
      success: true,
      message: "Test result created successfully.",
      data: testResult,
    });
  } catch (error) {
    next(error);
  }
};

// -------------------------
// GET ALL TESTS
// GET /api/v1/tests
// -------------------------

export const listTests = async (req, res, next) => {
  try {
    const ownerId = req.auth?.userId;

    if (!ownerId) {
      const error = new Error("Authentication is required.");
      error.statusCode = 401;
      error.code = "UNAUTHENTICATED";
      throw error;
    }

    const result = await getTestResults(
      ownerId,
      req.validatedQuery
    );

    return res.status(200).json({
      success: true,
      message: "Test results fetched successfully.",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// -------------------------
// GET SINGLE TEST
// GET /api/v1/tests/:testId
// -------------------------

export const getTest = async (req, res, next) => {
  try {
    const ownerId = req.auth?.userId;

    if (!ownerId) {
      const error = new Error("Authentication is required.");
      error.statusCode = 401;
      error.code = "UNAUTHENTICATED";
      throw error;
    }

    const { testId } = req.validatedParams;

    const testResult = await getTestResultById(
      ownerId,
      testId
    );

    return res.status(200).json({
      success: true,
      message: "Test result fetched successfully.",
      data: testResult,
    });
  } catch (error) {
    next(error);
  }
};

// -------------------------
// UPDATE TEST
// PATCH /api/v1/tests/:testId
// -------------------------

export const updateTest = async (req, res, next) => {
  try {
    const ownerId = req.auth?.userId;

    if (!ownerId) {
      const error = new Error("Authentication is required.");
      error.statusCode = 401;
      error.code = "UNAUTHENTICATED";
      throw error;
    }

    const { testId } = req.validatedParams;

    const testResult = await updateTestResult(
      ownerId,
      testId,
      req.body
    );

    return res.status(200).json({
      success: true,
      message: "Test result updated successfully.",
      data: testResult,
    });
  } catch (error) {
    next(error);
  }
};

// -------------------------
// DELETE TEST
// DELETE /api/v1/tests/:testId
// -------------------------

export const deleteTest = async (req, res, next) => {
  try {
    const ownerId = req.auth?.userId;

    if (!ownerId) {
      const error = new Error("Authentication is required.");
      error.statusCode = 401;
      error.code = "UNAUTHENTICATED";
      throw error;
    }

    const { testId } = req.validatedParams;

    await deleteTestResult(ownerId, testId);

    return res.status(200).json({
      success: true,
      message: "Test result deleted successfully.",
      data: null,
    });
  } catch (error) {
    next(error);
  }
};