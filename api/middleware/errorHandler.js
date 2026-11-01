import mongoose from "mongoose";
import env from "../config/env.js";
import { AppError, notFound } from "../utils/AppError.js";
import { logger } from "../utils/logger.js";

export const apiNotFound = (req, _res, next) =>
  next(
    notFound(`Route ${req.method} ${req.originalUrl.split("?")[0]} not found`, {
      code: "ROUTE_NOT_FOUND",
    })
  );

function normalise(err) {
  if (err instanceof AppError) return err;
  if (err instanceof mongoose.Error.ValidationError) {
    const details = Object.values(err.errors).map((e) => ({ field: e.path, message: e.message }));
    return new AppError(422, details[0]?.message || "Validation failed", {
      code: "VALIDATION_ERROR",
      details,
    });
  }
  if (err instanceof mongoose.Error.CastError) {
    return new AppError(400, `Invalid value for ${err.path}`, { code: "INVALID_ID" });
  }
  if (err?.code === 11000) {
    const field = Object.keys(err.keyPattern || {})[0];
    return new AppError(
      409,
      field === "email" ? "An account with this email already exists" : "Duplicate value",
      { code: "DUPLICATE" }
    );
  }
  if (err?.type === "entity.parse.failed") {
    return new AppError(400, "Malformed JSON body", { code: "INVALID_JSON" });
  }
  if (err?.type === "entity.too.large") return new AppError(413, "Request body is too large");
  return null;
}

// eslint-disable-next-line no-unused-vars
export const errorHandler = (err, req, res, _next) => {
  const known = normalise(err);
  const status = known?.statusCode || 500;

  if (status >= 500) {
    logger.error("Unhandled error", { requestId: req.id, error: err });
  }

  const body = {
    success: false,
    code: known?.code || "INTERNAL_ERROR",
    // Unknown errors never leak internals to clients.
    message: known ? known.message : "Something went wrong. Please try again later.",
    requestId: req.id,
  };
  if (known?.details) body.details = known.details;
  if (!known && !env.isProduction) body.debug = { message: err?.message, stack: err?.stack };

  res.status(status).json(body);
};
