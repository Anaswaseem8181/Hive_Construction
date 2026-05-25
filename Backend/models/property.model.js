// models/Property.js
const mongoose = require("mongoose");

const propertySchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    description: String,
    location: {
      type: String,
      required: true,
    },
    totalInvestmentRequired: {
      type: Number,
      required: true,
    },
    investedAmount: {
      type: Number,
      default: 0,
    },
    expectedProfit: {
      type: Number,
      default: 0,
    },
    marketValue: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ["available", "under_construction", "fully_funded", "sold", "sold_at_loss", "matured", "withdrawn"],
      default: "available",
    },
    hiveLoss: {
      type: Number,
      default: 0,
    },
    image: {
      public_id: String,
      url: String,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    soldAt: Date,
  },
  { timestamps: true }
);

module.exports = mongoose.model("Property", propertySchema);