const express = require("express");
const multer = require("multer");
const { verifyToken, authorizeRoles } = require("../middlewares/auth.middleware");
const {
  createProperty,
  getAllProperties,
  getPropertyById,
  updateProperty,
  deleteProperty,
} = require("../controllers/property.controller");

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.get("/", getAllProperties);
router.get("/:id", getPropertyById);
router.post("/create-property", verifyToken, authorizeRoles("admin"), upload.single("image"), createProperty);
router.put("/:id", verifyToken, authorizeRoles("admin"), upload.single("image"), updateProperty);
router.delete("/:id", verifyToken, authorizeRoles("admin"), deleteProperty);

module.exports = router;
