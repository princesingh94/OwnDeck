const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const { generateComplaint, lostItemCard, complaintChat } = require("../controllers/aiController");

const router = express.Router();

router.post("/products/:id/complaint", protect, generateComplaint);
router.post("/products/:id/complaint-chat", protect, complaintChat);
router.get("/products/:id/lost-card", protect, lostItemCard);

module.exports = router;
