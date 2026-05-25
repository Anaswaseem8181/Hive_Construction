import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User,
  Mail,
  Briefcase,
  Shield,
  Lock,
  Save,
  LogOut,
  AlertCircle,
  CheckCircle,
  Eye,
  EyeOff,
  Phone,
  MapPin,
  CreditCard,
  Edit2,
  X
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { changePassword, updateProfile, logout } from '../APis/auth/auth';

const Profile = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    cnic: '',
    address: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [loading, setLoading] = useState(false);

  // State for password visibility
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // State for password strength
  const [passwordStrength, setPasswordStrength] = useState(0);

  useEffect(() => {
    // Get user data from localStorage
    const userData = localStorage.getItem('user');
    const token = localStorage.getItem('accessToken');

    if (userData && token) {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      setFormData({
        ...formData,
        name: parsedUser.name || '',
        email: parsedUser.email || '',
        phone: parsedUser.phone || '',
        cnic: parsedUser.cnic || '',
        address: parsedUser.address || ''
      });
    } else {
      // Redirect to login if no user data or token
      navigate('/login');
    }
  }, []);

  // Check password strength
  useEffect(() => {
    const checkStrength = (password) => {
      if (!password) return 0;
      let strength = 0;
      if (password.length >= 6) strength++;
      if (password.length >= 8) strength++;
      if (/[A-Z]/.test(password)) strength++;
      if (/[0-9]/.test(password)) strength++;
      if (/[^A-Za-z0-9]/.test(password)) strength++;
      return Math.min(strength, 4);
    };
    setPasswordStrength(checkStrength(formData.newPassword));
  }, [formData.newPassword]);

  const getStrengthColor = () => {
    switch (passwordStrength) {
      case 1: return 'bg-red-500';
      case 2: return 'bg-orange-500';
      case 3: return 'bg-yellow-500';
      case 4: return 'bg-green-500';
      default: return 'bg-gray-700';
    }
  };

  const getStrengthText = () => {
    switch (passwordStrength) {
      case 1: return 'Weak';
      case 2: return 'Fair';
      case 3: return 'Good';
      case 4: return 'Strong';
      default: return 'Very Weak';
    }
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.name) {
      toast.error('Name is required');
      return;
    }

    if (!formData.email) {
      toast.error('Email is required');
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error('Please enter a valid email address');
      return;
    }

    // Phone validation (optional)
    if (formData.phone && !/^[0-9+\-\s()]{10,15}$/.test(formData.phone)) {
      toast.error('Please enter a valid phone number');
      return;
    }

    // CNIC validation (Pakistan format: 12345-1234567-1)
    if (formData.cnic && !/^\d{5}-\d{7}-\d{1}$/.test(formData.cnic)) {
      toast.error('Please enter valid CNIC (format: 12345-1234567-1)');
      return;
    }

    setLoading(true);

    try {
      const response = await updateProfile({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        cnic: formData.cnic,
        address: formData.address
      });

      if (response.success) {
        // Update localStorage
        const updatedUser = {
          ...user,
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          cnic: formData.cnic,
          address: formData.address
        };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setUser(updatedUser);
        toast.success('Profile updated successfully!');
        setIsEditing(false);
      } else {
        toast.error(response.message || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Update profile error:', error);
      toast.error(error.message || 'Error updating profile');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.currentPassword) {
      toast.error('Current password is required!');
      return;
    }

    if (!formData.newPassword) {
      toast.error('New password is required!');
      return;
    }

    if (!formData.confirmPassword) {
      toast.error('Please confirm your new password!');
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      toast.error('New passwords do not match!');
      return;
    }

    if (formData.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters!');
      return;
    }

    if (formData.currentPassword === formData.newPassword) {
      toast.error('New password must be different from current password!');
      return;
    }

    setLoading(true);

    try {
      console.log('Sending change password request...');
      const response = await changePassword({
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword
      });

      console.log('Change password response:', response);

      if (response.success) {
        toast.success('Password changed successfully!');
        setShowPasswordModal(false);
        setFormData({
          ...formData,
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
        // Reset visibility states
        setShowCurrentPassword(false);
        setShowNewPassword(false);
        setShowConfirmPassword(false);
      } else {
        toast.error(response.message || 'Failed to change password');
      }
    } catch (error) {
      console.error('Password change error:', error);
      // Handle different error formats
      if (error.message) {
        toast.error(error.message);
      } else if (typeof error === 'string') {
        toast.error(error);
      } else {
        toast.error('Failed to change password. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    toast.custom((t) => (
      <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-md w-full bg-white shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5`}>
        <div className="flex-1 w-0 p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0 pt-0.5">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <LogOut className="h-5 w-5 text-red-600" />
              </div>
            </div>
            <div className="ml-3 flex-1">
              <p className="text-sm font-medium text-gray-900">Logout Confirmation</p>
              <p className="text-sm text-gray-500">Are you sure you want to logout?</p>
            </div>
          </div>
        </div>
        <div className="flex border-l border-gray-200">
          <button
            onClick={async () => {
              toast.dismiss(t.id);

              try {
                await logout(); // call backend

                // Clear frontend storage
                localStorage.removeItem('user');
                localStorage.removeItem('accessToken');
                localStorage.removeItem('token');

                navigate('/login');
                toast.success('Logged out successfully');
              } catch (error) {
                console.error('Logout failed:', error);

                // Still clear local data even if API fails
                localStorage.removeItem('user');
                localStorage.removeItem('accessToken');
                localStorage.removeItem('token');

                navigate('/login');
                toast.error('Logged out locally (server error)');
              }
            }}
            className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium text-red-600 hover:text-red-500 hover:bg-red-50 focus:outline-none"
          >
            Logout
          </button>
          <button
            onClick={() => toast.dismiss(t.id)}
            className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium text-gray-700 hover:text-gray-500 hover:bg-gray-50 focus:outline-none"
          >
            Cancel
          </button>
        </div>
      </div>
    ), {
      duration: 5000,
      position: 'top-center',
    });
  };

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'investor':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'contractor':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'admin':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  // Check if token exists
  const token = localStorage.getItem('accessToken');
  if (!token) {
    navigate('/login');
    return null;
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-yellow-500 text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black to-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-yellow-500 mb-2">Profile Settings</h1>
          <p className="text-gray-400">Manage your account information and security</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-gray-900 rounded-2xl border border-yellow-500/30 p-6">
              <div className="text-center">
                <div className="w-32 h-32 mx-auto mb-4 rounded-full bg-gradient-to-r from-yellow-500 to-yellow-600 flex items-center justify-center">
                  <span className="text-5xl font-bold text-black">
                    {user.name?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <h3 className="text-xl font-semibold text-white mb-1">{user.name}</h3>
                <p className="text-gray-400 mb-3">{user.email}</p>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getRoleBadgeColor(user.role)}`}>
                  <Shield className="w-4 h-4 mr-1" />
                  {user.role?.toUpperCase()}
                </span>
              </div>

              <div className="mt-6 pt-6 border-t border-gray-800">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-all duration-200"
                >
                  <LogOut className="w-5 h-5" />
                  Logout
                </button>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Profile Information Card */}
            <div className="bg-gray-900 rounded-2xl border border-yellow-500/30 p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-yellow-500 flex items-center gap-2">
                  <User className="w-6 h-6" />
                  Profile Information
                </h2>
                {!isEditing && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-black font-semibold rounded-lg transition-all duration-200 flex items-center gap-2"
                  >
                    <Edit2 className="w-4 h-4" />
                    Edit Profile
                  </button>
                )}
              </div>

              {isEditing ? (
                <form onSubmit={handleUpdateProfile} className="space-y-4">
                  <div>
                    <label className="block text-gray-300 mb-2">Full Name *</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-yellow-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-gray-300 mb-2">Email Address *</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-yellow-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-gray-300 mb-2">Phone Number</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-2.5 w-5 h-5 text-gray-500" />
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        placeholder="e.g., 0300-1234567"
                        className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-yellow-500"
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Format: 0300-1234567 or +92-300-1234567</p>
                  </div>

                  <div>
                    <label className="block text-gray-300 mb-2">CNIC Number</label>
                    <div className="relative">
                      <CreditCard className="absolute left-3 top-2.5 w-5 h-5 text-gray-500" />
                      <input
                        type="text"
                        name="cnic"
                        value={formData.cnic}
                        onChange={handleInputChange}
                        placeholder="e.g., 12345-1234567-1"
                        className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-yellow-500"
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Format: 12345-1234567-1</p>
                  </div>

                  <div>
                    <label className="block text-gray-300 mb-2">Address</label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-2.5 w-5 h-5 text-gray-500" />
                      <textarea
                        name="address"
                        value={formData.address}
                        onChange={handleInputChange}
                        placeholder="Enter your complete address"
                        rows="3"
                        className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-yellow-500 resize-none"
                      />
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-black font-semibold rounded-lg transition-all duration-200 disabled:opacity-50"
                    >
                      <Save className="w-5 h-5" />
                      {loading ? 'Saving...' : 'Save Changes'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditing(false);
                        setFormData({
                          ...formData,
                          name: user.name,
                          email: user.email,
                          phone: user.phone || '',
                          cnic: user.cnic || '',
                          address: user.address || ''
                        });
                      }}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 font-semibold rounded-lg transition-all duration-200"
                    >
                      <X className="w-5 h-5" />
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-start gap-3 p-3 bg-gray-800/50 rounded-lg">
                    <User className="w-5 h-5 text-yellow-500 mt-1" />
                    <div>
                      <p className="text-sm text-gray-400">Full Name</p>
                      <p className="text-white font-medium">{user.name}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 bg-gray-800/50 rounded-lg">
                    <Mail className="w-5 h-5 text-yellow-500 mt-1" />
                    <div>
                      <p className="text-sm text-gray-400">Email Address</p>
                      <p className="text-white font-medium">{user.email}</p>
                    </div>
                  </div>

                  {user.phone && (
                    <div className="flex items-start gap-3 p-3 bg-gray-800/50 rounded-lg">
                      <Phone className="w-5 h-5 text-yellow-500 mt-1" />
                      <div>
                        <p className="text-sm text-gray-400">Phone Number</p>
                        <p className="text-white font-medium">{user.phone}</p>
                      </div>
                    </div>
                  )}

                  {user.cnic && (
                    <div className="flex items-start gap-3 p-3 bg-gray-800/50 rounded-lg">
                      <CreditCard className="w-5 h-5 text-yellow-500 mt-1" />
                      <div>
                        <p className="text-sm text-gray-400">CNIC Number</p>
                        <p className="text-white font-medium">{user.cnic}</p>
                      </div>
                    </div>
                  )}

                  {user.address && (
                    <div className="flex items-start gap-3 p-3 bg-gray-800/50 rounded-lg">
                      <MapPin className="w-5 h-5 text-yellow-500 mt-1" />
                      <div>
                        <p className="text-sm text-gray-400">Address</p>
                        <p className="text-white font-medium">{user.address}</p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-start gap-3 p-3 bg-gray-800/50 rounded-lg">
                    <Briefcase className="w-5 h-5 text-yellow-500 mt-1" />
                    <div>
                      <p className="text-sm text-gray-400">Role</p>
                      <p className="text-white font-medium capitalize">{user.role}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Security Card */}
            <div className="bg-gray-900 rounded-2xl border border-yellow-500/30 p-6">
              <h2 className="text-2xl font-bold text-yellow-500 flex items-center gap-2 mb-6">
                <Lock className="w-6 h-6" />
                Security
              </h2>
              <button
                onClick={() => setShowPasswordModal(true)}
                className="w-full flex items-center justify-between p-4 bg-gray-800 rounded-lg hover:bg-gray-700 transition-all duration-200"
              >
                <div className="flex items-center gap-3">
                  <Lock className="w-5 h-5 text-yellow-500" />
                  <div className="text-left">
                    <p className="text-white font-medium">Change Password</p>
                    <p className="text-sm text-gray-400">Update your password to keep your account secure</p>
                  </div>
                </div>
                <span className="text-yellow-500">→</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Change Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-2xl border border-yellow-500/30 max-w-md w-full p-6">
            <h3 className="text-2xl font-bold text-yellow-500 mb-4">Change Password</h3>
            <form onSubmit={handleChangePassword} className="space-y-4">
              {/* Current Password */}
              <div>
                <label className="block text-gray-300 mb-2">Current Password</label>
                <div className="relative">
                  <input
                    type={showCurrentPassword ? "text" : "password"}
                    name="currentPassword"
                    value={formData.currentPassword}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-yellow-500 pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-yellow-500 transition-colors"
                  >
                    {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div>
                <label className="block text-gray-300 mb-2">New Password</label>
                <div className="relative">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    name="newPassword"
                    value={formData.newPassword}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-yellow-500 pr-10"
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
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-gray-400">Password Strength:</span>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${passwordStrength === 4 ? 'bg-green-500/20 text-green-400' :
                          passwordStrength === 3 ? 'bg-yellow-500/20 text-yellow-400' :
                            'bg-red-500/20 text-red-400'
                        }`}>
                        {getStrengthText()}
                      </span>
                    </div>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4].map((level) => (
                        <div
                          key={level}
                          className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${level <= passwordStrength ? getStrengthColor() : 'bg-gray-700'
                            }`}
                        />
                      ))}
                    </div>
                    <ul className="mt-2 text-xs text-gray-500 space-y-1">
                      <li className="flex items-center gap-1">
                        <CheckCircle className={`w-3 h-3 ${formData.newPassword.length >= 6 ? 'text-green-500' : 'text-gray-600'}`} />
                        At least 6 characters
                      </li>
                      <li className="flex items-center gap-1">
                        <CheckCircle className={`w-3 h-3 ${/[A-Z]/.test(formData.newPassword) ? 'text-green-500' : 'text-gray-600'}`} />
                        At least one uppercase letter
                      </li>
                      <li className="flex items-center gap-1">
                        <CheckCircle className={`w-3 h-3 ${/[0-9]/.test(formData.newPassword) ? 'text-green-500' : 'text-gray-600'}`} />
                        At least one number
                      </li>
                      <li className="flex items-center gap-1">
                        <CheckCircle className={`w-3 h-3 ${/[^A-Za-z0-9]/.test(formData.newPassword) ? 'text-green-500' : 'text-gray-600'}`} />
                        At least one special character
                      </li>
                    </ul>
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-gray-300 mb-2">Confirm New Password</label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-yellow-500 pr-10"
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
                  <p className="mt-2 text-xs text-red-500 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> Passwords do not match
                  </p>
                )}
                {formData.confirmPassword && formData.newPassword === formData.confirmPassword && formData.newPassword && (
                  <p className="mt-2 text-xs text-green-500 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" /> Passwords match
                  </p>
                )}
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-black font-semibold rounded-lg transition-all duration-200 disabled:opacity-50"
                >
                  {loading ? 'Updating...' : 'Update Password'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowPasswordModal(false);
                    setFormData({
                      ...formData,
                      currentPassword: '',
                      newPassword: '',
                      confirmPassword: ''
                    });
                    setShowCurrentPassword(false);
                    setShowNewPassword(false);
                    setShowConfirmPassword(false);
                  }}
                  className="flex-1 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 font-semibold rounded-lg transition-all duration-200"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;