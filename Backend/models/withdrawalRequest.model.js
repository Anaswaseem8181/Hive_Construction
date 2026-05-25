// models/WithdrawalRequest.js
// WithdrawalRequest model - allows investors to request withdrawal of their investment
const mongoose = require("mongoose");

const withdrawalRequestSchema = new mongoose.Schema(
  {
    investor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    investment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Investment",
      required: true,
    },
    property: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Property",
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    originalInvestment: {
      type: Number,
      required: true,
    },
    calculatedProfitShare: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    // Admin notes for approval/rejection
    adminNotes: {
      type: String,
      default: "",
    },
    // When the request was processed
    processedAt: {
      type: Date,
    },
    processedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

// Index for faster queries
withdrawalRequestSchema.index({ investor: 1, status: 1 });
withdrawalRequestSchema.index({ property: 1 });

module.exports = mongoose.model("WithdrawalRequest", withdrawalRequestSchema);