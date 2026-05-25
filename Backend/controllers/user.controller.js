// controllers/user.controller.js
const User = require("../models/user.model");
const bcrypt = require("bcrypt");
const {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  verifyResetToken,
  generateResetToken
} = require("../utils/jwt");
const { sendOtpEmail, sendPasswordResetEmail } = require("../utils/nodemailer");

// Validation helpers
const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validatePassword = (password) => {
  return password && password.length >= 6;
};

const validatePhone = (phone) => {
  return phone && phone.length >= 10;
};

const validateCNIC = (cnic) => {
  return cnic && cnic.length >= 5;
};

// ✅ SIGNUP
exports.register = async (req, res) => {
  try {
    const { name, email, password, phone, cnic, address, role } = req.body;

    // Input validation
    if (!name || !email || !password || !phone || !cnic || !address) {
      return res.status(400).json({
        message: "All fields are required",
      });
    }

    if (!validateEmail(email)) {
      return res.status(400).json({
        message: "Invalid email format",
      });
    }

    if (!validatePassword(password)) {
      return res.status(400).json({
        message: "Password must be at least 6 characters",
      });
    }

    if (!validatePhone(phone)) {
      return res.status(400).json({
        message: "Invalid phone number",
      });
    }

    if (!validateCNIC(cnic)) {
      return res.status(400).json({
        message: "Invalid CNIC",
      });
    }

    // Check existing user
    const existingUser = await User.findOne({
      $or: [{ email: email.toLowerCase() }, { cnic }],
    });

    if (existingUser) {
      return res.status(400).json({
        message: "User already exists with this email or CNIC",
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000);

    // Create user
    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      phone: phone.trim(),
      cnic: cnic.trim(),
      address: address.trim(),
      role: role || "investor",
      otp,
      otpExpires,
      isVerified: false,
    });

    await user.save();

    const emailSent = await sendOtpEmail(email, otp);

    if (!emailSent) {
      return res.status(500).json({
        success: false,
        message: "Failed to send OTP email. Please try again.",
      });
    }

    return res.status(201).json({
      success: true,
      message: "OTP sent to your email. Please verify to complete signup.",
    });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({ message: "Server error during registration" });
  }
};

// ✅ LOGIN
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Input validation
    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    if (!validateEmail(email)) {
      return res.status(400).json({
        message: "Invalid email format",
      });
    }

    // Check user
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Generate tokens with user data
    const tokenPayload = {
      id: user._id.toString(),
      email: user.email,
      role: user.role,
    };
    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    // Set refresh token in cookies
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.status(200).json({
      message: "Login successful",
      accessToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        cnic: user.cnic,
        address: user.address,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error during login" });
  }
};

// ✅ LOGOUT
exports.logout = async (req, res) => {
  try {
    // Clear refresh token cookie
    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });

    res.status(200).json({
      message: "Logout Successfully",
    });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({ message: "Server error during logout" });
  }
};

// ✅ REFRESH TOKEN
exports.refreshToken = async (req, res) => {
  try {
    const token = req.cookies.refreshToken;

    if (!token) {
      return res.status(401).json({
        message: "No refresh token found. Please login again.",
      });
    }

    // Verify refresh token
    const decoded = verifyRefreshToken(token);

    // Generate new access token
    const tokenPayload = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
    };
    const newAccessToken = generateAccessToken(tokenPayload);

    res.status(200).json({
      message: "Access token refreshed",
      accessToken: newAccessToken,
    });
  } catch (error) {
    console.error("Refresh token error:", error);
    res.status(401).json({ message: "Invalid or expired refresh token" });
  }
};

exports.verifySignup = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: "Email and OTP are required",
      });
    }

    const user = await User.findOne({
      email: email,
      otp: otp,
      otpExpires: { $gt: new Date() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired OTP",
      });
    }

    user.isVerified = true;
    user.otp = null;
    user.otpExpires = null;
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Account verified successfully",
    });
  } catch (error) {
    console.error("Verify signup error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};



exports.forgetPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }
    
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found. Please check your email address.",
      });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    user.otp = otp;
    user.otpExpires = otpExpires;
    await user.save();

    // Send OTP via email instead of reset link
    const emailSent = await sendPasswordResetEmail(email, otp);

    if (!emailSent) {
      return res.status(500).json({
        success: false,
        message: "Failed to send OTP email. Please try again.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "OTP sent to your email",
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

exports.resendOTP = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(200).json({
        success: true,
        message: "If the email exists, OTP has been sent",
      });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000);

    user.otp = otp;
    user.otpExpires = otpExpires;
    await user.save();

    const emailSent = await sendOtpEmail(email, otp);

    if (!emailSent) {
      return res.status(500).json({
        success: false,
        message: "Failed to send OTP email. Please try again.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "OTP sent to your email",
    });
  } catch (error) {
    console.error("ResendOTp:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Add this new controller function
exports.changePassword = async (req, res) => {
  try {
    console.log("Change password request received");
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id; // Get from auth middleware

    // Validation
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Current password and new password are required",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters long",
      });
    }

    if (currentPassword === newPassword) {
      return res.status(400).json({
        success: false,
        message: "New password must be different from current password",
      });
    }

    // Find user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Current password is incorrect",
      });
    }

    // Hash and save new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    user.password = hashedPassword;
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Password updated successfully",
    });
  } catch (error) {
    console.error("Change password error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

exports.ProfileUpdate = async (req, res) => {
  try {
    const userId = req.user.id; // Get from auth middleware
    const { name, phone, address, cnic } = req.body;

    // Find user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Update user profile
    user.name = name || user.name;
    user.phone = phone || user.phone;
    user.address = address || user.address;
    user.cnic = cnic || user.cnic;

    await user.save();

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
    });
  } catch (error) {
    console.error("Profile update error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { email, otp, newpassword } = req.body;

    if (!email || !otp || !newpassword) {
      return res.status(400).json({
        success: false,
        message: "Email, OTP, and new password are required",
      });
    }

    if (newpassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password should be at least 6 characters long",
      });
    }

    // Find user with valid OTP
    const user = await User.findOne({
      email: email,
      otp: otp,
      otpExpires: { $gt: new Date() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired OTP",
      });
    }

    // Hash and save new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newpassword, salt);
    user.password = hashedPassword;
    user.otp = null;
    user.otpExpires = null;
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Password updated successfully",
    });
  } catch (error) {
    console.error("Reset password error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};