import * as authService from "../services/auth.service.js";
import { serializeUser } from "../services/user.service.js";
import { clearSessionCookie, issueSession } from "../services/session.service.js";
import { sendSuccess } from "../utils/response.js";

export const register = async (req, res) => {
  const { user, ...session } = await authService.register(req.valid.body);
  issueSession(res, session);
  sendSuccess(res, { status: 201, message: "Account created successfully", data: { user } });
};

export const login = async (req, res) => {
  const { user, ...session } = await authService.login(req.valid.body);
  issueSession(res, session);
  sendSuccess(res, { message: "Signed in successfully", data: { user } });
};

export const logout = (_req, res) => {
  clearSessionCookie(res);
  sendSuccess(res, { message: "Signed out" });
};

export const me = (req, res) => {
  sendSuccess(res, { data: { user: serializeUser(req.user) } });
};

export const updateMe = async (req, res) => {
  const user = await authService.updateProfile(req.user._id, req.valid.body);
  sendSuccess(res, { message: "Profile updated", data: { user } });
};

// Other sessions are revoked; this one gets a fresh cookie.
export const changePassword = async (req, res) => {
  const session = await authService.changePassword(req.user._id, req.valid.body);
  issueSession(res, session);
  sendSuccess(res, { message: "Password changed. Other sessions have been signed out." });
};
