import { formatCurrency, formatPercent } from '../../utils/property'
import FundingProgressBar from './FundingProgressBar'

export default function InvestmentCard({ investment, onClick }) {
  const {
    property,
    amount = 0,
    ownershipPercent = 0,
    profitShare = 0,
    status = 'active',
    createdAt
  } = investment

  const propertyTitle = property?.title || property?.name || 'Unknown Property'
  const propertyImage = property?.imageUrl || property?.images?.[0] || ''
  const statusClass = status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
  const statusLabel = status === 'active' ? 'Active' : 'Closed'

  return (
    <div 
      onClick={onClick}
      className="bg-white rounded-lg shadow-md border border-gray-100 overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
    >
      {/* Property Image */}
      <div className="w-full h-32 bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center overflow-hidden">
        {propertyImage ? (
          <img
            src={propertyImage}
            alt={propertyTitle}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.style.display = 'none'
            }}
          />
        ) : (
          <span className="text-gray-500 text-4xl">🏠</span>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Status Badge */}
        <span className={`inline-block px-2 py-1 rounded-full text-xs font-semibold mb-2 ${statusClass}`}>
          {statusLabel}
        </span>

        {/* Property Title */}
        <h5 className="text-lg font-bold text-dark mb-2 line-clamp-1">{propertyTitle}</h5>

        {/* Investment Details */}
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Amount Invested</span>
            <span className="font-semibold text-dark">{formatCurrency(amount)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Ownership</span>
            <span className="font-semibold text-primary">{formatPercent(ownershipPercent)}%</span>
          </div>
          {profitShare > 0 && (
            <div className="flex justify-between">
              <span className="text-gray-500">Profit Share</span>
              <span className="font-semibold text-green-600">{formatCurrency(profitShare)}</span>
            </div>
          )}
        </div>

        {/* Date */}
        {createdAt && (
          <p className="text-xs text-gray-400 mt-3">
            Invested on {new Date(createdAt).toLocaleDateString()}
          </p>
        )}
      </div>
    </div>
  )
}

// Compact version for tables/lists
export function InvestmentRow({ investment, onClick }) {
  const {
    property,
    amount = 0,
    ownershipPercent = 0,
    profitShare = 0,
    status = 'active',
    createdAt
  } = investment

  const propertyTitle = property?.title || property?.name || 'Unknown Property'
  const statusClass = status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
  const statusLabel = status === 'active' ? 'Active' : 'Closed'

  return (
    <tr 
      onClick={onClick}
      className="hover:bg-gray-50 cursor-pointer border-b border-gray-100"
    >
      <td className="px-4 py-3">
        <div className="font-medium text-dark">{propertyTitle}</div>
      </td>
      <td className="px-4 py-3 text-gray-600">{formatCurrency(amount)}</td>
      <td className="px-4 py-3 text-primary font-medium">{formatPercent(ownershipPercent)}%</td>
      <td className="px-4 py-3 text-green-600 font-medium">
        {profitShare > 0 ? formatCurrency(profitShare) : '-'}
      </td>
      <td className="px-4 py-3">
        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${statusClass}`}>
          {statusLabel}
        </span>
      </td>
      <td className="px-4 py-3 text-gray-500 text-sm">
        {createdAt ? new Date(createdAt).toLocaleDateString() : '-'}
      </td>
    </tr>
  )
}