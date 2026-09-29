import express from "express";
import Notification from "../models/Notification";
import { protect, AuthRequest } from "../middleware/authMiddleware";

const router = express.Router();

router.get("/", protect, async (req: AuthRequest, res) => {
  try {
    const notifications = await Notification.find({
      user: req.user?.id as any,
    })
      .sort({ createdAt: -1 })
      .limit(50);

    res.status(200).json({ notifications });
  } catch (error) {
    res.status(500).json({ message: "Something went wrong", error });
  }
});

router.post("/mark-read", protect, async (req: AuthRequest, res) => {
  try {
    await Notification.updateMany(
      { user: req.user?.id as any, read: false },
      { $set: { read: true } }
    );

    res.status(200).json({ message: "Notifications marked as read" });
  } catch (error) {
    res.status(500).json({ message: "Something went wrong", error });
  }
});

router.post("/:id/read", protect, async (req: AuthRequest, res) => {
  try {
    await Notification.updateOne(
      { _id: req.params.id as any, user: req.user?.id as any },
      { $set: { read: true } }
    );

    res.status(200).json({ message: "Notification marked as read" });
  } catch (error) {
    res.status(500).json({ message: "Something went wrong", error });
  }
});

router.delete("/", protect, async (req: AuthRequest, res) => {
  try {
    await Notification.deleteMany({ user: req.user?.id as any });

    res.status(200).json({ message: "All notifications cleared" });
  } catch (error) {
    res.status(500).json({ message: "Something went wrong", error });
  }
});

export default router;