const Notification = require("../models/notification.model");

// Get user notifications
const getUserNotifications = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const notifications = await Notification.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(50); // Get latest 50 notifications

    res.status(200).json(notifications);
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// Mark notification as read
const markAsRead = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, user: userId },
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    res.status(200).json(notification);
  } catch (error) {
    console.error("Error marking notification as read:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// Mark all as read
const markAllAsRead = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    await Notification.updateMany(
      { user: userId, isRead: false },
      { isRead: true }
    );

    res.status(200).json({ message: "All notifications marked as read" });
  } catch (error) {
    console.error("Error marking all as read:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

module.exports = {
  getUserNotifications,
  markAsRead,
  markAllAsRead
};
