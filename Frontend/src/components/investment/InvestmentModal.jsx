import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { investInProperty, calculateOwnershipPercent, calculateRemainingFunding } from '../../APIs/investment/investment'
import { formatCurrency, formatPercent } from '../../utils/property'
import FundingProgressBar from './FundingProgressBar'

export default function InvestmentModal({ property, isOpen, onClose, onSuccess }) {
  const [amount, setAmount] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  // Reset form when modal opens/closes or property changes
  useEffect(() => {
    if (isOpen) {
      setAmount('')
      setError('')
    }
  }, [isOpen, property])

  if (!isOpen || !property) return null

  const totalInvestmentRequired = property.totalInvestmentRequired || 0
  const investedAmount = property.investedAmount || 0
  const remainingFunding = calculateRemainingFunding(investedAmount, totalInvestmentRequired)
  const isFullyFunded = remainingFunding <= 0

  // Calculate ownership preview
  const investmentAmount = parseFloat(amount) || 0
  const ownershipPreview = calculateOwnershipPercent(investmentAmount, totalInvestmentRequired)

  // Validation
  const validateInvestment = () => {
    if (!amount || investmentAmount <= 0) {
      setError('Please enter a valid investment amount')
      return false
    }
    if (investmentAmount > remainingFunding) {
      setError(`Maximum you can invest is ${formatCurrency(remainingFunding)}`)
      return false
    }
    return true
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!validateInvestment()) return

    setIsLoading(true)
    try {
      const response = await investInProperty({
        propertyId: property._id,
        amount: investmentAmount
      })

      if (response) {
        toast.success('Investment successful!')
        onSuccess?.()
        onClose()
      }
    } catch (err) {
      // Error is already handled in the API function
      setError(err?.response?.data?.message || 'Investment failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleAmountChange = (e) => {
    const value = e.target.value
    // Only allow numbers and decimal point
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setAmount(value)
      setError('')
    }
  }

  const handleMaxAmount = () => {
    setAmount(remainingFunding.toString())
    setError('')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="bg-primary px-6 py-4">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold text-white">Invest in Property</h3>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 transition"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <p className="text-white text-sm mt-1 opacity-90">{property.title}</p>
        </div>

        {/* Body */}
        <div className="p-6">
          {/* Funding Progress */}
          <div className="mb-6">
            <FundingProgressBar 
              investedAmount={investedAmount}
              totalRequired={totalInvestmentRequired}
            />
          </div>

          {/* Investment Details */}
          <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
            <div className="bg-gray-50 p-3 rounded">
              <p className="text-gray-500">Total Required</p>
              <p className="font-semibold text-dark">{formatCurrency(totalInvestmentRequired)}</p>
            </div>
            <div className="bg-gray-50 p-3 rounded">
              <p className="text-gray-500">Already Invested</p>
              <p className="font-semibold text-dark">{formatCurrency(investedAmount)}</p>
            </div>
            <div className="bg-gray-50 p-3 rounded">
              <p className="text-gray-500">Remaining</p>
              <p className="font-semibold text-green-600">{formatCurrency(remainingFunding)}</p>
            </div>
            <div className="bg-gray-50 p-3 rounded">
              <p className="text-gray-500">Your Ownership</p>
              <p className="font-semibold text-primary">{formatPercent(ownershipPreview)}%</p>
            </div>
          </div>

          {/* Investment Form */}
          {isFullyFunded ? (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
              <p className="text-yellow-800 font-semibold">This property is fully funded</p>
              <p className="text-yellow-600 text-sm mt-1">No more investments can be made at this time.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Investment Amount (PKR)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={amount}
                    onChange={handleAmountChange}
                    placeholder="Enter amount"
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={handleMaxAmount}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition text-sm font-medium"
                    disabled={isLoading}
                  >
                    Max
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Maximum: {formatCurrency(remainingFunding)}
                </p>
              </div>

              {/* Error Message */}
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading || !amount || investmentAmount <= 0}
                className={`w-full py-3 rounded-lg font-semibold transition ${
                  isLoading || !amount || investmentAmount <= 0
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-primary hover:bg-orange-600 text-white'
                }`}
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Processing...
                  </span>
                ) : (
                  'Confirm Investment'
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}