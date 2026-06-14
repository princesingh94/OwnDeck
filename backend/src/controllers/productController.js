const asyncHandler = require("express-async-handler");
const Product = require("../models/Product");
const { uploadToStorage } = require("../config/storage");
const { extractTextFromFile } = require("../services/ocrService");
const { parseInvoiceTextToJson } = require("../services/openaiService");

const computeExpiry = (purchaseDate, months) => {
  const d = new Date(purchaseDate);
  d.setMonth(d.getMonth() + Number(months || 0));
  return d;
};

const getWarrantyStatus = (expiryDate) => {
  const now = new Date();
  const diff = Math.ceil((new Date(expiryDate) - now) / (1000 * 60 * 60 * 24));
  if (diff < 0) return "Expired";
  if (diff <= 30) return "Expiring";
  return "Active";
};

const uploadProductDoc = asyncHandler(async (req, res) => {
  if (!req.file) {
    res.status(400);
    throw new Error("File is required");
  }

  const extractedText = await extractTextFromFile(req.file.path, req.file.mimetype).catch(() => "");
  const { fileUrl, filePublicId } = await uploadToStorage(req.file.path);
  const structured = await parseInvoiceTextToJson(extractedText);

  const purchaseDate = structured.purchaseDate || new Date().toISOString().slice(0, 10);
  const warrantyMonths = Number(structured.warrantyMonths || 12);

  const product = await Product.create({
    user: req.user._id,
    productName: structured.productName || "Unknown Product",
    purchaseDate,
    price: Number(structured.price || 0),
    warrantyMonths,
    warrantyExpiryDate: computeExpiry(purchaseDate, warrantyMonths),
    vendor: structured.vendor || "",
    category: structured.category || "",
    fileUrl,
    filePublicId,
    rawExtractedText: extractedText,
    aiStructuredData: structured
  });

  res.status(201).json({ ...product.toObject(), warrantyStatus: getWarrantyStatus(product.warrantyExpiryDate) });
});

const listProducts = asyncHandler(async (req, res) => {
  const products = await Product.find({ user: req.user._id }).sort({ createdAt: -1 });
  res.json(products.map((p) => ({ ...p.toObject(), warrantyStatus: getWarrantyStatus(p.warrantyExpiryDate) })));
});

const getProduct = asyncHandler(async (req, res) => {
  const product = await Product.findOne({ _id: req.params.id, user: req.user._id });
  if (!product) {
    res.status(404);
    throw new Error("Product not found");
  }
  res.json({ ...product.toObject(), warrantyStatus: getWarrantyStatus(product.warrantyExpiryDate) });
});

const updateLostMode = asyncHandler(async (req, res) => {
  const product = await Product.findOne({ _id: req.params.id, user: req.user._id });
  if (!product) {
    res.status(404);
    throw new Error("Product not found");
  }

  const { isLost, lastKnownLocation, rewardAmount } = req.body;
  product.lostItemMode = {
    isLost: Boolean(isLost),
    lastKnownLocation: lastKnownLocation || "",
    rewardAmount: Number(rewardAmount || 0)
  };

  await product.save();
  res.json(product);
});

module.exports = { uploadProductDoc, listProducts, getProduct, updateLostMode };
