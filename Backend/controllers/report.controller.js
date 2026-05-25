const Property = require("../models/property.model");
const Investment = require("../models/investment.model");
const User = require("../models/user.model");
const WithdrawalRequest = require("../models/withdrawalRequest.model");

const getAdminReports = async (req, res) => {
  try {
    const { from, to } = req.query;

    // Base query for time filters
    const dateQuery = {};
    if (from && to) {
      dateQuery.createdAt = {
        $gte: new Date(from),
        $lte: new Date(to),
      };
    } else if (from) {
      dateQuery.createdAt = { $gte: new Date(from) };
    } else if (to) {
      dateQuery.createdAt = { $lte: new Date(to) };
    }

    // 1. Investor Activities
    const totalInvestors = await User.countDocuments({ role: "investor", ...dateQuery });
    const activeInvestments = await Investment.countDocuments({ status: "active", ...dateQuery });
    const withdrawnInvestments = await Investment.countDocuments({ status: "withdrawn", ...dateQuery });

    // 2. Property Status
    const properties = await Property.find(dateQuery);
    const propertyStatusCount = properties.reduce((acc, p) => {
      acc[p.status] = (acc[p.status] || 0) + 1;
      return acc;
    }, {});
    
    const totalMarketValue = properties.reduce((sum, p) => sum + (p.marketValue || 0), 0);
    const totalRequiredInvestment = properties.reduce((sum, p) => sum + (p.totalInvestmentRequired || 0), 0);

    // 3. Loss Handling logic
    const soldAtLossProperties = properties.filter(p => p.status === "sold_at_loss");
    const totalHiveLoss = soldAtLossProperties.reduce((sum, p) => sum + (p.hiveLoss || 0), 0);
    
    // Find investments in properties sold at loss to calculate protected capital
    const lossPropertyIds = soldAtLossProperties.map(p => p._id);
    const protectedInvestments = await Investment.find({ property: { $in: lossPropertyIds } });
    const investorProtectedCapital = protectedInvestments.reduce((sum, inv) => sum + inv.amount, 0);

    // 4. Exit Plan Reporting
    // For early withdrawals, check WithdrawalRequests where property wasn't sold
    const withdrawalRequests = await WithdrawalRequest.find(dateQuery).populate("property");
    
    const earlyWithdrawals = withdrawalRequests.filter(wr => wr.property && wr.property.status !== "sold" && wr.property.status !== "sold_at_loss").length;
    const pendingExits = await WithdrawalRequest.countDocuments({ status: "pending", ...dateQuery });

    // Matured investments (older than 1 year, not withdrawn)
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    const maturedInvestments = await Investment.countDocuments({
      status: "active",
      createdAt: { $lte: oneYearAgo },
      ...dateQuery
    });

    const investmentsAll = await Investment.find(dateQuery);
    const chequeStatusCount = investmentsAll.reduce((acc, inv) => {
      if(inv.securityChequeStatus) {
        acc[inv.securityChequeStatus] = (acc[inv.securityChequeStatus] || 0) + 1;
      }
      return acc;
    }, {});

    // 5. Profit/Loss Details
    const soldProperties = properties.filter(p => p.status === "sold");
    const totalProfit = soldProperties.reduce((sum, p) => sum + ((p.marketValue || 0) - (p.investedAmount || 0)), 0);
    const hiveProfit = totalProfit > 0 ? totalProfit * 0.25 : 0;
    const investorsProfit = totalProfit > 0 ? totalProfit * 0.75 : 0;

    // 6. Detailed Investor Activities (Table Data)
    const detailedInvestments = await Investment.find(dateQuery)
      .populate("investor", "name email")
      .populate("property", "title location status expectedProfit");

    res.status(200).json({
      investorActivities: {
        totalInvestors,
        activeInvestments,
        withdrawnInvestments
      },
      propertyStatus: {
        counts: propertyStatusCount,
        totalMarketValue,
        totalRequiredInvestment
      },
      lossReports: {
        propertiesSoldAtLoss: soldAtLossProperties.length,
        totalHiveLoss,
        investorProtectedCapital
      },
      exitPlanReports: {
        earlyWithdrawals,
        maturedInvestments,
        pendingExits,
        securedChequeRecords: chequeStatusCount
      },
      profitDetails: {
        totalProfit,
        hiveProfit,
        investorsProfit
      },
      detailedActivities: detailedInvestments
    });
  } catch (error) {
    console.error("Error in getAdminReports:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

module.exports = {
  getAdminReports
};
