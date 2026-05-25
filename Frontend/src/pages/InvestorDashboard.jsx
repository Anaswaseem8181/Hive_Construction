import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import SummaryCard from '../components/SummaryCard'
import { getMyInvestments } from '../APIs/investment/investment'
import { formatCurrency, formatPercent } from '../utils/property'

export default function InvestorDashboard() {
  const navigate = useNavigate()
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  const [investments, setInvestments] = useState([])
  const [isLoading, setIsLoading] = useState(true)


  useEffect(() => {
    let isMounted = true

    const loadInvestments = async () => {
      try {
        const data = await getMyInvestments()
        
        if (isMounted) {
          const investmentsArray = Array.isArray(data) ? data : data?.data || []
          setInvestments(investmentsArray)
        }
      } catch (error) {
        if (isMounted) {
          toast.error('Failed to load investment data')
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    loadInvestments()

    return () => {
      isMounted = false
    }
  }, [])

  // Calculate dashboard statistics
  const calculateStats = () => {
    const totalInvested = investments.reduce((sum, inv) => sum + (inv.amount || 0), 0)
    const totalProfit = investments.reduce((sum, inv) => sum + (inv.profitShare || inv.profit || 0), 0)
    const activeInvestments = investments.filter(inv => inv.status === 'active').length
    const averageRoi = totalInvested > 0 ? (totalProfit / totalInvested) * 100 : 0

    return {
      totalInvested: formatCurrency(totalInvested),
      totalProfit: formatCurrency(totalProfit),
      activeInvestments: `${activeInvestments} Properties`,
      roi: `${formatPercent(averageRoi)}%`
    }
  }

  const dashboardData = isLoading ? {
    totalInvested: 'Loading...',
    totalProfit: 'Loading...',
    activeInvestments: 'Loading...',
    roi: 'Loading...'
  } : calculateStats()

  // Get status display
  const getStatusDisplay = (status) => {
    const statusMap = {
      active:    { label: 'Active',      class: 'bg-blue-100 text-blue-800' },
      completed: { label: 'Completed ✓', class: 'bg-green-100 text-green-800' },
      withdrawn: { label: 'Withdrawn',   class: 'bg-gray-100 text-gray-800' },
      closed:    { label: 'Closed',      class: 'bg-gray-100 text-gray-800' },
      sold:      { label: 'Sold',        class: 'bg-purple-100 text-purple-800' },
    }
    return statusMap[status?.toLowerCase()] || { label: status || 'Active', class: 'bg-gray-100 text-gray-800' }
  }

  // Get recent investments (last 5)
  const recentInvestments = investments.slice(0, 5)

  return (
    <div className="min-h-screen bg-dashboard-pattern bg-cover bg-center bg-fixed">
      <div className="bg-black bg-opacity-50 min-h-screen py-12 md:py-16">
        <div className="container mx-auto px-4 md:px-8">
          {/* Header */}
          <div className="mb-12">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-3">Investor Dashboard</h2>
            <p className="text-lg text-gray-300">Welcome back, <span className="font-semibold">{user.name}</span></p>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2  lg:grid-cols-4 gap-6 mb-12">
            <SummaryCard
            
              title="Total Invested"
              amount={dashboardData.totalInvested}
              bgColor="bg-blue-600"
            />
            <SummaryCard
              title="Total Profit"
              amount={dashboardData.totalProfit}
              bgColor="bg-green-600"
            />
            <SummaryCard
              title="Active Investments"
              amount={dashboardData.activeInvestments}
              bgColor="bg-purple-600"
            />
            <SummaryCard
              title="Average ROI"
              amount={dashboardData.roi}
              bgColor="bg-orange-600"
            />
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            <button
              onClick={() => navigate('/investments')}
              className="bg-primary hover:bg-orange-600 text-white font-bold py-4 rounded-lg transition shadow-lg hover:shadow-xl"
            >
              View My Investments
            </button>
            <button
              onClick={() => navigate('/properties')}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-lg transition shadow-lg hover:shadow-xl"
            >
              Explore Properties
            </button>
          </div>

          {/* Recent Investments Table */}
          <div className="bg-white rounded-lg shadow-lg p-8 overflow-x-auto">
            <h3 className="text-3xl font-bold mb-8 text-dark">Recent Investments</h3>
            
            {isLoading ? (
              <div className="animate-pulse">
                <div className="h-12 bg-gray-200 rounded mb-4"></div>
                <div className="h-12 bg-gray-200 rounded mb-4"></div>
                <div className="h-12 bg-gray-200 rounded"></div>
              </div>
            ) : investments.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500 text-lg mb-4">No investments yet</p>
                <button
                  onClick={() => navigate('/properties')}
                  className="px-6 py-3 bg-primary text-white rounded-lg font-semibold hover:bg-orange-600 transition"
                >
                  Browse Properties
                </button>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-gray-100 border-b-2 border-gray-300">
                  <tr>
                    <th className="px-4 py-4 text-left font-semibold text-dark">Property</th>
                    <th className="px-4 py-4 text-left font-semibold text-dark">Invested</th>
                    <th className="px-4 py-4 text-left font-semibold text-dark">Ownership %</th>
                    <th className="px-4 py-4 text-left font-semibold text-dark">Status</th>
                    <th className="px-4 py-4 text-left font-semibold text-dark">Profit Share (75%)</th>
                    <th className="px-4 py-4 text-left font-semibold text-dark">Total Return</th>
                  </tr>
                </thead>
                <tbody>
                  {recentInvestments.map((investment) => {
                    const property = investment.property || {}
                    const propertyName = property.title || property.name || 'Unknown Property'
                    const statusInfo = getStatusDisplay(investment.status)
                    const isCompleted = investment.status === 'completed'
                    const isWithdrawn = investment.status === 'withdrawn'
                    const isFinalized = isCompleted || isWithdrawn

                    return (
                      <tr
                        key={investment._id || investment.id}
                        className={`border-b transition-colors ${
                          isCompleted ? 'bg-green-50 hover:bg-green-100' :
                          isWithdrawn ? 'bg-gray-50 hover:bg-gray-100' :
                          'hover:bg-gray-50'
                        }`}
                      >
                        <td className="px-4 py-4 font-medium text-dark">{propertyName}</td>
                        <td className="px-4 py-4">{formatCurrency(investment.amount)}</td>
                        <td className="px-4 py-4 text-primary font-medium">
                          {formatPercent(investment.ownershipPercent || investment.ownership_percent || 0)}%
                        </td>
                        <td className="px-4 py-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusInfo.class}`}>
                            {statusInfo.label}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-green-600 font-semibold">
                          {isFinalized
                            ? formatCurrency(investment.profitShare || 0)
                            : <span className="text-gray-400">Pending</span>
                          }
                        </td>
                        <td className="px-4 py-4 font-bold">
                          {isFinalized
                            ? <span className="text-green-700">{formatCurrency(investment.totalReturn || investment.amount)}</span>
                            : <span className="text-gray-400">-</span>
                          }
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
