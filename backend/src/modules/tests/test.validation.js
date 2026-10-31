
import { z } from "zod";

// -------------------------
// COMMON VALIDATORS
// -------------------------

const dateOnlySchema = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format.")
  .refine((value) => {
    const [year, month, day] = value.split("-").map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));

    return (
      date.getUTCFullYear() === year &&
      date.getUTCMonth() === month - 1 &&
      date.getUTCDate() === day
    );
  }, "Please provide a valid calendar date.");

const scoringSchemeSchema = z
  .object({
    marksPerCorrect: z.number().finite().nonnegative().optional(),
    penaltyPerIncorrect: z.number().finite().max(0).optional(),
  })
  .strict()
  .nullable();

const countsSchema = z
  .object({
    correct: z.number().int().nonnegative().optional(),
    incorrect: z.number().int().nonnegative().optional(),
    unanswered: z.number().int().nonnegative().optional(),
  })
  .strict()
  .nullable();

const subjectResultSchema = z
  .object({
    subjectName: z.string().trim().min(1, "Subject name is required."),
    marksObtained: z.number().finite(),
    maxMarks: z.number().finite().positive(),
  })
  .strict()
  .superRefine((subject, ctx) => {
    if (subject.marksObtained > subject.maxMarks) {
      ctx.addIssue({
        code: "custom",
        path: ["marksObtained"],
        message: "Subject marks cannot exceed subject maximum marks.",
      });
    }
  });

const subjectResultsSchema = z
  .array(subjectResultSchema)
  .min(1, "Add at least one subject result or use null.")
  .nullable();

// -------------------------
// COMMON TEST FIELDS
// -------------------------

const testFieldsSchema = z
  .object({
    name: z.string().trim().min(1).max(100),

    testDate: dateOnlySchema,

    marksObtained: z.number().finite(),

    maxMarks: z.number().finite().positive(),

    examType: z.string().trim().optional(),

    scoringScheme: scoringSchemeSchema.optional(),

    counts: countsSchema.optional(),

    durationMinutes: z.number().int().positive().optional(),

    subjectResults: subjectResultsSchema.optional(),

    notes: z.string().trim().optional(),

    linkedSessionId: z
      .string()
      .regex(/^[a-fA-F0-9]{24}$/, "Invalid session ID.")
      .nullable()
      .optional(),

    linkedTaskIds: z
      .array(z.string().regex(/^[a-fA-F0-9]{24}$/, "Invalid task ID."))
      .optional(),
  })
  .strict();

// -------------------------
// SHARED CREATE VALIDATION
// -------------------------

const validateCompleteTestPayload = (data, ctx) => {
  // Overall marks validation
  if (data.marksObtained > data.maxMarks) {
    ctx.addIssue({
      code: "custom",
      path: ["marksObtained"],
      message: "Marks obtained cannot exceed maximum marks.",
    });
  }

  // Negative marking validation
  if (data.marksObtained < 0) {
    if (!(data.scoringScheme?.penaltyPerIncorrect < 0)) {
      ctx.addIssue({
        code: "custom",
        path: ["scoringScheme", "penaltyPerIncorrect"],
        message: "Negative marks require a negative marking scheme.",
      });
    }

    if (!(data.counts?.incorrect > 0)) {
      ctx.addIssue({
        code: "custom",
        path: ["counts", "incorrect"],
        message: "Negative marks require incorrect answers.",
      });
    }
  }

  // Subject-wise validation
  if (data.subjectResults?.length) {
    const totalSubjectMarks = data.subjectResults.reduce(
      (sum, subject) => sum + subject.marksObtained,
      0
    );

    if (
      Number(totalSubjectMarks.toFixed(2)) !==
      Number(data.marksObtained.toFixed(2))
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["subjectResults"],
        message: "Subject-wise marks must equal overall marks obtained.",
      });
    }

    // Duplicate subject names
    const subjectNames = data.subjectResults.map((subject) =>
      subject.subjectName.toLowerCase()
    );

    if (new Set(subjectNames).size !== subjectNames.length) {
      ctx.addIssue({
        code: "custom",
        path: ["subjectResults"],
        message: "Duplicate subject names are not allowed.",
      });
    }

    // Subject maximum marks validation
    const totalSubjectMaxMarks = data.subjectResults.reduce(
      (sum, subject) => sum + subject.maxMarks,
      0
    );

    if (
      Number(totalSubjectMaxMarks.toFixed(2)) >
      Number(data.maxMarks.toFixed(2))
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["subjectResults"],
        message:
          "Subject maximum marks cannot exceed overall maximum marks.",
      });
    }
  }
};

// -------------------------
// CREATE TEST VALIDATION
// -------------------------

const createTestSchema = testFieldsSchema.superRefine(
  validateCompleteTestPayload
);

// -------------------------
// PATCH TEST VALIDATION
// -------------------------

const updateTestSchema = testFieldsSchema
  .partial()
  .strict()
  .superRefine((data, ctx) => {
    if (Object.keys(data).length === 0) {
      ctx.addIssue({
        code: "custom",
        message:
          "At least one field is required to update a test result.",
      });
    }
  });

// -------------------------
// LIST QUERY VALIDATION
// -------------------------

const listTestsQuerySchema = z
  .object({
    from: dateOnlySchema.optional(),

    to: dateOnlySchema.optional(),

    examType: z.string().trim().optional(),

    page: z.coerce.number().int().min(1).default(1),

    limit: z.coerce.number().int().min(1).max(100).default(20),
  })
  .strict()
  .superRefine((data, ctx) => {
    if (data.from && data.to && data.from > data.to) {
      ctx.addIssue({
        code: "custom",
        path: ["from"],
        message: "'from' date cannot be later than 'to' date.",
      });
    }
  });

// -------------------------
// TEST ID PARAM VALIDATION
// -------------------------

const testIdParamsSchema = z
  .object({
    testId: z.string().regex(/^[a-fA-F0-9]{24}$/, "Invalid test ID."),
  })
  .strict();

// -------------------------
// VALIDATION RESPONSE HELPER
// -------------------------

const sendValidationError = (res, result) => {
  const fields = {};

  for (const issue of result.error.issues) {
    const field = issue.path.join(".") || "body";

    if (!fields[field]) {
      fields[field] = issue.message;
    }
  }

  return res.status(400).json({
    success: false,
    error: {
      code: "VALIDATION_ERROR",
      message: "Please correct the highlighted fields.",
      fields,
    },
  });
};

// -------------------------
// CREATE MIDDLEWARE
// -------------------------

export const validateCreateTest = (req, res, next) => {
  const result = createTestSchema.safeParse(req.body);

  if (!result.success) {
    return sendValidationError(res, result);
  }

  req.body = result.data;

  next();
};

// -------------------------
// UPDATE MIDDLEWARE
// -------------------------

export const validateUpdateTest = (req, res, next) => {
  const result = updateTestSchema.safeParse(req.body);

  if (!result.success) {
    return sendValidationError(res, result);
  }

  req.body = result.data;

  next();
};

// -------------------------
// LIST MIDDLEWARE
// -------------------------

export const validateListTests = (req, res, next) => {
  const result = listTestsQuerySchema.safeParse(req.query);

  if (!result.success) {
    return sendValidationError(res, result);
  }

  req.validatedQuery = result.data;

  next();
};

// -------------------------
// TEST ID MIDDLEWARE
// -------------------------

export const validateTestId = (req, res, next) => {
  const result = testIdParamsSchema.safeParse(req.params);

  if (!result.success) {
    return sendValidationError(res, result);
  }

  req.validatedParams = result.data;

  next();
};
