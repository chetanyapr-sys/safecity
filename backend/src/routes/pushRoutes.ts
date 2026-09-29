import express from "express";
import { protect, AuthRequest } from "../middleware/authMiddleware";
import PushSubscription from "../models/PushSubscription";

const router = express.Router();

// POST /api/push/subscribe
router.post("/subscribe", protect, async (req: AuthRequest, res) => {
  try {
    const { endpoint, keys } = req.body;
    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      return res.status(400).json({ message: "Invalid subscription object" });
    }

    await PushSubscription.findOneAndUpdate(
      { endpoint },
      {
        user: req.user?.id as any,
        endpoint,
        keys,
      },
      { upsert: true, new: true }
    );

    res.status(201).json({ message: "Subscribed" });
  } catch (err) {
    res.status(500).json({ message: "Subscription failed" });
  }
});

// POST /api/push/unsubscribe
router.post("/unsubscribe", protect, async (req: AuthRequest, res) => {
  try {
    const { endpoint } = req.body;
    await PushSubscription.deleteOne({ endpoint });
    res.json({ message: "Unsubscribed" });
  } catch (err) {
    res.status(500).json({ message: "Unsubscribe failed" });
  }
});

export default router;