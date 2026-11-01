import express from "express";
import * as users from "../controllers/user.controller.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { ROLES } from "../constants/index.js";
import { asyncHandler as h } from "../utils/asyncHandler.js";
import {
  exportUsersSchema,
  listUsersSchema,
  updateRoleSchema,
  updateStatusSchema,
  userIdSchema,
} from "../validators/user.validator.js";

const router = express.Router();

// Every user-management endpoint is administrator-only.
router.use(requireAuth, requireRole(ROLES.ADMIN));

router.get("/", validate(listUsersSchema), h(users.getUsers));
router.get("/export", validate(exportUsersSchema), h(users.exportUsers));
router.get("/:id", validate(userIdSchema), h(users.getUser));
router.patch("/:id/status", validate(updateStatusSchema), h(users.updateUserStatus));
router.patch("/:id/role", validate(updateRoleSchema), h(users.updateUserRole));

export default router;
