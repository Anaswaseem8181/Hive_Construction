import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import {
  getMyInvestments,
  requestWithdrawal,
  getMyWithdrawals,
} from '../APIs/investment/investment'
import { formatCurrency, formatPercent } from '../utils/property'
import PortfolioSummary from '../components/investment/PortfolioSummary'

// ─── Withdrawal Request Modal ───────────────────────────────────────────────
const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000

function WithdrawalModal({ investment, onClose, onSubmitted }) {
  const [submitting, setSubmitting] = useState(false)

  const property = investment.property || {}
  const propertyName = property.title || 'This Property'
  const invested = investment.amount || 0
  const marketValue = Number(property.marketValue || 0)
  const totalRequired = Number(property.totalInvestmentRequired || 0)
  const ownershipPct = investment.ownershipPercent || 0
  const investedAt = new Date(investment.createdAt)
  const ageMs = Date.now() - investedAt.getTime()
  const isOlderThanOneYear = ageMs >= ONE_YEAR_MS
  const ageDays = Math.floor(ageMs / (1000 * 60 * 60 * 24))

  // Profit calculation (only when >= 1 year and marketValue > totalRequired)
  const grossProfit = marketValue - totalRequired
  const investorPool = grossProfit > 0 ? grossProfit * 0.75 : 0
  const profitShare = isOlderThanOneYear ? (ownershipPct / 100) * investorPool : 0
  const totalPayout = invested + profitShare

  // Cheque info
  const chequeNumber = investment.securityChequeNumber
  const chequeBank = investment.securityChequeBank
  const chequeStatus = investment.securityChequeStatus || 'Pending'

  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      await requestWithdrawal(investment._id)
      toast.success('Withdrawal request submitted successfully!')
      onSubmitted(investment._id)
      onClose()
    } catch (_) {
      // error toast handled by API helper
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-600 to-orange-400 rounded-t-2xl px-6 py-5 flex items-center justify-between">
          <div>
            <h3 className="text-white font-bold text-xl">Exit / Withdrawal Request</h3>
            <p className="text-orange-100 text-sm mt-0.5">{propertyName}</p>
          </div>
          <button onClick={onClose} className="text-white hover:text-orange-200 text-3xl leading-none transition">&times;</button>
        </div>

        <div className="p-6 space-y-5">
          {/* Investment Age Banner */}
          <div className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold ${isOlderThanOneYear
            ? 'bg-green-50 border border-green-300 text-green-800'
            : 'bg-yellow-50 border border-yellow-300 text-yellow-800'
            }`}>
            <span className="text-2xl">{isOlderThanOneYear ? '✅' : '⚠️'}</span>
            <div>
              <p>Investment age: <strong>{ageDays} days</strong></p>
              <p className="font-normal text-xs mt-0.5">
                {isOlderThanOneYear
                  ? 'More than 1 year — eligible for profit share based on current market value.'
                  : 'Less than 1 year — early withdrawal returns only the original investment (no profit).'}
              </p>
            </div>
          </div>

          {/* Payout Breakdown */}
          <div className="bg-gray-50 rounded-xl border border-gray-200 p-4 space-y-3">
            <h4 className="font-bold text-dark text-sm mb-2">Payout Breakdown</h4>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Original Investment</span>
              <span className="font-semibold">{formatCurrency(invested)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Ownership %</span>
              <span className="font-semibold text-primary">{formatPercent(ownershipPct)}%</span>
            </div>
            {isOlderThanOneYear && grossProfit > 0 && (
              <>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Current Market Value</span>
                  <span className="font-semibold">{formatCurrency(marketValue)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Gross Profit (Market − Cost)</span>
                  <span className="font-semibold text-green-600">+{formatCurrency(grossProfit)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Your Profit Share (75% pool × {formatPercent(ownershipPct)}%)</span>
                  <span className="font-semibold text-green-600">+{formatCurrency(profitShare)}</span>
                </div>
              </>
            )}
            {isOlderThanOneYear && grossProfit <= 0 && (
              <div className="text-xs text-orange-600 bg-orange-50 rounded px-3 py-2">
                Current market value doesn't exceed the cost — capital protection applies. You still get your full original investment.
              </div>
            )}
            <hr className="border-gray-300" />
            <div className="flex justify-between font-bold text-base">
              <span>Total Payout</span>
              <span className="text-green-700">{formatCurrency(totalPayout)}</span>
            </div>
          </div>

          {/* Capital Protection Notice */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-sm text-blue-800">
            🔒 <strong>Capital Protection:</strong> Your original investment of <strong>{formatCurrency(invested)}</strong> is fully secured. In case of a property loss, Hive Construction bears the loss and your principal is returned in full via the security cheque.
          </div>

          {/* Cheque Status */}
          {chequeNumber && (
            <div className="bg-gray-50 rounded-xl border border-gray-200 px-4 py-3 text-sm">
              <p className="font-semibold text-gray-700 mb-1">🧾 Security Cheque Details</p>
              <p className="text-gray-500">Cheque #: <span className="font-medium text-dark">{chequeNumber}</span></p>
              {chequeBank && <p className="text-gray-500">Bank: <span className="font-medium text-dark">{chequeBank}</span></p>}
              <p className="text-gray-500">Status: <span className={`font-semibold ${chequeStatus === 'Issued' ? 'text-green-600' : 'text-yellow-600'}`}>{chequeStatus}</span></p>
            </div>
          )}

          {/* Early Withdrawal Warning */}
          {!isOlderThanOneYear && (
            <div className="bg-yellow-50 border border-yellow-300 rounded-xl px-4 py-3 text-sm text-yellow-800">
              ⚠️ <strong>Early Withdrawal:</strong> Since your investment is less than 1 year old, only your original investment of <strong>{formatCurrency(invested)}</strong> will be returned. No profit share applies.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl border border-gray-300 font-semibold text-gray-600 hover:bg-gray-50 transition text-sm"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="flex-1 py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-semibold transition text-sm disabled:opacity-60"
          >
            {submitting ? 'Submitting…' : 'Confirm Withdrawal Request'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main Page ───────────────────────────────────────────────────────────────
export default function InvestmentsPage() {
  const [investments, setInvestments] = useState([])
  const [myWithdrawals, setMyWithdrawals] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [withdrawTarget, setWithdrawTarget] = useState(null) // investment being withdrawn
  const [activeTab, setActiveTab] = useState('investments') // 'investments' | 'withdrawals'
  const navigate = useNavigate()

  const loadData = async () => {
    try {
      setIsLoading(true)
      const [invData, wdData] = await Promise.all([
        getMyInvestments(),
        getMyWithdrawals(),
      ])
      setInvestments(Array.isArray(invData) ? invData : invData?.data || [])
      setMyWithdrawals(Array.isArray(wdData) ? wdData : wdData?.data || [])
    } catch (err) {
      setError(err?.message || 'Failed to load data')
      toast.error(err?.message || 'Failed to load data')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  // Build a map of investmentId → pending withdrawal status
  const pendingWithdrawalMap = myWithdrawals.reduce((acc, wd) => {
    if (wd.status === 'pending') acc[wd.investment?._id || wd.investment] = true
    return acc
  }, {})

  const calculateStats = () => {
    const totalInvested = investments.reduce((s, i) => s + (i.amount || 0), 0)
    const totalProfit = investments.reduce((s, i) => s + (i.profitShare || 0), 0)
    const activeInvestments = investments.filter(i => i.status === 'active').length
    const averageRoi = totalInvested > 0 ? (totalProfit / totalInvested) * 100 : 0
    return { totalInvested, totalProfit, activeInvestments, averageRoi }
  }

  const stats = calculateStats()

  const getStatusDisplay = (status) => {
    const statusMap = {
      active: { label: 'Active', class: 'bg-green-100 text-green-800' },
      completed: { label: 'Completed ✓', class: 'bg-blue-100 text-blue-800' },
      withdrawn: { label: 'Withdrawn', class: 'bg-gray-100 text-gray-800' },
      closed: { label: 'Closed', class: 'bg-gray-100 text-gray-800' },
      sold: { label: 'Sold', class: 'bg-purple-100 text-purple-800' },
    }
    return statusMap[status?.toLowerCase()] || { label: status || 'Active', class: 'bg-gray-100 text-gray-800' }
  }

  const getWithdrawalStatusStyle = (status) => {
    if (status === 'approved') return 'bg-green-100 text-green-800'
    if (status === 'rejected') return 'bg-red-100 text-red-800'
    return 'bg-yellow-100 text-yellow-800'
  }

  const handleWithdrawalSubmitted = () => {
    // Reload data from server so investments & withdrawal list are fresh
    loadData()
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 md:px-8 py-12 md:py-16">
          <div className="animate-pulse">
            <div className="h-10 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="h-6 bg-gray-200 rounded w-1/2 mb-12"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 md:px-8 py-12 md:py-16">
          <div className="bg-red-50 border border-red-200 rounded-lg p-8 text-center">
            <p className="text-red-600 text-lg font-semibold">Error loading investments</p>
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
      {withdrawTarget && (
        <WithdrawalModal
          investment={withdrawTarget}
          onClose={() => setWithdrawTarget(null)}
          onSubmitted={handleWithdrawalSubmitted}
        />
      )}

      {/* Header */}
      <div className="container mx-auto px-4 md:px-8 py-12 md:py-16">
        <h1 className="text-4xl md:text-5xl font-bold text-dark mb-3">My Investments</h1>
        <p className="text-lg text-gray-600">Track all your property investments and exit options</p>
      </div>

      {/* Summary Cards */}
      <div className="container mx-auto px-4 md:px-8 mb-8">
        <PortfolioSummary
          totalInvested={stats.totalInvested}
          totalProfit={stats.totalProfit}
          activeInvestments={stats.activeInvestments}
          averageRoi={stats.averageRoi}
        />
      </div>

      {/* Tabs */}
      <div className="container mx-auto px-4 md:px-8 mb-6">
        <div className="flex gap-2 border-b border-gray-200">
          {[
            { key: 'investments', label: 'My Investments' },
            { key: 'withdrawals', label: `Withdrawal Requests ${myWithdrawals.length > 0 ? `(${myWithdrawals.length})` : ''}` },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-5 py-3 font-semibold text-sm transition border-b-2 -mb-px ${activeTab === tab.key
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Investments Table */}
      <div className="container mx-auto px-4 md:px-8 mb-12">
        {activeTab === 'investments' && (
          investments.length === 0 ? (
            <div className="bg-white rounded-lg shadow-lg p-12 text-center">
              <p className="text-2xl font-semibold mb-2">No investments yet</p>
              <p className="text-gray-500 mb-6">Start investing in properties to build your portfolio</p>
              <button
                onClick={() => navigate('/properties')}
                className="px-6 py-3 bg-primary text-white rounded-lg font-semibold hover:bg-orange-600 transition"
              >
                Browse Properties
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-lg overflow-x-auto">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-2xl font-bold text-dark">Investment Details</h2>
              </div>
              <table className="w-full text-sm">
                <thead className="bg-gray-100 border-b-2 border-gray-300">
                  <tr>
                    <th className="px-4 py-4 text-left font-semibold text-dark">Property</th>
                    <th className="px-4 py-4 text-left font-semibold text-dark">Invested</th>
                    <th className="px-4 py-4 text-left font-semibold text-dark">Ownership %</th>
                    <th className="px-4 py-4 text-left font-semibold text-dark">Profit Share (75%)</th>
                    <th className="px-4 py-4 text-left font-semibold text-dark">Total Return</th>
                    <th className="px-4 py-4 text-left font-semibold text-dark">Security Cheque</th>
                    <th className="px-4 py-4 text-left font-semibold text-dark">Status</th>
                    <th className="px-4 py-4 text-left font-semibold text-dark">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {investments.map((investment) => {
                    const property = investment.property || {}
                    const propertyName = property.title || 'Unknown Property'
                    const propertyLocation = property.location || ''
                    const statusInfo = getStatusDisplay(investment.status)
                    const isCompleted = investment.status === 'completed'
                    const isWithdrawn = investment.status === 'withdrawn'
                    const isFinalized = isCompleted || isWithdrawn
                    const isActive = investment.status === 'active'
                    const hasPending = pendingWithdrawalMap[investment._id]
                    const chequeStatus = investment.securityChequeStatus || 'Pending'
                    const chequeNumber = investment.securityChequeNumber

                    return (
                      <tr
                        key={investment._id}
                        className={`border-b transition-colors ${isCompleted ? 'bg-blue-50 hover:bg-blue-100' :
                          isWithdrawn ? 'bg-gray-50 hover:bg-gray-100' :
                            'hover:bg-gray-50'
                          }`}
                      >
                        <td className="px-4 py-4">
                          <p className="font-semibold text-dark">{propertyName}</p>
                          {propertyLocation && <p className="text-xs text-gray-500 mt-0.5">{propertyLocation}</p>}
                        </td>
                        <td className="px-4 py-4 font-semibold">{formatCurrency(investment.amount)}</td>
                        <td className="px-4 py-4 text-primary font-medium">
                          {formatPercent(investment.ownershipPercent || 0)}%
                        </td>
                        <td className="px-4 py-4 font-semibold text-green-600">
                          {isFinalized
                            ? formatCurrency(investment.profitShare || 0)
                            : <span className="text-gray-400">Pending</span>
                          }
                        </td>
                        <td className="px-4 py-4 font-bold">
                          {isFinalized
                            ? <span className="text-blue-700">{formatCurrency(investment.totalReturn || investment.amount)}</span>
                            : <span className="text-gray-400">—</span>
                          }
                        </td>
                        <td className="px-4 py-4">
                          <div>
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${chequeStatus === 'Issued' ? 'bg-green-100 text-green-800' :
                              chequeStatus === 'Returned' ? 'bg-blue-100 text-blue-800' :
                                chequeStatus === 'Cancelled' ? 'bg-red-100 text-red-800' :
                                  'bg-yellow-100 text-yellow-800'
                              }`}>
                              {chequeStatus}
                            </span>
                            {chequeNumber && (
                              <p className="text-xs text-gray-400 mt-0.5">{chequeNumber}</p>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusInfo.class}`}>
                            {statusInfo.label}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          {isActive && !hasPending && (
                            <button
                              onClick={() => setWithdrawTarget(investment)}
                              className="px-3 py-1.5 bg-orange-100 hover:bg-orange-200 text-orange-700 text-xs font-semibold rounded-lg transition"
                            >
                              Request Withdrawal
                            </button>
                          )}
                          {isActive && hasPending && (
                            <span className="px-3 py-1.5 bg-yellow-100 text-yellow-700 text-xs font-semibold rounded-lg">
                              ⏳ Withdrawal Pending
                            </span>
                          )}
                          {!isActive && (
                            <span className="text-gray-400 text-xs">—</span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )
        )}

        {/* Withdrawal Requests Tab */}
        {activeTab === 'withdrawals' && (
          myWithdrawals.length === 0 ? (
            <div className="bg-white rounded-lg shadow-lg p-12 text-center">
              <p className="text-xl font-semibold text-gray-500">No withdrawal requests yet</p>
              <p className="text-gray-400 mt-2 text-sm">You can request withdrawal from your active investments</p>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-lg overflow-x-auto">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-2xl font-bold text-dark">My Withdrawal Requests</h2>
              </div>
              <table className="w-full text-sm">
                <thead className="bg-gray-100 border-b-2 border-gray-300">
                  <tr>
                    <th className="px-4 py-4 text-left font-semibold text-dark">Property</th>
                    <th className="px-4 py-4 text-left font-semibold text-dark">Principal</th>
                    <th className="px-4 py-4 text-left font-semibold text-dark">Profit Share</th>
                    <th className="px-4 py-4 text-left font-semibold text-dark">Total Payout</th>
                    <th className="px-4 py-4 text-left font-semibold text-dark">Status</th>
                    <th className="px-4 py-4 text-left font-semibold text-dark">Admin Notes</th>
                    <th className="px-4 py-4 text-left font-semibold text-dark">Requested</th>
                  </tr>
                </thead>
                <tbody>
                  {myWithdrawals.map((wd) => (
                    <tr key={wd._id} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-4 font-semibold">{wd.property?.title || '—'}</td>
                      <td className="px-4 py-4">{formatCurrency(wd.originalInvestment || 0)}</td>
                      <td className="px-4 py-4 text-green-600 font-semibold">
                        {wd.calculatedProfitShare > 0
                          ? `+${formatCurrency(wd.calculatedProfitShare)}`
                          : <span className="text-gray-400">None</span>
                        }
                      </td>
                      <td className="px-4 py-4 font-bold text-blue-700">{formatCurrency(wd.amount || 0)}</td>
                      <td className="px-4 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${getWithdrawalStatusStyle(wd.status)}`}>
                          {wd.status}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-gray-500 text-xs">{wd.adminNotes || '—'}</td>
                      <td className="px-4 py-4 text-gray-500">
                        {wd.createdAt ? new Date(wd.createdAt).toLocaleDateString() : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}

        {/* Investment Info Banner */}
        {investments.length > 0 && (
          <div className="mt-8 bg-primary text-white rounded-lg p-8">
            <h3 className="text-2xl font-bold mb-6">Investment Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div>
                <p className="text-sm opacity-90 mb-2">Profit Sharing Model</p>
                <p className="text-2xl md:text-3xl font-bold">75% Investors | 25% Hive</p>
              </div>
              <div>
                <p className="text-sm opacity-90 mb-2">Capital Protection</p>
                <p className="text-2xl md:text-3xl font-bold">100% Guaranteed</p>
              </div>
              <div>
                <p className="text-sm opacity-90 mb-2">Average ROI</p>
                <p className="text-2xl md:text-3xl font-bold">{formatPercent(stats.averageRoi)}%</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
