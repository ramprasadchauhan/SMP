import express from "express";
import authRoute from "./auth.route.js";
import userRoute from "./user.route.js";
import productRoute from "./product.route.js";
import bidRoute from "./bid.route.js";
import notificationRoute from "./notification.route.js";
import * as system from "../controllers/system.controller.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { ROLES } from "../constants/index.js";
import { asyncHandler as h } from "../utils/asyncHandler.js";
import { auditLogSchema, dashboardSchema } from "../validators/misc.validator.js";

const router = express.Router();

router.get("/health", system.health);
router.get("/health/ready", h(system.ready));

router.use("/auth", authRoute);
router.use("/users", userRoute);
router.use("/products", productRoute);
router.use("/bids", bidRoute);
router.use("/notifications", notificationRoute);

router.get("/dashboard/summary", requireAuth, validate(dashboardSchema), h(system.dashboardSummary));
router.get("/audit-logs", requireAuth, requireRole(ROLES.ADMIN), validate(auditLogSchema), h(system.auditLogs));

export default router;
