import express from "express";
import * as auth from "../controllers/auth.controller.js";
import { requireAuth } from "../middleware/auth.js";
import { authLimiter } from "../middleware/rateLimit.js";
import { validate } from "../middleware/validate.js";
import { asyncHandler as h } from "../utils/asyncHandler.js";
import {
  changePasswordSchema,
  loginSchema,
  registerSchema,
  updateMeSchema,
} from "../validators/auth.validator.js";

const router = express.Router();

router.post("/register", authLimiter, validate(registerSchema), h(auth.register));
router.post("/login", authLimiter, validate(loginSchema), h(auth.login));
router.post("/logout", auth.logout);
router.get("/me", requireAuth, auth.me);
router.patch("/me", requireAuth, validate(updateMeSchema), h(auth.updateMe));
router.post("/change-password", requireAuth, authLimiter, validate(changePasswordSchema), h(auth.changePassword));

export default router;
