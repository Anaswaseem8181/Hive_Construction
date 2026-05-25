import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import SummaryCard from '../components/SummaryCard'
import { deleteProperty, getAllProperties } from '../APis/property/property'
import {
  getAllWithdrawals,
  approveWithdrawalRequest,
  rejectWithdrawalRequest,
} from '../APIs/investment/investment'
import {
  formatCurrency,
  formatPercent,
  getPropertyStatusTone,
  normalizeProperties,
} from '../utils/property'

// ─── Approve / Reject Modal ──────────────────────────────────────────────────
function WithdrawalActionModal({ request, action, onClose, onDone }) {
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)

  const isApprove = action === 'approve'

  const handleConfirm = async () => {
    setLoading(true)
    try {
      if (isApprove) {
        await approveWithdrawalRequest(request._id, notes || 'Approved')
      } else {
        await rejectWithdrawalRequest(request._id, notes || 'Rejected')
      }
      onDone(request._id, isApprove ? 'approved' : 'rejected')
      onClose()
    } catch (_) {
      // toast handled by API helper
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className={`rounded-t-2xl px-6 py-4 ${isApprove ? 'bg-green-600' : 'bg-red-600'}`}>
          <h3 className="text-white font-bold text-lg">
            {isApprove ? '✅ Approve Withdrawal' : '❌ Reject Withdrawal'}
          </h3>
          <p className="text-white/80 text-sm mt-0.5">
            {request.investor?.name} — {request.property?.title}
          </p>
        </div>

        <div className="p-6 space-y-4">
          <div className="bg-gray-50 rounded-xl p-4 text-sm space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-500">Principal</span>
              <span className="font-semibold">{formatCurrency(request.originalInvestment || 0)}</span>
            </div>
            {request.calculatedProfitShare > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-500">Profit Share</span>
                <span className="font-semibold text-green-600">+{formatCurrency(request.calculatedProfitShare)}</span>
              </div>
            )}
            <hr />
            <div className="flex justify-between font-bold">
              <span>Total Payout</span>
              <span className="text-blue-700">{formatCurrency(request.amount || 0)}</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Admin Notes (optional)</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={3}
              placeholder={isApprove ? 'e.g. Principal returned to investor' : 'e.g. Property still active, cannot process yet'}
              className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
            />
          </div>
        </div>

        <div className="px-6 pb-6 flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-300 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition">
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading}
            className={`flex-1 py-2.5 rounded-xl text-white text-sm font-semibold transition disabled:opacity-60 ${
              isApprove ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
            }`}
          >
            {loading ? 'Processing…' : isApprove ? 'Approve' : 'Reject'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Admin Dashboard ─────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const navigate = useNavigate()
  const user = JSON.parse(localStorage.getItem('user') || '{}')

  const [properties, setProperties]         = useState([])
  const [withdrawals, setWithdrawals]       = useState([])
  const [isLoading, setIsLoading]           = useState(true)
  const [isRefreshing, setIsRefreshing]     = useState(false)
  const [deletingId, setDeletingId]         = useState('')
  const [activeTab, setActiveTab]           = useState('properties') // 'properties' | 'withdrawals'
  const [wdFilter, setWdFilter]             = useState('pending')   // 'pending' | 'approved' | 'rejected' | ''
  const [actionModal, setActionModal]       = useState(null)        // { request, action }

  const loadProperties = async (refresh = false) => {
    if (refresh) setIsRefreshing(true)
    else setIsLoading(true)
    try {
      const response = await getAllProperties()
      setProperties(normalizeProperties(response))
    } catch (error) {
      setProperties([])
      toast.error(error?.message || 'Failed to load properties')
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  const loadWithdrawals = async (status = wdFilter) => {
    try {
      const data = await getAllWithdrawals(status)
      setWithdrawals(Array.isArray(data) ? data : data?.data || [])
    } catch (_) {}
  }

  useEffect(() => {
    loadProperties()
    loadWithdrawals('pending')
  }, [])

  const handleWdFilterChange = (status) => {
    setWdFilter(status)
    loadWithdrawals(status)
  }

  const handleActionDone = (requestId, newStatus) => {
    // Reload both properties and withdrawals to ensure everything is perfectly in sync with the database
    loadProperties()
    loadWithdrawals(wdFilter)
  }

  const handleDelete = async (property) => {
    if (!window.confirm(`Delete "${property.title}"? This action cannot be undone.`)) return
    setDeletingId(property._id)
    try {
      await deleteProperty(property._id)
      setProperties(prev => prev.filter(item => item._id !== property._id))
      toast.success('Property deleted successfully')
    } catch (error) {
      toast.error(error?.message || 'Failed to delete property')
    } finally {
      setDeletingId('')
    }
  }

  const pendingCount = withdrawals.filter(w => w.status === 'pending').length

  const adminData = {
    totalProjects:     properties.length,
    totalFunded:       formatCurrency(properties.reduce((t, p) => t + p.investedAmount, 0)),
    activeProjects:    properties.filter(p => p.statusValue !== 'sold').length,
    completedProjects: properties.filter(p => p.statusValue === 'sold').length,
  }

  return (
    <div className="min-h-screen bg-dashboard-pattern bg-cover bg-center bg-fixed">
      <div className="bg-black bg-opacity-50 min-h-screen py-12 md:py-16">
        <div className="container mx-auto px-4 md:px-8">

          {/* Header */}
          <div className="mb-12">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-3">Admin Dashboard</h2>
            <p className="text-lg text-gray-300">Welcome, <span className="font-semibold">{user.name}</span></p>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            <SummaryCard title="Total Projects"     amount={adminData.totalProjects}     bgColor="bg-blue-600" />
            <SummaryCard title="Total Funded"       amount={adminData.totalFunded}       bgColor="bg-green-600" />
            <SummaryCard title="Active Projects"    amount={adminData.activeProjects}    bgColor="bg-purple-600" />
            <SummaryCard title="Completed Projects" amount={adminData.completedProjects} bgColor="bg-orange-600" />
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <button
              onClick={() => navigate('/admin/properties/create')}
              className="bg-primary hover:bg-orange-600 text-white font-bold py-4 rounded-lg transition shadow-lg"
            >
              Add New Property
            </button>
            <button
              onClick={() => loadProperties(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-lg transition shadow-lg"
            >
              {isRefreshing ? 'Refreshing…' : 'Refresh Properties'}
            </button>
            <button
              onClick={() => { setActiveTab('withdrawals'); handleWdFilterChange('pending') }}
              className="relative bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-lg transition shadow-lg"
            >
              Withdrawal Requests
              {pendingCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center">
                  {pendingCount}
                </span>
              )}
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-6 border-b border-white/20">
            {[
              { key: 'properties',  label: 'All Projects' },
              { key: 'withdrawals', label: `Withdrawal Requests${pendingCount > 0 ? ` (${pendingCount})` : ''}` },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => {
                  setActiveTab(tab.key)
                  if (tab.key === 'withdrawals') handleWdFilterChange(wdFilter)
                }}
                className={`px-5 py-3 font-semibold text-sm transition border-b-2 -mb-px ${
                  activeTab === tab.key
                    ? 'border-primary text-primary bg-white/10 rounded-t-lg'
                    : 'border-transparent text-gray-300 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* ── Properties Tab ── */}
          {activeTab === 'properties' && (
            <div className="bg-white rounded-lg shadow-lg p-8 overflow-x-auto">
              <h3 className="text-3xl font-bold mb-8 text-dark">All Projects</h3>
              <table className="w-full text-sm">
                <thead className="bg-gray-100 border-b-2 border-gray-300">
                  <tr>
                    <th className="px-4 py-4 text-left font-semibold text-dark">Project Name</th>
                    <th className="px-4 py-4 text-left font-semibold text-dark">Location</th>
                    <th className="px-4 py-4 text-left font-semibold text-dark">Total Required</th>
                    <th className="px-4 py-4 text-left font-semibold text-dark">Invested</th>
                    <th className="px-4 py-4 text-left font-semibold text-dark">Status</th>
                    <th className="px-4 py-4 text-left font-semibold text-dark">Funded %</th>
                    <th className="px-4 py-4 text-left font-semibold text-dark">ROI %</th>
                    <th className="px-4 py-4 text-left font-semibold text-dark">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr><td colSpan="8" className="px-4 py-10 text-center text-gray-500">Loading properties…</td></tr>
                  ) : properties.length ? (
                    properties.map((project) => (
                      <tr key={project._id} className="border-b hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-4">
                          <p className="font-semibold">{project.title}</p>
                          <p className="mt-1 text-xs text-gray-500">{project.description || 'No description'}</p>
                        </td>
                        <td className="px-4 py-4">{project.location}</td>
                        <td className="px-4 py-4">{formatCurrency(project.totalInvestmentRequired)}</td>
                        <td className="px-4 py-4">{formatCurrency(project.investedAmount)}</td>
                        <td className="px-4 py-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getPropertyStatusTone(project.statusValue)}`}>
                            {project.statusLabel}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${project.funded_percent}%` }} />
                          </div>
                          <small className="text-gray-600">{formatPercent(project.funded_percent)}%</small>
                        </td>
                        <td className="px-4 py-3">{formatPercent(project.roi_percent)}%</td>
                        <td className="px-4 py-4">
                          <div className="flex flex-col gap-2 sm:flex-row">
                            <Link
                              to={`/admin/properties/${project._id}/edit`}
                              className="inline-flex items-center justify-center rounded bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700 transition"
                            >
                              Edit
                            </Link>
                            <Link
                              to={`/admin/properties/${project._id}/investors`}
                              className="inline-flex items-center justify-center rounded bg-green-600 px-3 py-2 text-xs font-semibold text-white hover:bg-green-700 transition"
                            >
                              Investors
                            </Link>
                            <button
                              onClick={() => handleDelete(project)}
                              disabled={deletingId === project._id}
                              className="inline-flex items-center justify-center rounded bg-red-600 px-3 py-2 text-xs font-semibold text-white hover:bg-red-700 transition disabled:opacity-50"
                            >
                              {deletingId === project._id ? 'Deleting…' : 'Delete'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan="8" className="px-4 py-10 text-center text-gray-500">No properties yet.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* ── Withdrawal Requests Tab ── */}
          {activeTab === 'withdrawals' && (
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
              <div className="px-8 pt-8 pb-4 border-b border-gray-200">
                <h3 className="text-2xl font-bold text-dark mb-4">Withdrawal Requests</h3>
                {/* Filter */}
                <div className="flex gap-2">
                  {[
                    { value: 'pending',  label: 'Pending' },
                    { value: 'approved', label: 'Approved' },
                    { value: 'rejected', label: 'Rejected' },
                    { value: '',         label: 'All' },
                  ].map(f => (
                    <button
                      key={f.value}
                      onClick={() => handleWdFilterChange(f.value)}
                      className={`px-4 py-1.5 rounded-full text-sm font-semibold transition ${
                        wdFilter === f.value
                          ? 'bg-primary text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              {withdrawals.length === 0 ? (
                <div className="p-12 text-center text-gray-500">
                  <p className="text-lg font-semibold">No withdrawal requests found</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-100 border-b-2 border-gray-300">
                      <tr>
                        <th className="px-4 py-4 text-left font-semibold text-dark">Investor</th>
                        <th className="px-4 py-4 text-left font-semibold text-dark">Property</th>
                        <th className="px-4 py-4 text-left font-semibold text-dark">Principal</th>
                        <th className="px-4 py-4 text-left font-semibold text-dark">Profit Share</th>
                        <th className="px-4 py-4 text-left font-semibold text-dark">Total Payout</th>
                        <th className="px-4 py-4 text-left font-semibold text-dark">Status</th>
                        <th className="px-4 py-4 text-left font-semibold text-dark">Requested</th>
                        <th className="px-4 py-4 text-left font-semibold text-dark">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {withdrawals.map((wd) => (
                        <tr key={wd._id} className="border-b hover:bg-gray-50">
                          <td className="px-4 py-4">
                            <p className="font-semibold">{wd.investor?.name || '—'}</p>
                            <p className="text-xs text-gray-400">{wd.investor?.email || ''}</p>
                          </td>
                          <td className="px-4 py-4">
                            <p className="font-medium">{wd.property?.title || '—'}</p>
                            <p className="text-xs text-gray-400">{wd.property?.location || ''}</p>
                          </td>
                          <td className="px-4 py-4">{formatCurrency(wd.originalInvestment || 0)}</td>
                          <td className="px-4 py-4 text-green-600 font-semibold">
                            {wd.calculatedProfitShare > 0
                              ? `+${formatCurrency(wd.calculatedProfitShare)}`
                              : <span className="text-gray-400">None</span>
                            }
                          </td>
                          <td className="px-4 py-4 font-bold text-blue-700">{formatCurrency(wd.amount || 0)}</td>
                          <td className="px-4 py-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${
                              wd.status === 'approved' ? 'bg-green-100 text-green-800' :
                              wd.status === 'rejected' ? 'bg-red-100 text-red-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              {wd.status}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-gray-500">
                            {wd.createdAt ? new Date(wd.createdAt).toLocaleDateString() : '—'}
                          </td>
                          <td className="px-4 py-4">
                            {wd.status === 'pending' ? (
                              <div className="flex gap-2">
                                <button
                                  onClick={() => setActionModal({ request: wd, action: 'approve' })}
                                  className="px-3 py-1.5 bg-green-100 hover:bg-green-200 text-green-700 text-xs font-semibold rounded-lg transition"
                                >
                                  Approve
                                </button>
                                <button
                                  onClick={() => setActionModal({ request: wd, action: 'reject' })}
                                  className="px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-700 text-xs font-semibold rounded-lg transition"
                                >
                                  Reject
                                </button>
                              </div>
                            ) : (
                              <span className="text-xs text-gray-400 italic">{wd.adminNotes || '—'}</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Action Modal */}
      {actionModal && (
        <WithdrawalActionModal
          request={actionModal.request}
          action={actionModal.action}
          onClose={() => setActionModal(null)}
          onDone={handleActionDone}
        />
      )}
    </div>
  )
}
