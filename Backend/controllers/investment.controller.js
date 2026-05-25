// controllers/investment.controller.js
// Investment Controller - handles all investment-related operations
const Investment = require("../models/investment.model");
const Property = require("../models/property.model");
const WithdrawalRequest = require("../models/withdrawalRequest.model");
const User = require("../models/user.model");
const Notification = require("../models/notification.model");

/**
 * ============================================
 * INVESTMENT ENDPOINTS
 * ============================================
 */

/**
 * POST /api/investments/invest
 * Invest in a property
 * 
 * Business Logic:
 * 1. Create investment record
 * 2. Increase property's investedAmount
 * 3. Recalculate ownership percentages for all investors
 * 4. If investedAmount reaches totalInvestmentRequired, mark property as fully_funded
 * 5. Prevent investing beyond funding target
 */
exports.investInProperty = async (req, res) => {
  try {
    const { propertyId, amount } = req.body;
    const investorId = req.user.id; // From auth middleware

    // Validation
    if (!propertyId || !amount) {
      return res.status(400).json({
        success: false,
        message: "propertyId and amount are required",
      });
    }

    if (amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Investment amount must be greater than 0",
      });
    }

    // Get property
    const property = await Property.findById(propertyId);
    if (!property) {
      return res.status(404).json({
        success: false,
        message: "Property not found",
      });
    }

    // Check if property is available for investment
    if (property.status !== "available") {
      return res.status(400).json({
        success: false,
        message: `Property is ${property.status}. Cannot invest.`,
      });
    }

    // Check if user has already invested in this property
    const existingInvestment = await Investment.findOne({
      investor: investorId,
      property: propertyId,
    });

    // Calculate remaining amount that can be invested
    const remainingAmount = property.totalInvestmentRequired - property.investedAmount;

    if (amount > remainingAmount) {
      return res.status(400).json({
        success: false,
        message: `Cannot invest more than remaining funding: PKR ${remainingAmount.toLocaleString()}`,
        remainingAmount,
      });
    }

    // Create or update investment
    let investment;
    if (existingInvestment) {
      // Add to existing investment
      existingInvestment.amount += amount;
      await existingInvestment.save();
      investment = existingInvestment;
    } else {
      // Create new investment
      investment = await Investment.create({
        investor: investorId,
        property: propertyId,
        amount: amount,
      });
    }

    // Update property's investedAmount
    property.investedAmount += amount;

    // Check if property is now fully funded
    if (property.investedAmount >= property.totalInvestmentRequired) {
      property.status = "fully_funded";
    }

    await property.save();

    // Recalculate ownership percentages for ALL investors in this property
    await recalculateOwnershipPercentages(propertyId);

    // Get updated investment with ownership percentage
    const updatedInvestment = await Investment.findById(investment._id)
      .populate("investor", "name email")
      .populate("property", "title location totalInvestmentRequired investedAmount");

    // Create Notification
    await Notification.create({
      user: investorId,
      title: "Investment Successful",
      message: `You have successfully invested PKR ${amount.toLocaleString()} in ${property.title}.`,
      type: "investment_approved"
    });

    res.status(201).json({
      success: true,
      message: "Investment successful",
      data: updatedInvestment,
    });
  } catch (error) {
    console.error("Investment error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during investment",
      error: error.message,
    });
  }
};

/**
 * GET /api/investments/my-investments
 * Get all investments for the logged-in user
 */
