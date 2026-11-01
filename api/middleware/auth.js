import jwt from "jsonwebtoken";
import env from "../config/env.js";
import User from "../models/userModel.js";
import { USER_STATUS } from "../constants/index.js";
import { forbidden, unauthorized } from "../utils/AppError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { clearSessionCookie, readSessionToken } from "../services/session.service.js";

async function resolveUser(token) {
  let payload;
  try {
    payload = jwt.verify(token, env.JWT_SECRET, { algorithms: ["HS256"] });
  } catch (err) {
    throw err.name === "TokenExpiredError"
      ? unauthorized("Your session has expired. Please sign in again.", { code: "SESSION_EXPIRED" })
      : unauthorized("Invalid session. Please sign in again.", { code: "INVALID_SESSION" });
  }

  const user = await User.findById(payload.userId)
    .select("name email role status profilePicture lastLoginAt createdAt updatedAt +tokenVersion")
    .lean();

  // Checked on every request, so blocking takes effect immediately. Checked
  // before the version so a blocked user is told why they were signed out.
  if (user && user.status !== USER_STATUS.ACTIVE) {
    throw forbidden("Your account has been blocked. Please contact an administrator.", {
      code: "ACCOUNT_BLOCKED",
    });
  }
  if (!user || (user.tokenVersion ?? 0) !== (payload.tv ?? 0)) {
    throw unauthorized("Your session is no longer valid. Please sign in again.", {
      code: "SESSION_REVOKED",
    });
  }
  delete user.tokenVersion;
  return { ...user, id: String(user._id) };
}

export const authenticate = ({ optional = false } = {}) =>
  asyncHandler(async (req, res, next) => {
    const { token, source } = readSessionToken(req);
    if (!token) {
      if (optional) return next();
      throw unauthorized("Please sign in to continue.", { code: "AUTH_REQUIRED" });
    }
    try {
      req.user = await resolveUser(token);
    } catch (err) {
      if (source === "cookie") clearSessionCookie(res);
      if (!optional) throw err;
    }
    next();
  });

export const requireAuth = authenticate();
export const optionalAuth = authenticate({ optional: true });

export const requireRole =
  (...roles) =>
  (req, _res, next) =>
    roles.includes(req.user?.role) ? next() : next(forbidden());
