const express = require("express");
const router = express.Router();
const { getAdminReports } = require("../controllers/report.controller");
const { verifyToken, authorizeRoles } = require("../middlewares/auth.middleware");

// Get Admin Reports with optional date filtering
router.get("/admin", verifyToken, authorizeRoles("admin"), getAdminReports);

module.exports = router;
