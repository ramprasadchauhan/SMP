import Notification from "../models/notificationModal.js";
export const addNotification = async (req, res, next) => {
  try {
    const newNotification = new Notification(req.body);
    await newNotification.save();
    res.json({
      success: true,
      message: "Notification added successfully",
    });
  } catch (error) {
    next(error);
  }
};

// get all notificaton by user
export const allNotification = async (req, res, next) => {
  try {
    const notification = await Notification.find({
      user: req.body.userId,
    }).sort({ createdAt: -1 });
    res.json({
      success: true,
      data: notification,
    });
  } catch (error) {
    next(error);
  }
};
// delete notification
export const deleteNotification = async (req, res, next) => {
  try {
    await Notification.findByIdAndDelete(req.params.id);
    res.json({
      success: true,
      message: "Notification deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};
// read all notification

export const readAllNotification = async (req, res, next) => {
  try {
    await Notification.updateMany(
      {
        user: req.body.userId,
        read: false,
      },
      { $set: { read: true } }
    );
    res.json({
      success: true,
      message: "All notification marked as read",
    });
  } catch (error) {
    next(error);
  }
};
