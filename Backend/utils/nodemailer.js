const nodemailer = require("nodemailer");

function createTransporter() {
    if (!process.env.EMAIL_USERNAME || !process.env.EMAIL_PASSWORD) {
        console.error("Email credentials missing when creating transporter");
        return null;
    }

    console.log("Creating nodemailer transporter with:", process.env.EMAIL_USERNAME);
    
    const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: process.env.EMAIL_USERNAME,
            pass: process.env.EMAIL_PASSWORD
        }
    });

    return transporter;
}

const passwordResetEmailTemplate = (otp) => {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">Password Reset Request</h2>
      <p>You requested to reset your password. Use the OTP below to proceed:</p>
      <div style="background-color: #f0f0f0; padding: 15px; border-radius: 5px; text-align: center; margin: 20px 0;">
        <h1 style="margin: 0; color: #333; letter-spacing: 5px;">${otp}</h1>
      </div>
      <p>This OTP will expire in 10 minutes.</p>
      <p>If you didn't request this reset, please ignore this email.</p>
      <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
      <p style="color: #666; font-size: 12px;">This is an automated message, please do not reply.</p>
    </div>
  `;
};

const OTPsentTemplate = (otp) => {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">Your OTP</h2>
      <p>Your OTP is:</p>
      <div style="background-color: #f0f0f0; padding: 15px; border-radius: 5px; text-align: center; margin: 20px 0;">
        <h1 style="margin: 0; color: #333; letter-spacing: 5px;">${otp}</h1>
      </div>
      <p>This OTP will expire in 10 minutes.</p>
      <p>If you didn't request this request, please ignore this email.</p>
      <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
      <p style="color: #666; font-size: 12px;">This is an automated message, please do not reply.</p>
    </div>
  `;
};

const sendOtpEmail = async (email, otp) => {
  try {
    const transporter = createTransporter();
    if (!transporter) {
      throw new Error("Email transporter not available");
    }

    const mailOptions = {
      from: process.env.EMAIL_USERNAME,
      to: email,
      subject: "OTp - Hive Construction",
      html: OTPsentTemplate(otp),
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Password reset email sent:", info.messageId);
    return true;
  } catch (error) {
    console.error("Error sending password reset email:", error);
    return false;
  }
};

const sendPasswordResetEmail = async (email, otp) => {
  try {
    const transporter = createTransporter();
    if (!transporter) {
      throw new Error("Email transporter not available");
    }

    const mailOptions = {
      from: process.env.EMAIL_USERNAME,
      to: email,
      subject: "Password Reset OTP - Hive Construction",
      html: passwordResetEmailTemplate(otp),
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Password reset email sent:", info.messageId);
    return true;
  } catch (error) {
    console.error("Error sending password reset email:", error);
    return false;
  }
};

module.exports = { createTransporter, sendPasswordResetEmail, sendOtpEmail };