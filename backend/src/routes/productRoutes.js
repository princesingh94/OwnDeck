const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const { upload } = require("../middleware/uploadMiddleware");
const {
  uploadProductDoc,
  listProducts,
  getProduct,
  updateLostMode
} = require("../controllers/productController");

const router = express.Router();

router.get("/", protect, listProducts);
router.post("/upload", protect, upload.single("file"), uploadProductDoc);
router.get("/:id", protect, getProduct);
router.patch("/:id/lost-mode", protect, updateLostMode);

module.exports = router;
