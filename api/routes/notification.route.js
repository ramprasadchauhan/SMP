import express from "express";
import { verifyToken } from "../utils/verifyToken.js";
import {
  addNotification,
  allNotification,
  deleteNotification,
  readAllNotification,
} from "../controllers/notification.controller.js";

const router = express.Router();

// add a notification

router.post("/notify", verifyToken, addNotification);
router.get("/get-all-notification", verifyToken, allNotification);
router.delete("/delete-notification/:id", verifyToken, deleteNotification);
router.put("/read-all-notification", verifyToken, readAllNotification);

export default router;
