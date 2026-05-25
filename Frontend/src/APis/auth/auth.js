import axiosInstance from "../axios";

// helper for consistent error handling
const handleError = (error, fallbackMessage = "Something went wrong") => {
  return {
    message:
      error?.response?.data?.message ||
      error?.response?.data?.error ||
      error?.message ||
      fallbackMessage,
    status: error?.response?.status || 500,
  };
};

// Register API
export const register = async (userData) => {
  try {
    const res = await axiosInstance.post("/api/users/register", userData);
    return res.data;
  } catch (error) {
    throw handleError(error, "Registration failed");
  }
};

// Login API
export const login = async (credentials) => {
  try {
    const res = await axiosInstance.post("/api/users/login", credentials);
    console.log("login res", res)
    return res.data;
  } catch (error) {
    throw handleError(error, "Login failed");
  }
};

// Logout API
export const logout = async () => {
  try {
    const res = await axiosInstance.post("/api/users/logout");
    return res.data;
  } catch (error) {
    throw handleError(error, "Logout failed");
  }
};

// Verify Signup (OTP verification)
export const verifySignup = async (data) => {
  try {
    const res = await axiosInstance.post("/api/users/verify-signup", data);
    return res.data;
  } catch (error) {
    throw handleError(error, "Verification failed");
  }
};

// Forgot Password
export const forgotPassword = async (data) => {
  try {
    const res = await axiosInstance.post("/api/users/forgot-password", data);
    return res.data;
  } catch (error) {
    throw handleError(error, "Failed to send reset email");
  }
};

export const resetPassword = async (data) => {
  try {
    const res = await axiosInstance.post("/api/users/reset-password", {
      email: data.email,
      otp: data.otp,
      newpassword: data.newpassword
    });
    return res.data;
  } catch (error) {
    throw handleError(error, "Password reset failed");
  }
};

// Add this new function
export const changePassword = async (data) => {
  try {
    const response = await axiosInstance.post(`/api/users/change-password`, {
      currentPassword: data.currentPassword,
      newPassword: data.newPassword,
    });
    return response.data;
  } catch (error) {
    if (error.response) {
      throw error.response.data;
    }
    throw error;
  }
};



// Resend OTP
export const resendOTP = async (data) => {
  try {
    const res = await axiosInstance.post("/api/users/resend-otp", data);
    return res.data;
  } catch (error) {
    throw handleError(error, "Failed to resend OTP");
  }
};

export const updateProfile = async (data) => {
  try {
    const res = await axiosInstance.post("/api/users/profile-update", data);
    return res.data;
  } catch (error) {
    throw handleError(error, "Failed to update profile");
  }
};

