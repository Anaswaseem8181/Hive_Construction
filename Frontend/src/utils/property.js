const PROPERTY_STATUS_LABELS = {
  available: 'Available',
  fully_funded: 'Fully Funded',
  sold: 'Sold',
}

const PROPERTY_STATUS_ALIASES = {
  available: 'available',
  'almost full': 'fully_funded',
  'fully funded': 'fully_funded',
  fully_funded: 'fully_funded',
  completed: 'sold',
  sold: 'sold',
}

const toNumber = (value) => {
  const numericValue = Number(value)
  return Number.isFinite(numericValue) ? numericValue : 0
}

export const getPropertyStatusValue = (status = 'available') => {
  const normalizedStatus = String(status || '').trim().toLowerCase()
  return PROPERTY_STATUS_ALIASES[normalizedStatus] || normalizedStatus || 'available'
}

export const getPropertyStatusLabel = (status = 'available') =>
  PROPERTY_STATUS_LABELS[getPropertyStatusValue(status)] || status || 'Available'

export const getPropertyStatusColor = (status = 'available') => {
  switch (getPropertyStatusValue(status)) {
    case 'available':
      return 'bg-green-500'
    case 'fully_funded':
      return 'bg-yellow-500'
    case 'sold':
      return 'bg-gray-500'
    default:
      return 'bg-blue-500'
  }
}

export const getPropertyStatusTone = (status = 'available') => {
  switch (getPropertyStatusValue(status)) {
    case 'available':
      return 'bg-green-100 text-green-800'
    case 'fully_funded':
      return 'bg-yellow-100 text-yellow-800'
    case 'sold':
      return 'bg-gray-100 text-gray-800'
    default:
      return 'bg-blue-100 text-blue-800'
  }
}

export const formatCurrency = (value = 0) => `RS. ${toNumber(value).toLocaleString()}`

export const formatPercent = (value = 0) =>
  toNumber(value).toLocaleString(undefined, { maximumFractionDigits: 2 })

export const normalizeProperty = (property = {}) => {
  const totalInvestmentRequired = toNumber(
    property.totalInvestmentRequired ?? property.total_cost
  )
  const investedAmount = toNumber(property.investedAmount)
  const expectedProfit = toNumber(property.expectedProfit ?? property.expectedROI)
  const marketValue = toNumber(property.marketValue)
  const statusValue = getPropertyStatusValue(property.statusValue ?? property.status)
  const title = property.title ?? property.name ?? 'Untitled Property'
  const fundedPercent = totalInvestmentRequired
    ? Number(((investedAmount / totalInvestmentRequired) * 100).toFixed(2))
    : toNumber(property.funded_percent)
  const roiPercent = totalInvestmentRequired
    ? Number(((expectedProfit / totalInvestmentRequired) * 100).toFixed(2))
    : toNumber(property.roi_percent)

  return {
    ...property,
    title,
    name: title,
    totalInvestmentRequired,
    total_cost: totalInvestmentRequired,
    investedAmount,
    expectedProfit,
    marketValue,
    funded_percent: Math.min(100, Math.max(0, fundedPercent)),
    roi_percent: Math.max(0, roiPercent),
    statusValue,
    statusLabel: getPropertyStatusLabel(statusValue),
    imageUrl: property.image?.url || property.imageUrl || `/images/property${property._id}.svg`,
  }
}

export const normalizeProperties = (properties = []) =>
  properties.map((property) => normalizeProperty(property))
