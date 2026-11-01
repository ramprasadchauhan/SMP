import { forbidden } from "../utils/AppError.js";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

// Defence in depth on top of SameSite=Lax cookies: state-changing requests must
// carry a custom header, which a cross-site form cannot send and a cross-site
// script cannot send without passing a CORS preflight. Bearer-token requests
// are not cookie-authenticated and are exempt.
export const csrfGuard = (req, _res, next) => {
  if (SAFE_METHODS.has(req.method)) return next();
  if (req.get("authorization")?.startsWith("Bearer ")) return next();
  if (req.get("x-requested-with") === "XMLHttpRequest") return next();
  next(forbidden("Missing X-Requested-With header", { code: "CSRF_CHECK_FAILED" }));
};
