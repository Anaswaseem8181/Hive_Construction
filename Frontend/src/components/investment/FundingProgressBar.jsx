import { formatCurrency, formatPercent } from '../../utils/property'

export default function FundingProgressBar({ 
  investedAmount = 0, 
  totalRequired = 0,
  showLabels = true,
  height = 'h-3'
}) {
  const progress = totalRequired > 0 
    ? Math.min((investedAmount / totalRequired) * 100, 100)
    : 0

  const isFullyFunded = progress >= 100

  return (
    <div className="w-full">
      {showLabels && (
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700">Funding Progress</span>
          <span className={`text-sm font-semibold ${isFullyFunded ? 'text-green-600' : 'text-primary'}`}>
            {formatPercent(progress)}%
          </span>
        </div>
      )}
      
      <div className={`w-full bg-gray-200 rounded-full ${height} overflow-hidden`}>
        <div
          className={`${height} rounded-full transition-all duration-500 ${
            isFullyFunded ? 'bg-green-500' : 'bg-primary'
          }`}
          style={{ width: `${progress}%` }}
          role="progressbar"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>

      {showLabels && (
        <div className="flex justify-between mt-2 text-xs text-gray-500">
          <span>{formatCurrency(investedAmount)} invested</span>
          <span>{formatCurrency(totalRequired)} required</span>
        </div>
      )}
    </div>
  )
}