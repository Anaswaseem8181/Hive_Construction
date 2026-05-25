import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Mail, 
  Lock, 
  ArrowLeft, 
  Send, 
  CheckCircle,
  AlertCircle,
  Key,
  Building2,
  Eye,
  EyeOff
} from 'lucide-react';
import { resetPassword, forgotPassword, resendOTP } from '../APis/auth/auth';

const ForgetPassword = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: Email, 2: OTP, 3: Reset Password
  const [formData, setFormData] = useState({
    email: '',
    otp: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [countdown, setCountdown] = useState(0);
  const [timer, setTimer] = useState(null);
  
  // State for password visibility
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSendOTP = async (e) => {
    e.preventDefault();
    
    if (!formData.email) {
      setMessage({ type: 'error', text: 'Please enter your email address' });
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setMessage({ type: 'error', text: 'Please enter a valid email address' });
      return;
    }

    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const response = await forgotPassword({ email: formData.email });

      if (response.success) {
        setMessage({ type: 'success', text: 'OTP sent to your email! Please check your inbox.' });
        setStep(2);
        // Start countdown for OTP expiry (10 minutes)
        setCountdown(600);
        const newTimer = setInterval(() => {
          setCountdown(prev => {
            if (prev <= 1) {
              clearInterval(newTimer);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
        setTimer(newTimer);
      } else {
        setMessage({ type: 'error', text: response.message || 'Failed to send OTP' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: error.message || 'Error sending OTP. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();

    // Validate passwords
    if (formData.newPassword !== formData.confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match!' });
      return;
    }

    if (formData.newPassword.length < 6) {
      setMessage({ type: 'error', text: 'Password must be at least 6 characters long!' });
      return;
    }

    if (!formData.otp) {
      setMessage({ type: 'error', text: 'Please enter the OTP' });
      return;
    }

    if (formData.otp.length !== 6) {
      setMessage({ type: 'error', text: 'Please enter a valid 6-digit OTP' });
      return;
    }

    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      // Use your resetPassword API directly
      const response = await resetPassword({
        email: formData.email,
        otp: formData.otp,
        newpassword: formData.newPassword
      });

      if (response.success) {
        setMessage({ type: 'success', text: 'Password reset successfully! Redirecting to login...' });
        // Clear timer
        if (timer) clearInterval(timer);
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } else {
        setMessage({ type: 'error', text: response.message || 'Failed to reset password' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: error.message || 'Error resetting password. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const response = await resendOTP({ email: formData.email });

      if (response.success) {
        setMessage({ type: 'success', text: 'New OTP sent to your email!' });
        // Reset countdown
        setCountdown(600);
        if (timer) clearInterval(timer);
        const newTimer = setInterval(() => {
          setCountdown(prev => {
            if (prev <= 1) {
              clearInterval(newTimer);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
        setTimer(newTimer);
        // Clear OTP field for new OTP
        setFormData({ ...formData, otp: '' });
      } else {
        setMessage({ type: 'error', text: response.message || 'Failed to resend OTP' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: error.message || 'Error resending OTP. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Password strength checker
  const getPasswordStrength = (password) => {
    if (!password) return 0;
    let strength = 0;
    if (password.length >= 6) strength++;
    if (password.length >= 10) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    return Math.min(strength, 4);
  };

  const getStrengthColor = (strength) => {
    switch(strength) {
      case 1: return 'bg-red-500';
      case 2: return 'bg-orange-500';
      case 3: return 'bg-yellow-500';
      case 4: return 'bg-green-500';
      default: return 'bg-gray-700';
    }
  };

  const getStrengthText = (strength) => {
    switch(strength) {
      case 1: return 'Weak';
      case 2: return 'Fair';
      case 3: return 'Good';
      case 4: return 'Strong';
      default: return '';
    }
  };

  const passwordStrength = getPasswordStrength(formData.newPassword);

  return (
    <div className="min-h-screen bg-gradient-to-br from-black to-gray-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        {/* Logo/Brand */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Building2 className="w-16 h-16 text-yellow-500" />
          </div>
          <h1 className="text-3xl font-bold text-yellow-500 mb-2">Construction Portal</h1>
          <p className="text-gray-400">Reset your password</p>
        </div>

        {/* Progress Steps */}
        <div className="flex justify-between mb-8">
          {[1, 2].map((stepNumber) => (
            <div key={stepNumber} className="flex-1 text-center">
              <div className={`w-8 h-8 mx-auto rounded-full flex items-center justify-center ${
                step >= stepNumber 
                  ? 'bg-yellow-500 text-black' 
                  : 'bg-gray-800 text-gray-500'
              }`}>
                {step > stepNumber ? <CheckCircle className="w-5 h-5" /> : stepNumber}
              </div>
              <p className={`text-xs mt-2 ${
                step >= stepNumber ? 'text-yellow-500' : 'text-gray-500'
              }`}>
                {stepNumber === 1 && 'Email & OTP'}
                {stepNumber === 2 && 'Reset Password'}
              </p>
            </div>
          ))}
        </div>

        {/* Message Alert */}
        {message.text && (
          <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
            message.type === 'success' 
              ? 'bg-green-900/50 border border-green-500 text-green-300' 
              : 'bg-red-900/50 border border-red-500 text-red-300'
          }`}>
            {message.type === 'success' 
              ? <CheckCircle className="w-5 h-5 flex-shrink-0" /> 
              : <AlertCircle className="w-5 h-5 flex-shrink-0" />
            }
            {message.text}
          </div>
        )}

        {/* Step 1: Email and OTP Form */}
        {step === 1 && (
          <div className="bg-gray-900 rounded-2xl border border-yellow-500/30 p-8">
            <div className="flex items-center gap-3 mb-6">
              <Mail className="w-6 h-6 text-yellow-500" />
              <h2 className="text-2xl font-bold text-white">Forgot Password?</h2>
            </div>
            <p className="text-gray-400 mb-6">
              Enter your email address and we'll send you a verification code.
            </p>
            <form onSubmit={handleSendOTP}>
              <div className="mb-6">
                <label className="block text-gray-300 mb-2">Email Address</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="Enter your registered email"
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-yellow-500 transition-colors"
                  required
                  autoFocus
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-yellow-500 hover:bg-yellow-600 text-black font-semibold rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-5 h-5" />
                {loading ? 'Sending...' : 'Send Verification Code'}
              </button>
            </form>
          </div>
        )}

        {/* Step 2: Reset Password with OTP */}
        {step === 2 && (
          <div className="bg-gray-900 rounded-2xl border border-yellow-500/30 p-8">
            <div className="flex items-center gap-3 mb-6">
              <Lock className="w-6 h-6 text-yellow-500" />
              <h2 className="text-2xl font-bold text-white">Reset Password</h2>
            </div>
            <p className="text-gray-400 mb-6">
              Enter the OTP sent to <span className="text-yellow-500">{formData.email}</span> and create a new password.
            </p>
            
            {countdown > 0 && (
              <div className="mb-4 text-center">
                <span className="text-sm text-yellow-500">OTP expires in: {formatTime(countdown)}</span>
              </div>
            )}
            
            <form onSubmit={handleResetPassword}>
              <div className="mb-6">
                <label className="block text-gray-300 mb-2">Enter OTP</label>
                <input
                  type="text"
                  name="otp"
                  value={formData.otp}
                  onChange={handleInputChange}
                  placeholder="Enter 6-digit code"
                  maxLength="6"
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-yellow-500 text-center text-2xl tracking-widest"
                  required
                  autoFocus
                />
              </div>

              <div className="mb-4">
                <label className="block text-gray-300 mb-2">New Password</label>
                <div className="relative">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    name="newPassword"
                    value={formData.newPassword}
                    onChange={handleInputChange}
                    placeholder="Enter new password"
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-yellow-500 pr-12"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-yellow-500 transition-colors"
                  >
                    {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                
                {/* Password Strength Indicator */}
                {formData.newPassword && (
                  <div className="mt-2">
                    <div className="flex gap-1 h-1.5 mb-1">
                      {[1, 2, 3, 4].map((level) => (
                        <div
                          key={level}
                          className={`flex-1 rounded-full transition-all ${
                            level <= passwordStrength
                              ? getStrengthColor(passwordStrength)
                              : 'bg-gray-700'
                          }`}
                        />
                      ))}
                    </div>
                    <p className="text-xs text-gray-400">
                      Password strength: <span className={passwordStrength >= 3 ? 'text-green-500' : 'text-yellow-500'}>
                        {getStrengthText(passwordStrength)}
                      </span>
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Minimum 6 characters
                    </p>
                  </div>
                )}
              </div>
              
              <div className="mb-6">
                <label className="block text-gray-300 mb-2">Confirm Password</label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    placeholder="Confirm new password"
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-yellow-500 pr-12"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-yellow-500 transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {formData.confirmPassword && formData.newPassword !== formData.confirmPassword && (
                  <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
                )}
                {formData.confirmPassword && formData.newPassword === formData.confirmPassword && formData.newPassword && (
                  <p className="text-xs text-green-500 mt-1">✓ Passwords match</p>
                )}
              </div>
              
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-yellow-500 hover:bg-yellow-600 text-black font-semibold rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Lock className="w-5 h-5" />
                {loading ? 'Resetting...' : 'Reset Password'}
              </button>
            </form>

            {countdown === 0 && (
              <button
                onClick={handleResendOTP}
                disabled={loading}
                className="w-full mt-4 text-center text-yellow-500 hover:text-yellow-400 transition-colors disabled:opacity-50"
              >
                Resend OTP
              </button>
            )}
            
            <button
              onClick={() => {
                setStep(1);
                if (timer) clearInterval(timer);
                setFormData({ ...formData, otp: '', newPassword: '', confirmPassword: '' });
              }}
              className="w-full mt-4 text-center text-gray-400 hover:text-yellow-500 transition-colors"
            >
              ← Back to email
            </button>
          </div>
        )}

        {/* Back to Login Link */}
        <div className="text-center mt-6">
          <button
            onClick={() => {
              navigate('/login');
              if (timer) clearInterval(timer);
            }}
            className="inline-flex items-center gap-2 text-gray-400 hover:text-yellow-500 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Login
          </button>
        </div>
      </div>
    </div>
  );
};

export default ForgetPassword;