// routes/user.routes.js
const express = require("express");
const router = express.Router();

const {
  register,
  login,
  logout,
  refreshToken,
  forgetPassword,
  verifyOTP,
  resetPassword,
  resendOTP,
  verifySignup,
  changePassword,
  ProfileUpdate,
} = require("../controllers/user.controller");
const { verifyToken } = require("../middlewares/auth.middleware");

router.post("/register", register);
router.post("/login", login);
router.post("/logout", logout);
router.post("/refresh-token", refreshToken);

router.post("/forgot-password", forgetPassword);
router.post("/reset-password", resetPassword);
router.post("/resend-otp", resendOTP);
router.post("/verify-signup", verifySignup);
router.post("/change-password", verifyToken, changePassword);
router.post("/profile-update", verifyToken, ProfileUpdate);

module.exports = router;
