const express = require("express");
const router = express.Router();
const { getUserNotifications, markAsRead, markAllAsRead } = require("../controllers/notification.controller");
const { verifyToken } = require("../middlewares/auth.middleware");

// All notification routes require authentication
router.use(verifyToken);

router.get("/", getUserNotifications);
router.patch("/:id/read", markAsRead);
router.patch("/read-all", markAllAsRead);

module.exports = router;
