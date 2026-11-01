import { AppError } from "../utils/AppError.js";

// Validates and coerces request parts with zod schemas. Parsed values are
// exposed on `req.valid` so handlers never read raw, unvalidated input.
export const validate = (schemas) => (req, _res, next) => {
  req.valid = {};
  const details = [];
  for (const part of ["params", "query", "body"]) {
    if (!schemas[part]) continue;
    const result = schemas[part].safeParse(req[part] ?? {});
    if (result.success) {
      req.valid[part] = result.data;
    } else {
      for (const issue of result.error.issues) {
        details.push({ location: part, field: issue.path.join(".") || null, message: issue.message });
      }
    }
  }
  if (details.length) {
    return next(new AppError(422, details[0].message, { code: "VALIDATION_ERROR", details }));
  }
  next();
};
