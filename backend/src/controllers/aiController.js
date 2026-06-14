const asyncHandler = require("express-async-handler");
const Product = require("../models/Product");
const { generateComplaintContent, chatComplaintAssistant } = require("../services/openaiService");

const maskContact = (email, phone) => {
  const maskedEmail = email ? `${email.slice(0, 2)}***@${email.split("@")[1] || "***"}` : "hidden";
  const maskedPhone = phone ? `${phone.slice(0, 2)}******${phone.slice(-2)}` : "hidden";
  return { maskedEmail, maskedPhone };
};

const generateComplaint = asyncHandler(async (req, res) => {
  const product = await Product.findOne({ _id: req.params.id, user: req.user._id });
  if (!product) {
    res.status(404);
    throw new Error("Product not found");
  }

  const { issueDescription } = req.body;
  const content = await generateComplaintContent({
    productName: product.productName,
    vendor: product.vendor,
    purchaseDate: new Date(product.purchaseDate).toISOString().slice(0, 10),
    issueDescription: issueDescription || "Product has stopped working and support has not resolved it.",
    customerName: req.user?.name || "Customer"
  });

  res.json(content);
});

const lostItemCard = asyncHandler(async (req, res) => {
  const product = await Product.findOne({ _id: req.params.id, user: req.user._id }).populate("user", "name email phone");
  if (!product) {
    res.status(404);
    throw new Error("Product not found");
  }

  const contact = maskContact(product.user?.email, product.user?.phone);
  res.json({
    productName: product.productName,
    category: product.category,
    lastKnownLocation: product.lostItemMode?.lastKnownLocation || "Not provided",
    rewardAmount: product.lostItemMode?.rewardAmount || 0,
    contact,
    shareText: `Lost item alert: ${product.productName}. If found, contact ${contact.maskedEmail} / ${contact.maskedPhone}.`
  });
});

const complaintChat = asyncHandler(async (req, res) => {
  const product = await Product.findOne({ _id: req.params.id, user: req.user._id });
  if (!product) {
    res.status(404);
    throw new Error("Product not found");
  }

  const { message, history } = req.body;
  if (!message || !String(message).trim()) {
    res.status(400);
    throw new Error("Message is required");
  }

  const result = await chatComplaintAssistant({
    productName: product.productName,
    vendor: product.vendor,
    purchaseDate: new Date(product.purchaseDate).toISOString().slice(0, 10),
    userMessage: String(message),
    history: Array.isArray(history) ? history : [],
    customerName: req.user?.name || "Customer"
  });

  res.json(result);
});

module.exports = { generateComplaint, lostItemCard, complaintChat };
