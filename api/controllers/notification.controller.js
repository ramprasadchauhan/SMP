import * as notificationService from "../services/notification.service.js";
import { sendSuccess } from "../utils/response.js";

export const allNotification = async (req, res) => {
  const { items, meta } = await notificationService.listNotifications(req.user._id, req.valid.query);
  sendSuccess(res, { data: items, meta });
};

export const readAllNotification = async (req, res) => {
  const updated = await notificationService.markAllRead(req.user._id);
  sendSuccess(res, { message: "All notifications marked as read", data: { updated } });
};

export const readNotification = async (req, res) => {
  const notification = await notificationService.markRead(req.user._id, req.valid.params.id);
  sendSuccess(res, { data: notification });
};

export const deleteNotification = async (req, res) => {
  await notificationService.deleteNotification(req.user._id, req.valid.params.id);
  sendSuccess(res, { message: "Notification deleted" });
};
