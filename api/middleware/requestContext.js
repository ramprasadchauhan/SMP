import crypto from "node:crypto";
import { logger } from "../utils/logger.js";

const VALID_ID = /^[A-Za-z0-9._-]{8,64}$/;

// Assigns a correlation id to every request and logs one line per response.
export const requestContext = (req, res, next) => {
  const incoming = req.get("x-request-id");
  req.id = incoming && VALID_ID.test(incoming) ? incoming : crypto.randomUUID();
  res.setHeader("X-Request-Id", req.id);

  const start = process.hrtime.bigint();
  res.on("finish", () => {
    const durationMs = Number(process.hrtime.bigint() - start) / 1e6;
    const level = res.statusCode >= 500 ? "error" : res.statusCode >= 400 ? "warn" : "info";
    logger[level]("request", {
      requestId: req.id,
      method: req.method,
      path: req.originalUrl.split("?")[0],
      status: res.statusCode,
      durationMs: Math.round(durationMs * 10) / 10,
      userId: req.user?.id,
    });
  });
  next();
};
