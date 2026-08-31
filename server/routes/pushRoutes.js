import express from "express";
import { protect } from "../middlewares/authMiddleware.js";
import PushSubscription from "../model/PushSubscription.js";

const router = express.Router();

// Register push subscription
router.post("/subscribe", protect, async (req, res) => {
  try {
    const { subscription } = req.body;
    if (!subscription || !subscription.endpoint || !subscription.keys) {
      return res.status(400).json({ success: false, message: "Invalid subscription details." });
    }

    // Save or update subscription
    await PushSubscription.findOneAndUpdate(
      { userId: req.user._id, "subscription.endpoint": subscription.endpoint },
      { userId: req.user._id, subscription },
      { upsert: true, new: true }
    );

    res.status(200).json({ success: true, message: "Subscription saved successfully." });
  } catch (error) {
    console.error("Error saving push subscription:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get VAPID public key
router.get("/vapid-public-key", (req, res) => {
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  if (!publicKey) {
    return res.status(500).json({ success: false, message: "VAPID Public Key not configured." });
  }
  res.status(200).json({ success: true, publicKey });
});

export default router;
