import { Link, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { HiMenu, HiX } from 'react-icons/hi'
import toast from 'react-hot-toast'
import NotificationBell from './NotificationBell'

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const navigate = useNavigate()
  const user = JSON.parse(localStorage.getItem('user') || 'null')


  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark shadow-lg sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <span className="text-2xl font-bold text-primary">Hive Construction</span>
          </Link>

          {/* Hamburger */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden text-white text-2xl"
          >
            {isOpen ? <HiX /> : <HiMenu />}
          </button>

          {/* Navigation Links */}
          <div className={`absolute md:relative top-16 md:top-0 left-0 right-0 md:left-auto md:right-auto bg-dark md:bg-transparent ${isOpen ? 'block' : 'hidden'} md:flex md:items-center md:ml-auto gap-0 md:gap-4 p-4 md:p-0 border-t md:border-t-0 border-gray-700`}>
            <Link to="/" className="text-white hover:text-primary transition block md:inline py-2 md:py-0">
              Home
            </Link>
            <Link to="/properties" className="text-white hover:text-primary transition block md:inline py-2 md:py-0">
              Properties
            </Link>

            {user ? (
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:ml-4 md:gap-4 w-full md:w-auto">
                <span className="text-white text-sm md:text-base">Welcome, <span className="font-semibold">{user.name}</span></span>
                <Link to="/profile" className="text-white hover:text-primary transition block md:inline">
                  My Profile
                </Link>
                {user.role === 'investor' && (
                  <Link to="/investor-dashboard" className="text-white hover:text-primary transition block md:inline">
                    Investor Dashboard
                  </Link>
                )}
                {user.role === 'admin' && (
                  <>
                    <Link to="/admin-dashboard" className="text-white hover:text-primary transition block md:inline">
                      Admin Panel
                    </Link>
                    <Link to="/admin/reports" className="text-white hover:text-primary transition block md:inline">
                      Reports
                    </Link>
                  </>
                )}
                <div className="hidden md:block">
                  <NotificationBell />
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-2 md:flex-row md:gap-3 md:ml-4 w-full md:w-auto">
                <Link to="/login" className="bg-primary hover:bg-orange-600 text-white px-6 py-2 rounded font-semibold transition text-center md:text-left">
                  Login
                </Link>
                <Link to="/register" className="border-2 border-white text-white hover:bg-white hover:text-dark px-6 py-2 rounded font-semibold transition text-center md:text-left">
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
