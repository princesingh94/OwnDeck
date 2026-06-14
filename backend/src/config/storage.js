const fs = require("fs");
const path = require("path");
const cloudinary = require("cloudinary").v2;

const hasCloudinary =
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET;

if (hasCloudinary) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });
}

const uploadToStorage = async (localPath) => {
  if (hasCloudinary) {
    const result = await cloudinary.uploader.upload(localPath, {
      folder: "owndeck",
      resource_type: "auto"
    });
    fs.unlinkSync(localPath);
    return { fileUrl: result.secure_url, filePublicId: result.public_id };
  }

  const uploadsDir = path.join(__dirname, "..", "..", "uploads");
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  const fileName = path.basename(localPath);
  const targetPath = path.join(uploadsDir, fileName);
  fs.copyFileSync(localPath, targetPath);
  fs.unlinkSync(localPath);

  const localUrl = `${process.env.BACKEND_PUBLIC_URL || `http://localhost:${process.env.PORT || 5000}`}/uploads/${fileName}`;
  return { fileUrl: localUrl, filePublicId: "" };
};

module.exports = { uploadToStorage };

