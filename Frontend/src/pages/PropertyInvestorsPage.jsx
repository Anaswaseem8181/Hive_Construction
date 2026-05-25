import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { getPropertyInvestors } from '../APIs/investment/investment'
import { formatCurrency, formatPercent } from '../utils/property'
import InvestorTable from '../components/investment/InvestorTable'
import FundingProgressBar from '../components/investment/FundingProgressBar'

export default function PropertyInvestorsPage() {
  const { propertyId } = useParams()
  const navigate = useNavigate()
  const [investors, setInvestors] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [propertyInfo, setPropertyInfo] = useState(null)

  useEffect(() => {
    let isMounted = true

    const loadInvestors = async () => {
      try {
        setIsLoading(true)
        const data = await getPropertyInvestors(propertyId)
        
        if (isMounted) {
          // Handle different response formats
          const investorsArray = Array.isArray(data) ? data : data?.data || []
          setInvestors(investorsArray)
          
          // Extract property info if available
          if (data?.property) {
            setPropertyInfo(data.property)
          }
        }
      } catch (err) {
        if (isMounted) {
          setError(err?.message || 'Failed to load investors')
          toast.error(err?.message || 'Failed to load investors')
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    if (propertyId) {
      loadInvestors()
    }

    return () => {
      isMounted = false
    }
  }, [propertyId])

  // Calculate funding summary
  const calculateSummary = () => {
    const totalInvested = investors.reduce((sum, inv) => sum + (inv.amount || 0), 0)
    const investorCount = investors.length
    const totalRequired = propertyInfo?.totalInvestmentRequired || 0
    const progress = totalRequired > 0 ? (totalInvested / totalRequired) * 100 : 0

    return {
      totalInvested,
      investorCount,
      totalRequired,
      progress
    }
  }

  const summary = calculateSummary()

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 md:px-8 py-12 md:py-16">
          {/* Back Button Skeleton */}
          <div className="animate-pulse h-8 w-32 bg-gray-200 rounded mb-6"></div>
          
          {/* Header Skeleton */}
          <div className="animate-pulse mb-8">
            <div className="h-10 bg-gray-200 rounded w-1/3 mb-2"></div>
            <div className="h-6 bg-gray-200 rounded w-1/2"></div>
          </div>

          {/* Summary Cards Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded-lg"></div>
            ))}
          </div>

          {/* Table Skeleton */}
          <div className="animate-pulse">
            <div className="h-12 bg-gray-200 rounded mb-4"></div>
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded mb-2"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 md:px-8 py-12 md:py-16">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-primary hover:text-orange-600 mb-6"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
          
          <div className="bg-red-50 border border-red-200 rounded-lg p-8 text-center">
            <p className="text-red-600 text-lg font-semibold">Error loading investors</p>
            <p className="text-red-500 mt-2">{error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="mt-4 px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 md:px-8 py-12 md:py-16">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-primary hover:text-orange-600 mb-6 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Dashboard
        </button>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-dark mb-2">Property Investors</h1>
          <p className="text-lg text-gray-600">
            {propertyInfo?.title || `Property ID: ${propertyId}`}
          </p>
        </div>

        {/* Funding Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {/* Total Invested */}
          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500">
            <p className="text-gray-500 text-sm font-medium">Total Invested</p>
            <p className="text-2xl font-bold text-dark mt-1">{formatCurrency(summary.totalInvested)}</p>
          </div>

          {/* Investor Count */}
          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-purple-500">
            <p className="text-gray-500 text-sm font-medium">Total Investors</p>
            <p className="text-2xl font-bold text-dark mt-1">{summary.investorCount}</p>
          </div>

          {/* Funding Goal */}
          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500">
            <p className="text-gray-500 text-sm font-medium">Funding Goal</p>
            <p className="text-2xl font-bold text-dark mt-1">{formatCurrency(summary.totalRequired)}</p>
          </div>

          {/* Funding Progress */}
          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-orange-500">
            <p className="text-gray-500 text-sm font-medium">Funding Progress</p>
            <p className="text-2xl font-bold text-orange-600 mt-1">{formatPercent(summary.progress)}%</p>
          </div>
        </div>

        {/* Funding Progress Bar */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <FundingProgressBar 
            investedAmount={summary.totalInvested}
            totalRequired={summary.totalRequired}
          />
        </div>

        {/* Investors Table */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-dark mb-6">Investor List</h2>
          <InvestorTable investors={investors} isLoading={isLoading} />
        </div>

        {/* Additional Info */}
        {investors.length > 0 && (
          <div className="bg-primary text-white rounded-lg p-8">
            <h3 className="text-2xl font-bold mb-6">Investment Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div>
                <p className="text-sm opacity-90 mb-2">Average Investment</p>
                <p className="text-2xl md:text-3xl font-bold">
                  {formatCurrency(summary.investorCount > 0 ? summary.totalInvested / summary.investorCount : 0)}
                </p>
              </div>
              <div>
                <p className="text-sm opacity-90 mb-2">Remaining to Fund</p>
                <p className="text-2xl md:text-3xl font-bold">
                  {formatCurrency(Math.max(0, summary.totalRequired - summary.totalInvested))}
                </p>
              </div>
              <div>
                <p className="text-sm opacity-90 mb-2">Profit Sharing</p>
                <p className="text-2xl md:text-3xl font-bold">75% Investors | 25% Hive</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}