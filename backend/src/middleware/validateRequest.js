
export function validateRequest(schema, source = "body") {
  return (req, res, next) => {
    const result = schema.safeParse(req[source]);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Request validation failed.",
          details: result.error.issues.map((issue) => ({
            field: issue.path.join("."),
            message: issue.message,
          })),
        },
      });
    }

    // Use validated and sanitized request data.
    if (source === "body") {
      req.body = result.data;
    } else {
      req.validated ??= {};
      req.validated[source] = result.data;
    }

    return next();
  };
}
