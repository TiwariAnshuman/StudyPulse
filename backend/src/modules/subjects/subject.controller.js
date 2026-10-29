
import {
  createSubject,
  listSubjects,
  updateSubject,
  deleteSubject,
} from "./subject.service.js";

import {
  createSubjectSchema,
  updateSubjectSchema,
} from "./subject.validation.js";
 import mongoose from "mongoose";

function subjectResponse(subject) {
  return {
    id: subject._id.toString(),
    name: subject.name,
    key: subject.key,
    color: subject.color,
    archivedAt: subject.archivedAt,
    createdAt: subject.createdAt,
    updatedAt: subject.updatedAt,
  };
}

export async function createSubjectController(req, res, next) {
  const validation = createSubjectSchema.safeParse(req.body);

  if (!validation.success) {
    return res.status(400).json({
      success: false,
      message: "Invalid subject data.",
      errors: validation.error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      })),
      data: null,
    });
  }

  try {
    const subject = await createSubject({
      ownerId: req.auth.userId,
      ...validation.data,
    });

    return res.status(201).json({
      success: true,
      message: "Subject created successfully.",
      data: subjectResponse(subject),
    });
  } catch (error) {
    if (error.statusCode === 409) {
      return res.status(409).json({
        success: false,
        message: error.message,
        code: error.code,
        data: null,
      });
    }

    return next(error);
  }
}

export async function listSubjectsController(req, res, next) {
  try {
    const subjects = await listSubjects({
      ownerId: req.auth.userId,
    });

    return res.status(200).json({
      success: true,
      message: "Subjects fetched successfully.",
      data: subjects.map(subjectResponse),
    });
  } catch (error) {
    return next(error);
  }
}



export async function updateSubjectController(req, res, next) {
  const { subjectId } = req.params;

  if (!mongoose.isValidObjectId(subjectId)) {
    return res.status(400).json({
      success: false,
      message: "Invalid subject ID.",
      code: "INVALID_SUBJECT_ID",
      data: null,
    });
  }

  const validation = updateSubjectSchema.safeParse(req.body);

  if (!validation.success) {
    return res.status(400).json({
      success: false,
      message: "Invalid subject update data.",
      errors: validation.error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      })),
      data: null,
    });
  }

  try {
    const subject = await updateSubject({
      ownerId: req.auth.userId,
      subjectId,
      updates: validation.data,
    });

    return res.status(200).json({
      success: true,
      message: "Subject updated successfully.",
      data: subjectResponse(subject),
    });
  } catch (error) {
    if (error.statusCode === 404 || error.statusCode === 409) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
        code: error.code,
        data: null,
      });
    }

    return next(error);
  }
}


export async function deleteSubjectController(req, res, next) {
  const { subjectId } = req.params;

  if (!mongoose.isValidObjectId(subjectId)) {
    return res.status(400).json({
      success: false,
      message: "Invalid subject ID.",
      code: "INVALID_SUBJECT_ID",
      data: null,
    });
  }

  try {
    await deleteSubject({
      ownerId: req.auth.userId,
      subjectId,
    });

    return res.status(200).json({
      success: true,
      message: "Subject deleted successfully.",
      data: {
        id: subjectId,
      },
    });
  } catch (error) {
    if (error.statusCode === 404) {
      return res.status(404).json({
        success: false,
        message: error.message,
        code: error.code,
        data: null,
      });
    }

    return next(error);
  }
}