// models/Investment.js
// Investment model - tracks individual investments in properties
const mongoose = require("mongoose");

const investmentSchema = new mongoose.Schema(
  {
    investor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
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
      min: 1, // Minimum investment amount
    },
    ownershipPercent: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    status: {
      type: String,
      enum: ["active", "withdrawn", "completed"],
      default: "active",
    },
    // Track profit distribution when property is sold
    profitShare: {
      type: Number,
      default: 0,
    },
    totalReturn: {
      type: Number,
      default: 0, // amount + profitShare
    },
    // Security Cheque details
    securityChequeNumber: {
      type: String,
      default: "",
    },
    securityChequeBank: {
      type: String,
      default: "",
    },
    securityChequeValue: {
      type: Number,
      default: 0,
    },
    securityChequeStatus: {
      type: String,
      enum: ["Pending", "Issued", "Returned", "Cancelled"],
      default: "Pending",
    },
    securityChequeIssuedDate: {
      type: Date,
    },
  },
  { timestamps: true }
);

// Index for faster queries
investmentSchema.index({ investor: 1, property: 1 });
investmentSchema.index({ property: 1 });

module.exports = mongoose.model("Investment", investmentSchema);