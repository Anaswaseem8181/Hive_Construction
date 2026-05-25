import axiosInstance from '../axios'
import toast from 'react-hot-toast'

/**
 * Investment API Layer
 * Handles all investment-related API calls with proper error handling
 */

// Helper function for error handling
const handleError = (error, defaultMessage = 'An error occurred') => {
  const message = error?.response?.data?.message || error?.message || defaultMessage
  toast.error(message)
  return Promise.reject(error)
}

/**
 * Invest in a property
 * @param {Object} data - Investment data
 * @param {string} data.propertyId - The property ID
 * @param {number} data.amount - Investment amount
 * @returns {Promise<Object>} Investment response
 */
export const investInProperty = async (data) => {
  try {
    const response = await axiosInstance.post('api/investments/invest', data)
    if (response?.data?.message) {
      toast.success(response.data.message)
    }
    return response.data
  } catch (error) {
    return handleError(error, 'Failed to process investment')
  }
}

/**
 * Get current user's investments
 * @returns {Promise<Array>} List of user's investments
 */
export const getMyInvestments = async () => {
  try {
    const response = await axiosInstance.get('api/investments/my-investments')
    console.log("getinvestments", response.data);
    return response.data
  } catch (error) {
    return handleError(error, 'Failed to load investments')
  }
}

/**
 * Get all investors for a specific property (Admin only)
 * @param {string} propertyId - The property ID
 * @returns {Promise<Array>} List of investors for the property
 */
export const getPropertyInvestors = async (propertyId) => {
  try {
    const response = await axiosInstance.get(`api/investments/property/${propertyId}`)
    return response.data
  } catch (error) {
    return handleError(error, 'Failed to load property investors')
  }
}

/**
 * Calculate ownership percentage
 * @param {number} amount - Investment amount
 * @param {number} totalInvestmentRequired - Total investment required for property
 * @returns {number} Ownership percentage
 */
export const calculateOwnershipPercent = (amount, totalInvestmentRequired) => {
  if (!totalInvestmentRequired || totalInvestmentRequired <= 0) return 0
  return Number(((amount / totalInvestmentRequired) * 100).toFixed(2))
}

/**
 * Calculate remaining funding
 * @param {number} investedAmount - Amount already invested
 * @param {number} totalInvestmentRequired - Total investment required
 * @returns {number} Remaining funding amount
 */
export const calculateRemainingFunding = (investedAmount, totalInvestmentRequired) => {
  const remaining = totalInvestmentRequired - investedAmount
  return remaining > 0 ? remaining : 0
}

/**
 * Calculate funding progress percentage
 * @param {number} investedAmount - Amount already invested
 * @param {number} totalInvestmentRequired - Total investment required
 * @returns {number} Progress percentage (0-100)
 */
export const calculateFundingProgress = (investedAmount, totalInvestmentRequired) => {
  if (!totalInvestmentRequired || totalInvestmentRequired <= 0) return 0
  const progress = (investedAmount / totalInvestmentRequired) * 100
  return Math.min(progress, 100)
}

/**
 * Request withdrawal for an investment
 * @param {string} investmentId - The investment ID
 * @returns {Promise<Object>} Withdrawal request response
 */
export const requestWithdrawal = async (investmentId) => {
  try {
    const response = await axiosInstance.post('api/investments/withdraw', { investmentId })
    return response.data
  } catch (error) {
    return handleError(error, 'Failed to submit withdrawal request')
  }
}

/**
 * Get current investor's withdrawal requests
 * @returns {Promise<Array>} List of withdrawal requests
 */
export const getMyWithdrawals = async () => {
  try {
    const response = await axiosInstance.get('api/investments/my-withdrawals')
    return response.data
  } catch (error) {
    return handleError(error, 'Failed to load withdrawal requests')
  }
}

/**
 * Get all withdrawal requests (Admin only)
 * @param {string} [status] - Optional filter: 'pending' | 'approved' | 'rejected'
 * @returns {Promise<Array>} List of all withdrawal requests
 */
export const getAllWithdrawals = async (status = '') => {
  try {
    const url = status
      ? `api/investments/withdrawals?status=${status}`
      : 'api/investments/withdrawals'
    const response = await axiosInstance.get(url)
    return response.data
  } catch (error) {
    return handleError(error, 'Failed to load withdrawal requests')
  }
}

/**
 * Approve a withdrawal request (Admin only)
 * @param {string} id - Withdrawal request ID
 * @param {string} [adminNotes] - Optional admin notes
 */
export const approveWithdrawalRequest = async (id, adminNotes = 'Approved') => {
  try {
    const response = await axiosInstance.put(`api/investments/withdrawals/${id}/approve`, { adminNotes })
    if (response?.data?.message) toast.success(response.data.message)
    return response.data
  } catch (error) {
    return handleError(error, 'Failed to approve withdrawal')
  }
}

/**
 * Reject a withdrawal request (Admin only)
 * @param {string} id - Withdrawal request ID
 * @param {string} [adminNotes] - Optional admin notes
 */
export const rejectWithdrawalRequest = async (id, adminNotes = 'Rejected') => {
  try {
    const response = await axiosInstance.put(`api/investments/withdrawals/${id}/reject`, { adminNotes })
    if (response?.data?.message) toast.success(response.data.message)
    return response.data
  } catch (error) {
    return handleError(error, 'Failed to reject withdrawal')
  }
}

/**
 * Update security cheque details for an investment (Admin only)
 * @param {string} investmentId - The investment ID
 * @param {Object} chequeData - Cheque fields to update
 */
export const updateSecurityCheque = async (investmentId, chequeData) => {
  try {
    const response = await axiosInstance.put(`api/investments/${investmentId}/cheque`, chequeData)
    if (response?.data?.message) toast.success(response.data.message)
    return response.data
  } catch (error) {
    return handleError(error, 'Failed to update security cheque')
  }
}