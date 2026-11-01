export class AppError extends Error {
  constructor(statusCode, message, { code, details } = {}) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.code = code || defaultCode(statusCode);
    this.details = details;
  }
}

function defaultCode(status) {
  return (
    {
      400: "BAD_REQUEST",
      401: "UNAUTHENTICATED",
      403: "FORBIDDEN",
      404: "NOT_FOUND",
      409: "CONFLICT",
      413: "PAYLOAD_TOO_LARGE",
      422: "VALIDATION_ERROR",
      429: "RATE_LIMITED",
      503: "SERVICE_UNAVAILABLE",
    }[status] || "INTERNAL_ERROR"
  );
}

export const badRequest = (message, opts) => new AppError(400, message, opts);
export const unauthorized = (message = "Authentication required", opts) =>
  new AppError(401, message, opts);
export const forbidden = (message = "You do not have permission to perform this action", opts) =>
  new AppError(403, message, opts);
export const notFound = (message = "Resource not found", opts) => new AppError(404, message, opts);
export const conflict = (message, opts) => new AppError(409, message, opts);
