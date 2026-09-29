import express from "express";
import Comment from "../models/Comment";
import Incident from "../models/Incident";
import Notification from "../models/Notification";
import { protect, AuthRequest } from "../middleware/authMiddleware";
import { io } from "../server";

const router = express.Router();

router.get("/:incidentId", async (req, res) => {
  try {
    const comments = await Comment.find({
      incident: req.params.incidentId as any,
    })
      .populate("user", "name")
      .sort({ createdAt: 1 });

    res.status(200).json({ comments });
  } catch (error) {
    res.status(500).json({ message: "Something went wrong", error });
  }
});

router.post("/:incidentId", protect, async (req: AuthRequest, res) => {
  try {
    const { text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ message: "Comment text is required" });
    }

    const incident = await Incident.findById(req.params.incidentId);
    if (!incident) {
      return res.status(404).json({ message: "Incident not found" });
    }

    const comment: any = await Comment.create({
      incident: req.params.incidentId as any,
      user: req.user?.id as any,
      text: text.trim(),
    });

    const populatedComment = await comment.populate("user", "name");

    io.emit("newComment", {
      incidentId: req.params.incidentId,
      comment: populatedComment,
    });

    if (incident.reportedBy.toString() !== req.user?.id) {
      const notification = await Notification.create({
        user: incident.reportedBy,
        message: `New comment on your report: "${incident.title}"`,
        type: "verification",
        relatedIncident: incident._id,
      });

      io.to(`user_${incident.reportedBy}`).emit(
        "newNotification",
        notification
      );
    }

    res.status(201).json({ comment: populatedComment });
  } catch (error) {
    res.status(500).json({ message: "Something went wrong", error });
  }
});

export default router;