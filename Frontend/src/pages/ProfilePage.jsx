import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  HiOutlineUser, 
  HiOutlineMail, 
  HiOutlineShieldCheck,
  HiOutlineLockClosed, 
  HiOutlineEye, 
  HiOutlineEyeOff, 
  HiOutlineLogout,
  HiOutlineKey,
  HiOutlineCheckCircle
} from 'react-icons/hi'
import toast, { Toaster } from 'react-hot-toast'
import MainLayout from '../layouts/MainLayout'
import { changePassword, logout } from '../APis/auth/auth'

export default function ProfilePage() {
  const [user, setUser] = useState(() => {
    const userData = localStorage.getItem('user')
    return userData ? JSON.parse(userData) : {}
  })

  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [passwordStrength, setPasswordStrength] = useState(0)
  const navigate = useNavigate()

  // Check password strength
  useEffect(() => {
    const checkStrength = (password) => {
      if (!password) return 0
      let strength = 0
      if (password.length >= 6) strength += 1
      if (password.length >= 8) strength += 1
      if (/[A-Z]/.test(password)) strength += 1
      if (/[0-9]/.test(password)) strength += 1
      if (/[^A-Za-z0-9]/.test(password)) strength += 1
      return Math.min(strength, 4)
    }
    setPasswordStrength(checkStrength(passwordData.newPassword))
  }, [passwordData.newPassword])

  const getStrengthColor = () => {
    switch(passwordStrength) {
      case 1: return 'bg-red-500'
      case 2: return 'bg-orange-500'
      case 3: return 'bg-yellow-500'
      case 4: return 'bg-green-500'
      default: return 'bg-gray-300'
    }
  }

  const getStrengthText = () => {
    switch(passwordStrength) {
      case 1: return 'Weak'
      case 2: return 'Fair'
      case 3: return 'Good'
      case 4: return 'Strong'
      default: return 'Very Weak'
    }
  }

  const handlePasswordChange = (e) => {
    setPasswordData({
      ...passwordData,
      [e.target.name]: e.target.value,
    })
  }

  const handleChangePassword = async (e) => {
    e.preventDefault()

    // Validation
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      toast.error('All fields are required')
      return
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match')
      return
    }

    if (passwordData.newPassword.length < 6) {
      toast.error('New password must be at least 6 characters')
      return
    }

    if (passwordData.currentPassword === passwordData.newPassword) {
      toast.error('New password must be different from current password')
      return
    }

    setIsLoading(true)

    try {
      const response = await changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      })

      if (response.success) {
        toast.success('Password changed successfully!')
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        })
        setIsChangingPassword(false)
      } else {
        toast.error(response.message || 'Failed to change password')
      }
    } catch (error) {
      console.error('Password change error:', error)
      if (error.message) {
        toast.error(error.message)
      } else if (typeof error === 'string') {
        toast.error(error)
      } else {
        toast.error('Failed to change password. Please try again.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      await logout()
      localStorage.removeItem('user')
      localStorage.removeItem('accessToken')
      localStorage.removeItem('registrationEmail')
      toast.success('Logged out successfully')
      navigate('/login')
    } catch (error) {
      toast.error('Logout failed')
    }
  }

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          {/* Profile Header */}
          <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-4xl font-bold text-gray-800">My Profile</h1>
                <p className="text-gray-500 mt-2">Manage your account settings</p>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-5 py-2.5 rounded-lg transition-all duration-200 transform hover:scale-105"
              >
                <HiOutlineLogout className="text-lg" />
                Logout
              </button>
            </div>

            {/* User Information */}
            <div className="space-y-6">
              {/* Name */}
              <div className="border-b border-gray-200 pb-6 hover:bg-gray-50 transition-colors rounded-lg p-4">
                <div className="flex items-start gap-4">
                  <div className="bg-blue-100 p-3 rounded-lg">
                    <HiOutlineUser className="text-2xl text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-semibold text-gray-600 mb-2">Full Name</label>
                    <p className="text-lg font-medium text-gray-900">{user.name || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Email */}
              <div className="border-b border-gray-200 pb-6 hover:bg-gray-50 transition-colors rounded-lg p-4">
                <div className="flex items-start gap-4">
                  <div className="bg-green-100 p-3 rounded-lg">
                    <HiOutlineMail className="text-2xl text-green-600" />
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-semibold text-gray-600 mb-2">Email Address</label>
                    <p className="text-lg font-medium text-gray-900">{user.email || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Role */}
              <div className="hover:bg-gray-50 transition-colors rounded-lg p-4">
                <div className="flex items-start gap-4">
                  <div className="bg-purple-100 p-3 rounded-lg">
                    <HiOutlineShieldCheck className="text-2xl text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-semibold text-gray-600 mb-2">Account Role</label>
                    <p className="text-lg font-medium text-gray-900 capitalize">{user.role || 'N/A'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Change Password Section */}
          <div className="bg-white rounded-xl shadow-lg p-8 transition-all duration-300">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">Security</h2>
                <p className="text-gray-500 text-sm mt-1">Manage your password and security settings</p>
              </div>
              {!isChangingPassword && (
                <button
                  onClick={() => setIsChangingPassword(true)}
                  className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-6 py-2.5 rounded-lg transition-all duration-200 transform hover:scale-105 font-semibold shadow-md"
                >
                  Change Password
                </button>
              )}
            </div>

            {isChangingPassword && (
              <form onSubmit={handleChangePassword} className="space-y-6">
                {/* Current Password */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Current Password
                  </label>
                  <div className="relative">
                    <HiOutlineLockClosed className="absolute left-4 top-3.5 text-gray-400 text-lg" />
                    <input
                      type={showCurrentPassword ? 'text' : 'password'}
                      name="currentPassword"
                      placeholder="Enter your current password"
                      value={passwordData.currentPassword}
                      onChange={handlePasswordChange}
                      required
                      className="w-full pl-12 pr-12 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-4 top-3.5 text-gray-400 hover:text-gray-600 transition-colors duration-200 text-lg"
                    >
                      {showCurrentPassword ? <HiOutlineEyeOff /> : <HiOutlineEye />}
                    </button>
                  </div>
                </div>

                {/* New Password */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    New Password
                  </label>
                  <div className="relative">
                    <HiOutlineKey className="absolute left-4 top-3.5 text-gray-400 text-lg" />
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      name="newPassword"
                      placeholder="Enter new password"
                      value={passwordData.newPassword}
                      onChange={handlePasswordChange}
                      required
                      className="w-full pl-12 pr-12 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-4 top-3.5 text-gray-400 hover:text-gray-600 transition-colors duration-200 text-lg"
                    >
                      {showNewPassword ? <HiOutlineEyeOff /> : <HiOutlineEye />}
                    </button>
                  </div>
                  
                  {/* Password Strength Indicator */}
                  {passwordData.newPassword && (
                    <div className="mt-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-gray-600">Password Strength:</span>
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                          passwordStrength === 4 ? 'bg-green-100 text-green-700' :
                          passwordStrength === 3 ? 'bg-yellow-100 text-yellow-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {getStrengthText()}
                        </span>
                      </div>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4].map((level) => (
                          <div
                            key={level}
                            className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                              level <= passwordStrength ? getStrengthColor() : 'bg-gray-200'
                            }`}
                          />
                        ))}
                      </div>
                      <ul className="mt-2 text-xs text-gray-500 space-y-1">
                        <li className="flex items-center gap-1">
                          <HiOutlineCheckCircle className={`text-xs ${passwordData.newPassword.length >= 6 ? 'text-green-500' : 'text-gray-400'}`} />
                          At least 6 characters
                        </li>
                        <li className="flex items-center gap-1">
                          <HiOutlineCheckCircle className={`text-xs ${/[A-Z]/.test(passwordData.newPassword) ? 'text-green-500' : 'text-gray-400'}`} />
                          At least one uppercase letter
                        </li>
                        <li className="flex items-center gap-1">
                          <HiOutlineCheckCircle className={`text-xs ${/[0-9]/.test(passwordData.newPassword) ? 'text-green-500' : 'text-gray-400'}`} />
                          At least one number
                        </li>
                        <li className="flex items-center gap-1">
                          <HiOutlineCheckCircle className={`text-xs ${/[^A-Za-z0-9]/.test(passwordData.newPassword) ? 'text-green-500' : 'text-gray-400'}`} />
                          At least one special character
                        </li>
                      </ul>
                    </div>
                  )}
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <HiOutlineLockClosed className="absolute left-4 top-3.5 text-gray-400 text-lg" />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      name="confirmPassword"
                      placeholder="Confirm your new password"
                      value={passwordData.confirmPassword}
                      onChange={handlePasswordChange}
                      required
                      className="w-full pl-12 pr-12 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-4 top-3.5 text-gray-400 hover:text-gray-600 transition-colors duration-200 text-lg"
                    >
                      {showConfirmPassword ? <HiOutlineEyeOff /> : <HiOutlineEye />}
                    </button>
                  </div>
                  {passwordData.confirmPassword && passwordData.newPassword !== passwordData.confirmPassword && (
                    <p className="mt-2 text-xs text-red-500 flex items-center gap-1">
                      <span>⚠️</span> Passwords do not match
                    </p>
                  )}
                  {passwordData.confirmPassword && passwordData.newPassword === passwordData.confirmPassword && passwordData.newPassword && (
                    <p className="mt-2 text-xs text-green-500 flex items-center gap-1">
                      <HiOutlineCheckCircle /> Passwords match
                    </p>
                  )}
                </div>

                {/* Buttons */}
                <div className="flex gap-4 pt-4">
                  <button
                    type="submit"
                    disabled={isLoading || passwordData.newPassword !== passwordData.confirmPassword}
                    className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed text-white font-bold py-3 rounded-lg transition-all duration-200 transform hover:scale-105 flex items-center justify-center shadow-md"
                  >
                    {isLoading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Updating Password...
                      </>
                    ) : (
                      'Update Password'
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsChangingPassword(false)
                      setPasswordData({
                        currentPassword: '',
                        newPassword: '',
                        confirmPassword: '',
                      })
                    }}
                    className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-3 rounded-lg transition-all duration-200"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}

            {!isChangingPassword && (
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-5">
                <div className="flex items-start gap-3">
                  <HiOutlineShieldCheck className="text-blue-600 text-xl mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-blue-900 mb-1">Security Tip</p>
                    <p className="text-sm text-blue-800">
                      Click "Change Password" to update your password. For better security, use a strong password with at least 8 characters, including uppercase letters, numbers, and special characters.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: '#10B981',
              secondary: '#fff',
            },
          },
          error: {
            duration: 3000,
            iconTheme: {
              primary: '#FF5252',
              secondary: '#fff',
            },
          },
        }}
      />
   
    </>
  )
}