import jwt from "jsonwebtoken";
import env from "../config/env.js";
import { SESSION_COOKIE } from "../constants/index.js";

const cookieOptions = () => ({
  httpOnly: true,
  secure: env.isProduction,
  sameSite: "lax",
  path: "/",
});

// The browser client authenticates with an HttpOnly cookie, which page scripts
// cannot read. A Bearer header is also accepted for API tooling; browsers never
// attach it automatically, so it is not exposed to CSRF.
export function readSessionToken(req) {
  const header = req.get("authorization");
  if (header?.startsWith("Bearer ")) return { token: header.slice(7), source: "header" };
  const cookie = req.cookies?.[SESSION_COOKIE];
  return cookie ? { token: cookie, source: "cookie" } : { token: null, source: null };
}

export function issueSession(res, user) {
  const token = jwt.sign(
    { userId: String(user._id), tv: user.tokenVersion ?? 0 },
    env.JWT_SECRET,
    { algorithm: "HS256", expiresIn: `${env.SESSION_TTL_HOURS}h` }
  );
  res.cookie(SESSION_COOKIE, token, {
    ...cookieOptions(),
    maxAge: env.SESSION_TTL_HOURS * 60 * 60 * 1000,
  });
  return token;
}

export function clearSessionCookie(res) {
  res.clearCookie(SESSION_COOKIE, cookieOptions());
}