exports.getMyInvestments = async (req, res) => {
  try {
    const investorId = req.user.id;

    const investments = await Investment.find({ investor: investorId })
      .populate("property", "title location totalInvestmentRequired investedAmount status marketValue")
      .sort({ createdAt: -1 });

    // Calculate totals
    const totalInvested = investments.reduce((sum, inv) => sum + inv.amount, 0);
    const totalProfit = investments.reduce((sum, inv) => sum + inv.profitShare, 0);

    res.status(200).json({
      success: true,
      count: investments.length,
      totalInvested,
      totalProfit,
      data: investments,
    });
  } catch (error) {
    console.error("Get investments error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

/**
 * GET /api/investments/property/:propertyId
 * Get all investors in a specific property (Admin only)
 */
exports.getPropertyInvestors = async (req, res) => {
  try {
    const { propertyId } = req.params;

    const property = await Property.findById(propertyId);
    if (!property) {
      return res.status(404).json({
        success: false,
        message: "Property not found",
      });
    }

    const investments = await Investment.find({ property: propertyId })
      .populate("investor", "name email phone")
      .sort({ amount: -1 });

    // Calculate total invested
    const totalInvested = investments.reduce((sum, inv) => sum + inv.amount, 0);

    res.status(200).json({
      success: true,
      property: {
        _id: property._id,
        title: property.title,
        totalInvestmentRequired: property.totalInvestmentRequired,
        investedAmount: property.investedAmount,
        status: property.status,
      },
      totalInvested,
      investorCount: investments.length,
      data: investments,
    });
  } catch (error) {
    console.error("Get property investors error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

/**
 * ============================================
 * PROPERTY SALE / PROFIT DISTRIBUTION
 * ============================================
 */

/**
 * POST /api/properties/:id/sell
 * Sell a property and distribute profits to investors
 * 
 * Business Logic:
 * 1. Admin enters sale price
 * 2. Calculate profit = salePrice - totalInvestmentRequired
 * 3. If profit exists:
 *    - 25% goes to platform/company
 *    - 75% goes to investors proportionally
 * 4. If property sold at loss:
 *    - Return only original investment (principal protection)
 * 5. Update property status to sold
 */
exports.sellProperty = async (req, res) => {
  try {
    const { id } = req.params;
    const { salePrice } = req.body;

    // Validation
    if (!salePrice || salePrice <= 0) {
      return res.status(400).json({
        success: false,
        message: "Valid sale price is required",
      });
    }

    // Get property
    const property = await Property.findById(id);
    if (!property) {
      return res.status(404).json({
        success: false,
        message: "Property not found",
      });
    }

    // Check if property can be sold
    if (property.status === "sold") {
      return res.status(400).json({
        success: false,
        message: "Property is already sold",
      });
    }

    const totalInvestmentRequired = property.totalInvestmentRequired;
    const profit = salePrice - totalInvestmentRequired;

    // Get all active investments for this property
    const investments = await Investment.find({
      property: id,
      status: "active",
    });

    if (investments.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No active investors to distribute funds",
      });
    }

    let platformShare = 0;
    let totalInvestorReturns = 0;
    const investorReturns = [];

    if (profit > 0) {
      // PROFIT SCENARIO: 25% platform, 75% to investors
      platformShare = profit * 0.25;
      const totalProfitShare = profit * 0.75;

      // Distribute profit proportionally based on ownership percentage
      for (const investment of investments) {
        // Recalculate ownership to ensure accuracy
        const ownershipPercent = (investment.amount / totalInvestmentRequired) * 100;
        const profitShare = (ownershipPercent / 100) * totalProfitShare;
        const totalReturn = investment.amount + profitShare;

        investment.profitShare = profitShare;
        investment.totalReturn = totalReturn;
        investment.status = "completed";
        await investment.save();

        totalInvestorReturns += totalReturn;
        investorReturns.push({
          investor: investment.investor,
          originalInvestment: investment.amount,
          profitShare,
          totalReturn,
          ownershipPercent,
        });
      }
    } else {
      // LOSS SCENARIO: Return only principal (principal protection)
      for (const investment of investments) {
        investment.profitShare = 0;
        investment.totalReturn = investment.amount; // Return only principal
        investment.status = "completed";
        await investment.save();

        totalInvestorReturns += investment.amount;
        investorReturns.push({
          investor: investment.investor,
          originalInvestment: investment.amount,
          profitShare: 0,
          totalReturn: investment.amount,
          ownershipPercent: (investment.amount / totalInvestmentRequired) * 100,
        });
      }
    }

    // Update property status
    property.status = "sold";
    property.soldAt = new Date();
    property.marketValue = salePrice; // Update market value to sale price
    await property.save();

    res.status(200).json({
      success: true,
      message: "Property sold successfully",
      sale: {
        salePrice,
        totalInvestmentRequired,
        profit: profit > 0 ? profit : 0,
        loss: profit < 0 ? Math.abs(profit) : 0,
      },
      distribution: {
        platformShare,
        totalInvestorReturns,
        investorCount: investments.length,
        investors: investorReturns,
      },
    });
  } catch (error) {
    console.error("Sell property error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during property sale",
      error: error.message,
    });
  }
};

/**
 * ============================================
 * WITHDRAWAL REQUEST ENDPOINTS
 * ============================================
 */

/**
 * POST /api/investments/withdraw
 * Request withdrawal of investment
 */
exports.requestWithdrawal = async (req, res) => {
  try {
    const { investmentId } = req.body;
    const investorId = req.user.id;

    // Validation
    if (!investmentId) {
      return res.status(400).json({
        success: false,
        message: "investmentId is required",
      });
    }

    // Get investment
    const investment = await Investment.findById(investmentId);
    if (!investment) {
      return res.status(404).json({
        success: false,
        message: "Investment not found",
      });
    }

    // Verify ownership
    if (investment.investor.toString() !== investorId) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to request withdrawal for this investment",
      });
    }

    // Check if investment is active
    if (investment.status !== "active") {
      return res.status(400).json({
        success: false,
        message: `Cannot withdraw. Investment status is ${investment.status}`,
      });
    }

    // Check if property is sold (cannot withdraw from sold properties)
    const property = await Property.findById(investment.property);
    if (property.status === "sold") {
      return res.status(400).json({
        success: false,
        message: "Cannot withdraw from sold property. Contact support for your returns.",
      });
    }

    // Check for existing pending withdrawal
    const existingRequest = await WithdrawalRequest.findOne({
      investment: investmentId,
      status: "pending",
    });

    if (existingRequest) {
      return res.status(400).json({
        success: false,
        message: "Withdrawal request already pending for this investment",
      });
    }

    // Calculate investment age
    const oneYearInMs = 365 * 24 * 60 * 60 * 1000;
    const isOlderThanOneYear = (Date.now() - new Date(investment.createdAt).getTime()) >= oneYearInMs;

    let calculatedProfitShare = 0;
    let totalPayout = investment.amount;

    if (isOlderThanOneYear) {
      // Home not sold within one year: investor gets original investment + profit share as per market value
      const grossProfit = Number(property.marketValue || 0) - Number(property.totalInvestmentRequired || 0);
      
      if (grossProfit > 0) {
        const investorProfitPool = grossProfit * 0.75;
        const ownershipPercent = investment.ownershipPercent || 0;
        calculatedProfitShare = (ownershipPercent / 100) * investorProfitPool;
        totalPayout = investment.amount + calculatedProfitShare;
      }
      // If grossProfit <= 0 (loss scenario), totalPayout remains investment.amount (Capital Protection)
    }

    // Create withdrawal request
    const withdrawalRequest = await WithdrawalRequest.create({
      investor: investorId,
      investment: investmentId,
      property: investment.property,
      amount: totalPayout, // acts as the total return
      originalInvestment: investment.amount,
      calculatedProfitShare: calculatedProfitShare,
    });

    res.status(201).json({
      success: true,
      message: "Withdrawal request submitted successfully",
      data: withdrawalRequest,
    });
  } catch (error) {
    console.error("Withdrawal request error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

/**
 * GET /api/investments/withdrawals
 * Get all withdrawal requests (Admin only)
 */
exports.getAllWithdrawalRequests = async (req, res) => {
  try {
    const { status } = req.query;

    const query = {};
    if (status) {
      query.status = status;
    }

    const requests = await WithdrawalRequest.find(query)
      .populate("investor", "name email phone")
      .populate("investment", "amount ownershipPercent")
      .populate("property", "title location")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: requests.length,
      data: requests,
    });
  } catch (error) {
    console.error("Get withdrawals error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

/**
 * GET /api/investments/my-withdrawals
 * Get my withdrawal requests
 */
exports.getMyWithdrawalRequests = async (req, res) => {
  try {
    const investorId = req.user.id;

    const requests = await WithdrawalRequest.find({ investor: investorId })
      .populate("investment", "amount ownershipPercent status")
      .populate("property", "title location")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: requests.length,
      data: requests,
    });
  } catch (error) {
    console.error("Get my withdrawals error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

/**
 * PUT /api/investments/withdrawals/:id/approve
 * Approve withdrawal request (Admin only)
 */
exports.approveWithdrawal = async (req, res) => {
  try {
    const { id } = req.params;
    const { adminNotes } = req.body;
    const adminId = req.user.id;

    const request = await WithdrawalRequest.findById(id);
    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Withdrawal request not found",
      });
    }

    if (request.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: `Request is already ${request.status}`,
      });
    }

    // Get investment and mark as withdrawn
    const investment = await Investment.findById(request.investment);
    if (investment) {
      investment.status = "withdrawn";
      investment.profitShare = request.calculatedProfitShare || 0;
      investment.totalReturn = request.amount || investment.amount;
      await investment.save();

      // Recalculate ownership percentages for remaining investors
      await recalculateOwnershipPercentages(request.property);
    }

    // Update request status
    request.status = "approved";
    request.adminNotes = adminNotes || "Approved";
    request.processedAt = new Date();
    request.processedBy = adminId;
    await request.save();

    await Notification.create({
      user: request.investor,
      title: "Withdrawal Approved",
      message: `Your withdrawal request for PKR ${request.amount ? request.amount.toLocaleString() : 'the investment'} has been approved.`,
      type: "withdrawal_processed"
    });

    res.status(200).json({
      success: true,
      message: "Withdrawal approved",
      data: request,
    });
  } catch (error) {
    console.error("Approve withdrawal error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

/**
 * PUT /api/investments/withdrawals/:id/reject
 * Reject withdrawal request (Admin only)
 */
exports.rejectWithdrawal = async (req, res) => {
  try {
    const { id } = req.params;
    const { adminNotes } = req.body;
    const adminId = req.user.id;

    const request = await WithdrawalRequest.findById(id);
    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Withdrawal request not found",
      });
    }

    if (request.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: `Request is already ${request.status}`,
      });
    }

    // Update request status
    request.status = "rejected";
    request.adminNotes = adminNotes || "Rejected";
    request.processedAt = new Date();
    request.processedBy = adminId;
    await request.save();

    await Notification.create({
      user: request.investor,
      title: "Withdrawal Rejected",
      message: `Your withdrawal request has been rejected. Reason: ${adminNotes || "Rejected"}`,
      type: "withdrawal_processed"
    });

    res.status(200).json({
      success: true,
      message: "Withdrawal rejected",
      data: request,
    });
  } catch (error) {
    console.error("Reject withdrawal error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

/**
 * ============================================
 * HELPER FUNCTIONS
 * ============================================
 */

/**
 * Recalculate ownership percentages for all investors in a property
 * This ensures percentages always add up to 100%
 */
async function recalculateOwnershipPercentages(propertyId) {
  const property = await Property.findById(propertyId);
  if (!property) return;

  const investments = await Investment.find({
    property: propertyId,
    status: "active",
  });

  for (const investment of investments) {
    investment.ownershipPercent = (investment.amount / property.totalInvestmentRequired) * 100;
    await investment.save();
  }
}

/**
 * PUT /api/investments/:id/cheque
 * Update security cheque details for an investment (Admin only)
 */
exports.updateSecurityCheque = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      securityChequeNumber,
      securityChequeBank,
      securityChequeValue,
      securityChequeStatus,
      securityChequeIssuedDate,
    } = req.body;

    const investment = await Investment.findById(id);
    if (!investment) {
      return res.status(404).json({
        success: false,
        message: "Investment not found",
      });
    }

    // Update cheque fields if provided
    if (securityChequeNumber !== undefined) investment.securityChequeNumber = securityChequeNumber;
    if (securityChequeBank    !== undefined) investment.securityChequeBank    = securityChequeBank;
    if (securityChequeValue   !== undefined) investment.securityChequeValue   = securityChequeValue || 0;
    if (securityChequeStatus  !== undefined) investment.securityChequeStatus  = securityChequeStatus;
    if (securityChequeIssuedDate !== undefined) {
      if (!securityChequeIssuedDate || isNaN(Date.parse(securityChequeIssuedDate))) {
        investment.securityChequeIssuedDate = null;
      } else {
        investment.securityChequeIssuedDate = new Date(securityChequeIssuedDate);
      }
    }

    await investment.save();

    res.status(200).json({
      success: true,
      message: "Security cheque updated successfully",
      data: investment,
    });
  } catch (error) {
    console.error("Update security cheque error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

module.exports = exports;