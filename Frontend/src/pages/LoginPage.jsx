import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { HiOutlineMail, HiOutlineLockClosed, HiOutlineEye, HiOutlineEyeOff } from 'react-icons/hi'
import toast from 'react-hot-toast'
import { login } from '../APis/auth/auth'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const navigate = useNavigate()

const handleLogin = async (e) => {
  e.preventDefault();
  setError("");
  setIsSubmitting(true);

  try {
    const response = await login({ email, password });

    console.log("Login response:", response);

    const userData = response?.user;
    const accessToken = response?.accessToken;

    if (!userData?.role) {
      throw new Error("Unexpected login response from server");
    }

    const role = userData.role.toLowerCase();

    localStorage.setItem(
      "user",
      JSON.stringify({
        ...userData,
        role
      })
    );

    localStorage.setItem("accessToken", accessToken);

    toast.success("Login successful");

    setTimeout(() => {
      window.location.href = role === "admin" ? "/admin-dashboard" : "/";
    }, 500);
  } catch (err) {
    console.error("Login error:", err);

    const message =
      err?.response?.data?.message ||
      err?.message ||
      "Invalid email or password";

    setError(message);
    toast.error(message);

  } finally {
    setIsSubmitting(false);
  }
};

  return (
    <div className="min-h-screen bg-auth-pattern bg-cover bg-center bg-fixed flex items-center justify-center py-8 md:py-0">
      <div className="w-full max-w-md mx-4">
        <div className="bg-white bg-opacity-97 rounded-xl shadow-2xl p-10 md:p-12 animate-slide-in">
          <h3 className="text-4xl font-bold text-center text-primary mb-8">Login</h3>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-5 py-4 rounded-lg mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
              <div className="relative">
                <HiOutlineMail className="absolute left-4 top-3.5 text-gray-400 text-xl" />
                <input
                  type="email"
                  placeholder="Enter Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-primary focus:ring-2 focus:ring-blue-200 transition"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-semibold text-gray-700">Password</label>
               
                  <Link to="/forget-password" className="text-xs text-primary hover:text-orange-600 font-semibold transition">
                    Forgot Password?
                  </Link>
              </div>
              <div className="relative">
                <HiOutlineLockClosed className="absolute left-4 top-3.5 text-gray-400 text-xl" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full pl-12 pr-12 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-primary focus:ring-2 focus:ring-blue-200 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-3.5 text-gray-400 hover:text-gray-600 transition text-xl"
                >
                  {showPassword ? <HiOutlineEyeOff /> : <HiOutlineEye />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-primary hover:bg-orange-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-bold py-3 rounded-lg transition shadow-md hover:shadow-lg mt-6 flex items-center justify-center"
            >
              {isSubmitting ? 'Logging in...' : 'Login'}
            </button>
          </form>

          <p className="text-center mt-8 text-sm text-gray-600">
            Don't have an account?{' '}
            <Link to="/register" className="text-primary font-semibold hover:underline">
              Register
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
