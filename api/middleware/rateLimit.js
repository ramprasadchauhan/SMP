import { rateLimit } from "express-rate-limit";
import env from "../config/env.js";

const handler = (_req, res, _next, options) =>
  res.status(options.statusCode).json({
    success: false,
    code: "RATE_LIMITED",
    message: "Too many requests. Please wait a moment and try again.",
  });

const make = (windowMs, limit) =>
  rateLimit({
    windowMs,
    limit,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    skip: () => !env.RATE_LIMIT_ENABLED,
    handler,
  });

export const apiLimiter = make(60 * 1000, 300);
// Credential endpoints: slows brute force and credential stuffing.
export const authLimiter = make(15 * 60 * 1000, 20);
