
import Subject from "../../models/Subject.js";

function createSubjectError(message, statusCode, code) {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.code = code;
  return error;
}

function normalizeSubjectName(name) {
  return name.trim().replace(/\s+/g, " ");
}

function createSubjectKey(name) {
  return normalizeSubjectName(name).toLowerCase();
}

export async function createSubject({ ownerId, name, color }) {
  const normalizedName = normalizeSubjectName(name);
  const key = createSubjectKey(normalizedName);

  try {
    // Check for an existing subject belonging to this user.
    const existingSubject = await Subject.findOne({
      ownerId,
      key,
    }).select("_id");

    if (existingSubject) {
      throw createSubjectError(
        "A subject with this name already exists.",
        409,
        "SUBJECT_ALREADY_EXISTS"
      );
    }

    // ownerId must come from the authenticated server context.
    const subjectData = {
      ownerId,
      name: normalizedName,
      key,
    };

    if (color !== undefined) {
      subjectData.color = color;
    }

    const subject = await Subject.create(subjectData);

    return subject;
  } catch (error) {
    // Handles duplicate-key errors caused by concurrent requests too.
    if (error.code === 11000) {
      throw createSubjectError(
        "A subject with this name already exists.",
        409,
        "SUBJECT_ALREADY_EXISTS"
      );
    }

    throw error;
  }
}

export async function listSubjects({ ownerId }) {
  return Subject.find({
    ownerId,
    archivedAt: null,
  }).sort({ name: 1 });
}



export async function updateSubject({
  ownerId,
  subjectId,
  updates,
}) {
  try {
    // Only find a subject owned by the authenticated user.
    const subject = await Subject.findOne({
      _id: subjectId,
      ownerId,
    });

    // Return the same result for missing and other users' subjects.
    if (!subject) {
      const error = new Error("Subject not found.");
      error.statusCode = 404;
      error.code = "SUBJECT_NOT_FOUND";
      throw error;
    }

    if (updates.name !== undefined) {
      const normalizedName = normalizeSubjectName(updates.name);
      const key = createSubjectKey(normalizedName);

      const duplicate = await Subject.findOne({
        ownerId,
        key,
        _id: { $ne: subject._id },
      }).select("_id");

      if (duplicate) {
        const error = new Error(
          "A subject with this name already exists."
        );
        error.statusCode = 409;
        error.code = "SUBJECT_ALREADY_EXISTS";
        throw error;
      }

      subject.name = normalizedName;
      subject.key = key;
    }

    if (updates.color !== undefined) {
      subject.color = updates.color;
    }

    if (updates.archived !== undefined) {
      subject.archivedAt = updates.archived
        ? new Date()
        : null;
    }

    return await subject.save();
  } catch (error) {
    if (error.code === 11000) {
      const conflict = new Error(
        "A subject with this name already exists."
      );
      conflict.statusCode = 409;
      conflict.code = "SUBJECT_ALREADY_EXISTS";
      throw conflict;
    }

    throw error;
  }
}


export async function deleteSubject({ ownerId, subjectId }) {
  const subject = await Subject.findOne({
    _id: subjectId,
    ownerId,
  });

  if (!subject) {
    const error = new Error("Subject not found.");
    error.statusCode = 404;
    error.code = "SUBJECT_NOT_FOUND";
    throw error;
  }

  await Subject.deleteOne({
    _id: subject._id,
    ownerId,
  });

  return subject._id;
}