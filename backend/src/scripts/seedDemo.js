const path = require("path");
const dotenv = require("dotenv");
const bcrypt = require("bcryptjs");

dotenv.config({ path: path.join(__dirname, "..", "..", ".env") });

const connectDb = require("../config/db");
const User = require("../models/User");
const Product = require("../models/Product");

const run = async () => {
  await connectDb();

  const email = "demo@owndeck.local";
  const plainPassword = "Demo@123";

  let user = await User.findOne({ email });
  if (!user) {
    const hashed = await bcrypt.hash(plainPassword, 12);
    user = await User.create({
      name: "Demo User",
      email,
      password: hashed,
      phone: "9999999999"
    });
    console.log("Created demo user");
  } else {
    console.log("Demo user already exists");
  }

  const existing = await Product.findOne({ user: user._id, productName: "Demo Laptop Pro 14" });
  if (!existing) {
    const purchaseDate = new Date("2025-06-15");
    const expiry = new Date(purchaseDate);
    expiry.setMonth(expiry.getMonth() + 24);

    await Product.create({
      user: user._id,
      productName: "Demo Laptop Pro 14",
      purchaseDate,
      price: 84999,
      warrantyMonths: 24,
      warrantyExpiryDate: expiry,
      vendor: "DemoTech",
      category: "Electronics",
      rawExtractedText: "Seeded sample product",
      aiStructuredData: {
        productName: "Demo Laptop Pro 14",
        purchaseDate: "2025-06-15",
        price: 84999,
        warrantyMonths: 24,
        vendor: "DemoTech",
        category: "Electronics"
      }
    });
    console.log("Created demo product");
  } else {
    console.log("Demo product already exists");
  }

  console.log("Demo credentials:");
  console.log("Email:", email);
  console.log("Password:", plainPassword);
  process.exit(0);
};

run().catch((err) => {
  console.error("Seed failed:", err.message);
  process.exit(1);
});

