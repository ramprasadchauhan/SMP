import Notification from "../models/notificationModel.js";
import User from "../models/userModel.js";
import { ROLES, USER_STATUS } from "../constants/index.js";
import { notFound } from "../utils/AppError.js";
import { paginationMeta } from "../utils/query.js";

// Notifications are only created by the server as side effects of real
// events; clients can no longer post arbitrary notifications to other users.
export async function notifyUser(userId, { title, message, onClick }, session = null) {
  await Notification.create([{ user: userId, title, message, onClick }], { session });
}

export async function notifyAdmins({ title, message, onClick }, { exclude } = {}) {
  const admins = await User.find({ role: ROLES.ADMIN, status: USER_STATUS.ACTIVE }).select("_id").lean();
  const docs = admins
    .filter((a) => String(a._id) !== String(exclude))
    .map((a) => ({ user: a._id, title, message, onClick }));
  if (docs.length) await Notification.insertMany(docs);
}

export async function listNotifications(userId, { unread, page, limit }) {
  const filter = { user: userId };
  if (unread !== undefined) filter.read = !unread;
  const [items, total, unreadCount] = await Promise.all([
    Notification.find(filter)
      .sort({ createdAt: -1, _id: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Notification.countDocuments(filter),
    Notification.countDocuments({ user: userId, read: false }),
  ]);
  return { items, meta: { ...paginationMeta(page, limit, total), unreadCount } };
}

export async function markAllRead(userId) {
  const { modifiedCount } = await Notification.updateMany({ user: userId, read: false }, { $set: { read: true } });
  return modifiedCount;
}

// Ownership is part of every filter: users can only touch their own notifications.
export async function markRead(userId, id) {
  const n = await Notification.findOneAndUpdate({ _id: id, user: userId }, { $set: { read: true } }, { new: true }).lean();
  if (!n) throw notFound("Notification not found");
  return n;
}

export async function deleteNotification(userId, id) {
  const { deletedCount } = await Notification.deleteOne({ _id: id, user: userId });
  if (!deletedCount) throw notFound("Notification not found");
}
