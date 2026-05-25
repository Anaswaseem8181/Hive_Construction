const Property = require("../models/property.model");
const Investment = require("../models/investment.model");
const User = require("../models/user.model");
const Notification = require("../models/notification.model");
const cloudinary = require("../utils/cloudinary");
const streamifier = require("streamifier");

const uploadBufferToCloudinary = (buffer) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: "hive-construction/properties" },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    streamifier.createReadStream(buffer).pipe(stream);
  });
};

exports.createProperty = async (req, res) => {
  try {
    const {
      title,
      description,
      location,
      totalInvestmentRequired,
      investedAmount,
      expectedProfit,
      marketValue,
      status,
      soldAt,
    } = req.body;

    if (!title || !location || !totalInvestmentRequired) {
      return res.status(400).json({
        message: "Title, location, and totalInvestmentRequired are required",
      });
    }

    let image;
    if (req.file) {
      const result = await uploadBufferToCloudinary(req.file.buffer);
      image = {
        public_id: result.public_id,
        url: result.secure_url,
      };
    }

    const property = await Property.create({
      title: title.trim(),
      description: description?.trim(),
      location: location.trim(),
      totalInvestmentRequired: Number(totalInvestmentRequired),
      investedAmount: investedAmount ? Number(investedAmount) : 0,
      expectedProfit: expectedProfit ? Number(expectedProfit) : 0,
      marketValue: marketValue ? Number(marketValue) : 0,
      status: status || "available",
      soldAt: soldAt ? new Date(soldAt) : undefined,
      image,
      createdBy: req.user.id,
    });

    res.status(201).json({
      message: "Property created successfully",
      property,
    });
  } catch (error) {
    console.error("Create property error:", error);
    res.status(500).json({ message: "Failed to create property" });
  }
};

exports.getAllProperties = async (req, res) => {
  try {
    const properties = await Property.find()
      .populate("createdBy", "name email role")
      .sort({ createdAt: -1 });

    res.status(200).json(properties);
  } catch (error) {
    console.error("Get properties error:", error);
    res.status(500).json({ message: "Failed to fetch properties" });
  }
};

exports.getPropertyById = async (req, res) => {
  try {
    const property = await Property.findById(req.params.id).populate(
      "createdBy",
      "name email role"
    );

    if (!property) {
      return res.status(404).json({ message: "Property not found" });
    }

    res.status(200).json(property);
  } catch (error) {
    console.error("Get property error:", error);
    res.status(500).json({ message: "Failed to fetch property" });
  }
};

exports.updateProperty = async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);

    if (!property) {
      return res.status(404).json({ message: "Property not found" });
    }

    if (req.file) {
      if (property.image?.public_id) {
        await cloudinary.uploader.destroy(property.image.public_id);
      }
      const result = await uploadBufferToCloudinary(req.file.buffer);
      property.image = {
        public_id: result.public_id,
        url: result.secure_url,
      };
    }

    const updatableFields = [
      "title",
      "description",
      "location",
      "totalInvestmentRequired",
      "investedAmount",
      "expectedProfit",
      "marketValue",
      "status",
      "soldAt",
    ];

    // Track previous status before applying updates
    const previousStatus = property.status;

    updatableFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        property[field] = field === "soldAt" ? new Date(req.body[field]) : req.body[field];
      }
    });

    // Auto-set soldAt if status just changed to 'sold'
    if (previousStatus !== "sold" && property.status === "sold" && !property.soldAt) {
      property.soldAt = new Date();
    }

    await property.save();

    // ALWAYS recalculate profits whenever the property is in 'sold' status.
    // This handles: first-time sold, re-edits with new marketValue, and retroactive fixes.
    if (property.status === "sold") {
      const salePrice     = Number(property.marketValue) || Number(property.totalInvestmentRequired);
      const totalRequired = Number(property.totalInvestmentRequired);
      const grossProfit   = salePrice - totalRequired;

      // 25% to platform, 75% distributed to investors (only when there is profit)
      const investorProfitPool = grossProfit > 0 ? grossProfit * 0.75 : 0;
      const platformShare      = grossProfit > 0 ? grossProfit * 0.25 : 0;

      // Find ALL investments (active or already completed) so retroactive fix works
      const investmentsToUpdate = await Investment.find({
        property: property._id,
        status: { $in: ["active", "completed"] },
      });

      for (const inv of investmentsToUpdate) {
        const ownershipPercent = totalRequired > 0
          ? (inv.amount / totalRequired) * 100
          : 0;

        const profitShare = (ownershipPercent / 100) * investorProfitPool;
        const totalReturn = inv.amount + profitShare;

        inv.ownershipPercent = ownershipPercent;
        inv.profitShare      = profitShare;
        inv.totalReturn      = totalReturn;
        inv.status           = "completed";
        await inv.save();

        await Notification.create({
          user: inv.investor,
          title: "Property Sold & Profit Distributed",
          message: `The property "${property.title}" has been sold. Your total return is PKR ${totalReturn.toLocaleString()} (including PKR ${profitShare.toLocaleString()} profit).`,
          type: "profit_distributed"
        });
      }

      console.log(
        `[updateProperty] Profit distribution for property ${property._id}. ` +
        `Sale price: ${salePrice} | Gross profit: ${grossProfit} | ` +
        `Platform (25%): ${platformShare} | Investor pool (75%): ${investorProfitPool} | ` +
        `${investmentsToUpdate.length} investment(s) updated.`
      );
    }

    res.status(200).json({
      message: "Property updated successfully",
      property,
    });
  } catch (error) {
    console.error("Update property error:", error);
    res.status(500).json({ message: "Failed to update property" });
  }
};

exports.deleteProperty = async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);

    if (!property) {
      return res.status(404).json({ message: "Property not found" });
    }

    if (property.image?.public_id) {
      await cloudinary.uploader.destroy(property.image.public_id);
    }

    await property.deleteOne();

    res.status(200).json({ message: "Property deleted successfully" });
  } catch (error) {
    console.error("Delete property error:", error);
    res.status(500).json({ message: "Failed to delete property" });
  }
};
