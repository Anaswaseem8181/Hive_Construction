import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  formatCurrency,
  formatPercent,
  getPropertyStatusColor,
  normalizeProperty,
} from '../utils/property'
import InvestmentModal from './investment/InvestmentModal'

export default function PropertyCard({ property, onInvest, onInvestmentSuccess }) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const navigate = useNavigate()
  
  const normalizedProperty = normalizeProperty(property)
  const isClosed = normalizedProperty.statusValue === 'sold' || normalizedProperty.statusValue === 'fully_funded'
  
  // Check if user is logged in and is not admin
  const isLoggedIn = !!localStorage.getItem('user')
  const user = isLoggedIn ? JSON.parse(localStorage.getItem('user')) : {}
  const isAdmin = String(user.role || '').toLowerCase() === 'admin'
  const canInvest = isLoggedIn && !isAdmin && !isClosed

  const handleInvestClick = () => {
    if (!isLoggedIn) {
      navigate('/login')
      return
    }
    if (isAdmin) {
      return // Admin cannot invest
    }
    setIsModalOpen(true)
  }

  const handleModalClose = () => {
    setIsModalOpen(false)
  }

  const handleInvestmentSuccess = () => {
    // Refresh property data after successful investment
    if (onInvestmentSuccess) {
      onInvestmentSuccess(normalizedProperty)
    }
    // Also trigger the original onInvest callback if provided
    if (onInvest) {
      onInvest(normalizedProperty)
    }
  }

  return (
    <>
      <div className="card-hover bg-white rounded-lg shadow-md overflow-hidden border border-gray-100">
        {/* Image */}
        <div className="w-full h-48 bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center overflow-hidden">
          <img
            src={normalizedProperty.imageUrl}
            alt={normalizedProperty.title}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.style.display = 'none'
            }}
          />
        </div>

        {/* Content */}
        <div className="p-4">
          <span className={`inline-block px-3 py-1 rounded-full text-white text-sm font-semibold mb-2 ${getPropertyStatusColor(normalizedProperty.statusValue)}`}>
            {normalizedProperty.statusLabel}
          </span>

          <h5 className="text-lg font-bold text-dark mb-1">{normalizedProperty.title}</h5>
          <p className="text-gray-500 text-sm mb-3">{normalizedProperty.location}</p>

          <div className="space-y-2 mb-4 text-sm">
            <p><strong>Total Investment:</strong> {formatCurrency(normalizedProperty.totalInvestmentRequired)}</p>
            <p><strong>ROI:</strong> {formatPercent(normalizedProperty.roi_percent)}% Expected</p>
          </div>

          {/* Progress Bar */}
          <div className="mb-3">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-green-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${normalizedProperty.funded_percent}%` }}
              ></div>
            </div>
            <small className="text-gray-600">{formatPercent(normalizedProperty.funded_percent)}% Funded</small>
          </div>

          {/* Invest Button - Only show for non-admin users */}
          {!isAdmin && (
            <button
              onClick={handleInvestClick}
              disabled={isClosed}
              className={`w-full py-2 rounded font-semibold transition ${
                isClosed
                  ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                  : 'bg-primary hover:bg-orange-600 text-white'
              }`}
            >
              {isClosed ? 'Closed' : 'Invest Now'}
            </button>
          )}
          
          {/* Admin indicator */}
          {isAdmin && (
            <div className="w-full py-2 text-center bg-gray-100 text-gray-500 rounded font-semibold text-sm">
              Admin View
            </div>
          )}
        </div>
      </div>

      {/* Investment Modal */}
      <InvestmentModal
        property={normalizedProperty}
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onSuccess={handleInvestmentSuccess}
      />
    </>
  )
}
