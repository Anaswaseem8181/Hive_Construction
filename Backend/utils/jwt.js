const jwt = require("jsonwebtoken");

// Check for required environment variables
if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable is not set");
}

if (!process.env.JWT_REFRESH_SECRET) {
  throw new Error("JWT_REFRESH_SECRET environment variable is not set");
}

const generateAccessToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "15m" });
};

const generateRefreshToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
    expiresIn: "7d",
  });
};

const generateTokens = (payload) => {
  const AccessToken = generateAccessToken(payload);
  const RefreshToken = generateRefreshToken(payload);
  return { AccessToken, RefreshToken };
};

const verifyAccessToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    throw new Error("Invalid access token");
  }
};

const verifyRefreshToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
  } catch (error) {
    throw new Error("Invalid refresh token");
  }
};


const generateResetToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET, { expiresIn: "10m" });
};

const verifyResetToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
  } catch (error) {
    console.error("JWT verification error:", error.message);
    return null;
  }
};

module.exports = {
  generateTokens,
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  verifyResetToken,
  generateResetToken
};
