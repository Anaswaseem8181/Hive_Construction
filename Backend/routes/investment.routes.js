// routes/investment.routes.js
// Investment routes - all investment-related endpoints
const express = require("express");
const { verifyToken, authorizeRoles } = require("../middlewares/auth.middleware");
const {
  investInProperty,
  getMyInvestments,
  getPropertyInvestors,
  sellProperty,
  requestWithdrawal,
  getAllWithdrawalRequests,
  getMyWithdrawalRequests,
  approveWithdrawal,
  rejectWithdrawal,
  updateSecurityCheque,
} = require("../controllers/investment.controller");

const router = express.Router();

/**
 * INVESTMENT ROUTES
 */

// POST /api/investments/invest - Invest in a property (logged in users)
router.post("/invest", verifyToken, investInProperty);

// GET /api/investments/my-investments - Get logged in user's investments
router.get("/my-investments", verifyToken, getMyInvestments);

// GET /api/investments/property/:propertyId - Get all investors in a property (Admin only)
router.get(
  "/property/:propertyId",
  verifyToken,
  authorizeRoles("admin"),
  getPropertyInvestors
);

/**
 * ============================================
 * PROPERTY SALE ROUTES
 * ============================================
 */

// POST /api/investments/sell/:id - Sell property and distribute profits (Admin only)
router.post(
  "/sell/:id",
  verifyToken,
  authorizeRoles("admin"),
  sellProperty
);

/**
 * ============================================
 * WITHDRAWAL REQUEST ROUTES
 * ============================================
 */

// POST /api/investments/withdraw - Request withdrawal (logged in users)
router.post("/withdraw", verifyToken, requestWithdrawal);

// GET /api/investments/withdrawals - Get all withdrawal requests (Admin only)
router.get(
  "/withdrawals",
  verifyToken,
  authorizeRoles("admin"),
  getAllWithdrawalRequests
);

// GET /api/investments/my-withdrawals - Get my withdrawal requests
router.get("/my-withdrawals", verifyToken, getMyWithdrawalRequests);

// PUT /api/investments/withdrawals/:id/approve - Approve withdrawal (Admin only)
router.put(
  "/withdrawals/:id/approve",
  verifyToken,
  authorizeRoles("admin"),
  approveWithdrawal
);

// PUT /api/investments/withdrawals/:id/reject - Reject withdrawal (Admin only)
router.put(
  "/withdrawals/:id/reject",
  verifyToken,
  authorizeRoles("admin"),
  rejectWithdrawal
);

/**
 * ============================================
 * SECURITY CHEQUE ROUTES
 * ============================================
 */

// PUT /api/investments/:id/cheque - Update security cheque for an investment (Admin only)
router.put(
  "/:id/cheque",
  verifyToken,
  authorizeRoles("admin"),
  updateSecurityCheque
);

module.exports = router;