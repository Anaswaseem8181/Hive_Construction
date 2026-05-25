import { useState } from 'react'
import { formatCurrency, formatPercent } from '../../utils/property'
import { updateSecurityCheque } from '../../APIs/investment/investment'
import toast from 'react-hot-toast'

// Cheque status badge colours
const CHEQUE_STATUS_STYLES = {
  Pending:   'bg-yellow-100 text-yellow-800',
  Issued:    'bg-green-100  text-green-800',
  Returned:  'bg-blue-100   text-blue-800',
  Cancelled: 'bg-red-100    text-red-800',
}

function ChequeModal({ investment, onClose, onSaved }) {
  const [form, setForm] = useState({
    securityChequeNumber:     investment.securityChequeNumber     || '',
    securityChequeBank:       investment.securityChequeBank       || '',
    securityChequeValue:      investment.securityChequeValue      || investment.amount || '',
    securityChequeStatus:     investment.securityChequeStatus     || 'Pending',
    securityChequeIssuedDate: investment.securityChequeIssuedDate
      ? new Date(investment.securityChequeIssuedDate).toISOString().split('T')[0]
      : '',
  })
  const [saving, setSaving] = useState(false)

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))

  const handleSave = async () => {
    setSaving(true)
    try {
      await updateSecurityCheque(investment._id, form)
      onSaved({ ...investment, ...form })
      onClose()
    } catch (_) {
      // toast already shown by API helper
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-700 to-blue-500 rounded-t-2xl px-6 py-4 flex items-center justify-between">
          <div>
            <h3 className="text-white font-bold text-lg">Security Cheque</h3>
            <p className="text-blue-100 text-xs mt-0.5">
              {investment.investor?.name} — {formatCurrency(investment.amount)} investment
            </p>
          </div>
          <button onClick={onClose} className="text-white hover:text-blue-200 transition text-2xl leading-none">&times;</button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-gray-500 mb-1">Cheque Number</label>
              <input
                name="securityChequeNumber"
                value={form.securityChequeNumber}
                onChange={handleChange}
                placeholder="e.g. CHQ-001234"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Bank Name</label>
              <input
                name="securityChequeBank"
                value={form.securityChequeBank}
                onChange={handleChange}
                placeholder="e.g. HBL"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Cheque Value (PKR)</label>
              <input
                type="number"
                name="securityChequeValue"
                value={form.securityChequeValue}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Issued Date</label>
              <input
                type="date"
                name="securityChequeIssuedDate"
                value={form.securityChequeIssuedDate}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Status</label>
              <select
                name="securityChequeStatus"
                value={form.securityChequeStatus}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                {['Pending', 'Issued', 'Returned', 'Cancelled'].map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-700">
            🔒 This cheque secures the investor's principal of <strong>{formatCurrency(investment.amount)}</strong>. In case of loss, Hive bears the cost and the cheque guarantees full repayment.
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-lg border border-gray-300 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition disabled:opacity-60"
          >
            {saving ? 'Saving…' : 'Save Cheque'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function InvestorTable({ investors: initialInvestors = [], isLoading = false }) {
  const [investors, setInvestors] = useState(initialInvestors)
  const [chequeTarget, setChequeTarget] = useState(null) // investment object being edited

  // Keep local state in sync if parent re-renders with new props
  if (initialInvestors !== investors && initialInvestors.length !== investors.length) {
    setInvestors(initialInvestors)
  }

  const handleChequeSaved = (updated) => {
    setInvestors((prev) => prev.map((inv) => inv._id === updated._id ? { ...inv, ...updated } : inv))
    toast.success('Security cheque updated')
  }

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-8 text-center">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mx-auto mb-4"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!investors.length) {
    return (
      <div className="bg-white rounded-lg shadow-md p-8 text-center">
        <div className="text-gray-500">
          <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <p className="text-lg font-medium">No investors yet</p>
          <p className="text-sm mt-1">This property hasn't received any investments yet.</p>
        </div>
      </div>
    )
  }

  return (
    <>
      {chequeTarget && (
        <ChequeModal
          investment={chequeTarget}
          onClose={() => setChequeTarget(null)}
          onSaved={handleChequeSaved}
        />
      )}

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-100 border-b-2 border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-dark">Investor</th>
                <th className="px-4 py-3 text-left font-semibold text-dark">Email</th>
                <th className="px-4 py-3 text-left font-semibold text-dark">Amount Invested</th>
                <th className="px-4 py-3 text-left font-semibold text-dark">Ownership %</th>
                <th className="px-4 py-3 text-left font-semibold text-dark">Security Cheque</th>
                <th className="px-4 py-3 text-left font-semibold text-dark">Date</th>
              </tr>
            </thead>
            <tbody>
              {investors.map((investor, index) => {
                const name = investor.investor?.name || 'Unknown Investor'
                const email = investor.investor?.email || 'N/A'
                const amount = investor.amount || 0
                const ownershipPercent = investor.ownershipPercent || investor.ownership_percent || 0
                const date = investor.createdAt || investor.date
                const chequeStatus = investor.securityChequeStatus || 'Pending'

                return (
                  <tr
                    key={investor._id || index}
                    className="hover:bg-gray-50 border-b border-gray-100"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white font-semibold">
                          {name.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-medium text-dark">{name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{email}</td>
                    <td className="px-4 py-3 font-medium text-dark">{formatCurrency(amount)}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 bg-primary/10 text-primary rounded font-medium">
                        {formatPercent(ownershipPercent)}%
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setChequeTarget(investor)}
                        className="flex items-center gap-2 group"
                        title="Manage security cheque"
                      >
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${CHEQUE_STATUS_STYLES[chequeStatus] || CHEQUE_STATUS_STYLES.Pending}`}>
                          {chequeStatus}
                        </span>
                        <span className="text-blue-500 text-xs group-hover:underline">
                          {chequeStatus === 'Pending' ? 'Issue' : 'Edit'}
                        </span>
                      </button>
                      {investor.securityChequeNumber && (
                        <p className="text-xs text-gray-400 mt-0.5">{investor.securityChequeNumber}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {date ? new Date(date).toLocaleDateString() : '-'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}