import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { HiOutlineMail, HiOutlineArrowLeft } from "react-icons/hi";
import toast, { Toaster } from "react-hot-toast";
import { verifySignup, resendOTP } from "../APis/auth/auth";

export default function OTPVerifyPage() {
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [isVerified, setIsVerified] = useState(false);
  const navigate = useNavigate();

  // Get email from localStorage
  const email = localStorage.getItem("registrationEmail");

  useEffect(() => {
    if (!email && !isVerified) {
      toast.error("Please register first");
      navigate("/register");
    }
  }, [email, isVerified, navigate]);

  // Timer for resend OTP
  useEffect(() => {
    let interval;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  const handleOTPChange = (e) => {
    const value = e.target.value.replace(/\D/g, ""); // Only numbers
    if (value.length <= 6) {
      setOtp(value);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();

    if (otp.length !== 6) {
      toast.error("Please enter a valid 6-digit OTP");
      return;
    }

    setIsLoading(true);

    try {
      const response = await verifySignup({
        email,
        otp,
      });

      toast.success("Email verified successfully!");

      // Clear email from localStorage
      setIsVerified(true);
      localStorage.removeItem("registrationEmail");

      // Navigate to login after a delay
      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch (error) {
      if (error.message) {
        toast.error(error.message);
      } else if (typeof error === "string") {
        toast.error(error);
      } else {
        toast.error("OTP verification failed. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setIsResending(true);

    try {
      const response = await resendOTP({
        email,
      });

      toast.success("OTP resent to your email");
      setResendTimer(60); // 60 seconds cooldown
    } catch (error) {
      if (error.message) {
        toast.error(error.message);
      } else if (typeof error === "string") {
        toast.error(error);
      } else {
        toast.error("Failed to resend OTP. Please try again.");
      }
    } finally {
      setIsResending(false);
    }
  };

  const handleGoBack = () => {
    localStorage.removeItem("registrationEmail");
    navigate("/register");
  };

  return (
    <div className="min-h-screen bg-auth-pattern bg-cover bg-center bg-fixed flex items-center justify-center py-8 md:py-12">
      <div className="w-full max-w-md mx-4">
        <div className="bg-white bg-opacity-97 rounded-xl shadow-2xl p-10 md:p-12 animate-slide-in">
          <button
            onClick={handleGoBack}
            className="flex items-center text-primary hover:text-orange-600 transition mb-6 text-sm font-semibold"
          >
            <HiOutlineArrowLeft className="mr-2" />
            Back to Register
          </button>

          <h3 className="text-4xl font-bold text-center text-primary mb-2">
            Verify Email
          </h3>
          <p className="text-center text-gray-600 text-sm mb-8">
            We've sent a 6-digit OTP to your email
          </p>

          <form onSubmit={handleVerifyOTP} className="space-y-6">
            {/* Email Display */}
            <div className="bg-gray-50 rounded-lg p-4 flex items-center">
              <HiOutlineMail className="text-primary text-xl mr-3" />
              <div>
                <p className="text-xs text-gray-500">Sent to:</p>
                <p className="text-sm font-semibold text-gray-800">{email}</p>
              </div>
            </div>

            {/* OTP Input */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Enter 6-Digit OTP
              </label>
              <input
                type="text"
                value={otp}
                onChange={handleOTPChange}
                placeholder="000000"
                maxLength="6"
                inputMode="numeric"
                required
                className="w-full px-4 py-4 text-center text-2xl tracking-widest border-2 border-gray-300 rounded-lg focus:outline-none focus:border-primary focus:ring-2 focus:ring-blue-200 transition font-mono"
              />
              <p className="text-xs text-gray-500 mt-2">
                Only numbers. Please check your email including spam folder.
              </p>
            </div>

            {/* Verify Button */}
            <button
              type="submit"
              disabled={isLoading || otp.length !== 6}
              className="w-full bg-primary hover:bg-orange-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-bold py-3 rounded-lg transition shadow-md hover:shadow-lg flex items-center justify-center"
            >
              {isLoading ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Verifying...
                </>
              ) : (
                "Verify OTP"
              )}
            </button>
          </form>

          {/* Resend OTP */}
          <div className="text-center mt-6">
            <p className="text-sm text-gray-600">
              Didn't receive the OTP?{" "}
              {resendTimer > 0 ? (
                <span className="text-primary font-semibold">
                  Resend in {resendTimer}s
                </span>
              ) : (
                <button
                  onClick={handleResendOTP}
                  disabled={isResending}
                  className="text-primary hover:text-orange-600 font-semibold disabled:text-gray-400 transition"
                >
                  {isResending ? "Sending..." : "Resend OTP"}
                </button>
              )}
            </p>
          </div>

          {/* Help Text */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-xs text-center text-gray-500">
              Check your email (including spam folder) for the verification
              code. If you don't receive it within a few minutes, try resending.
            </p>
          </div>
        </div>
      </div>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: "#363636",
            color: "#fff",
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: "#10B981",
              secondary: "#fff",
            },
          },
          error: {
            duration: 3000,
            iconTheme: {
              primary: "#FF5252",
              secondary: "#fff",
            },
          },
        }}
      />
    </div>
  );
}
