import express from "express";
import { requireAuth } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { asyncHandler as h } from "../utils/asyncHandler.js";
import {
  allNotification,
  deleteNotification,
  readAllNotification,
  readNotification,
} from "../controllers/notification.controller.js";
import { listNotificationsSchema, notificationIdSchema } from "../validators/misc.validator.js";

const router = express.Router();

router.use(requireAuth);

router.get("/", validate(listNotificationsSchema), h(allNotification));
router.patch("/read-all", h(readAllNotification));
router.patch("/:id/read", validate(notificationIdSchema), h(readNotification));
router.delete("/:id", validate(notificationIdSchema), h(deleteNotification));

export default router;
