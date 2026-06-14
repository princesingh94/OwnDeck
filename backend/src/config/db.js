const mongoose = require("mongoose");

const connectDb = async () => {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    throw new Error("MONGO_URI is missing in environment");
  }
  await mongoose.connect(uri);
  console.log("MongoDB connected");
};

module.exports = connectDb;
