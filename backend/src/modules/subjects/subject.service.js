
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

    const subjectData = {
      ownerId,
      name: normalizedName,
      key,
    };

    if (color !== undefined) {
      subjectData.color = color;
    }

    return await Subject.create(subjectData);
  } catch (error) {
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

export async function listSubjects({
  ownerId,
  includeArchived = false,
}) {
  const filter = { ownerId };

  // Default: only active subjects.
  // If includeArchived is true, return active and archived subjects.
  if (!includeArchived) {
    filter.archivedAt = null;
  }

  return Subject.find(filter).sort({ name: 1 });
}

export async function updateSubject({
  ownerId,
  subjectId,
  updates,
}) {
  try {
    const subject = await Subject.findOne({
      _id: subjectId,
      ownerId,
    });

    if (!subject) {
      throw createSubjectError(
        "Subject not found.",
        404,
        "SUBJECT_NOT_FOUND"
      );
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
        throw createSubjectError(
          "A subject with this name already exists.",
          409,
          "SUBJECT_ALREADY_EXISTS"
        );
      }

      subject.name = normalizedName;
      subject.key = key;
    }

    if (updates.color !== undefined) {
      subject.color = updates.color;
    }

    // archived: true  -> archive the subject
    // archived: false -> restore the subject
    if (updates.archived !== undefined) {
      subject.archivedAt = updates.archived
        ? new Date()
        : null;
    }

    return await subject.save();
  } catch (error) {
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

export async function deleteSubject({ ownerId, subjectId }) {
  const subject = await Subject.findOne({
    _id: subjectId,
    ownerId,
  });

  if (!subject) {
    throw createSubjectError(
      "Subject not found.",
      404,
      "SUBJECT_NOT_FOUND"
    );
  }

  await Subject.deleteOne({
    _id: subject._id,
    ownerId,
  });

  return subject._id;
}
