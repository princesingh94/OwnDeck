const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    productName: { type: String, required: true, trim: true },
    purchaseDate: { type: Date, required: true },
    price: { type: Number, default: 0 },
    warrantyMonths: { type: Number, default: 0 },
    warrantyExpiryDate: { type: Date, required: true },
    vendor: { type: String, default: "" },
    category: { type: String, default: "" },
    fileUrl: { type: String, default: "" },
    filePublicId: { type: String, default: "" },
    rawExtractedText: { type: String, default: "" },
    aiStructuredData: { type: Object, default: {} },
    notes: { type: String, default: "" },
    lostItemMode: {
      isLost: { type: Boolean, default: false },
      lastKnownLocation: { type: String, default: "" },
      rewardAmount: { type: Number, default: 0 }
    },
    alerts: {
      preExpiry30Sent: { type: Boolean, default: false }
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Product", productSchema);
