import express from "express";
import Incident from "../models/Incident";
import User from "../models/User";
import Notification from "../models/Notification";
import { sendEmail } from "../config/email";
import { protect, AuthRequest } from "../middleware/authMiddleware";
import { requireAdmin, requireModeratorOrAdmin } from "../middleware/adminMiddleware";
import { io } from "../server";
import { sendPushToUser } from "../utils/sendPushToUser";

const router = express.Router();

router.get("/stats", protect, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const totalIncidents = await Incident.countDocuments();

    const categoryStats = await Incident.aggregate([
      { $group: { _id: "$category", count: { $sum: 1 } } },
    ]);

    const severityStats = await Incident.aggregate([
      { $group: { _id: "$severity", count: { $sum: 1 } } },
    ]);

    const statusStats = await Incident.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);

    res.status(200).json({
      totalIncidents,
      categoryStats,
      severityStats,
      statusStats,
    });
  } catch (error) {
    res.status(500).json({ message: "Something went wrong", error });
  }
});

router.get(
  "/incidents",
  protect,
  requireModeratorOrAdmin,
  async (req: AuthRequest, res) => {
    try {
      const { status, category, priority } = req.query;

      const filter: any = {};
      if (status) filter.status = status;
      if (category) filter.category = category;
      if (priority === "true") filter.isPriority = true;

      const incidents = await Incident.find(filter)
        .populate("reportedBy", "name email")
        .sort({ isPriority: -1, createdAt: -1 });

      res.status(200).json({ count: incidents.length, incidents });
    } catch (error) {
      res.status(500).json({ message: "Something went wrong", error });
    }
  }
);

async function notifyReporter(
  incident: any,
  message: string,
  emailSubject: string,
  emailHeading: string,
  emailMessage: string
) {
  const notification = await Notification.create({
    user: incident.reportedBy,
    message,
    type: "status_change",
    relatedIncident: incident._id,
  });

  io.to(`user_${incident.reportedBy}`).emit("newNotification", notification);

  const reporter = await User.findById(incident.reportedBy);
  if (reporter) {
    sendEmail({
      to: reporter.email,
      subject: emailSubject,
      heading: emailHeading,
      message: emailMessage,
      details: [
        { label: "Report", value: incident.title },
        { label: "Status", value: incident.status },
      ],
      actionUrl: `http://localhost:3000/incidents/${incident._id}`,
      actionLabel: "View Report",
    });

    sendPushToUser(String(incident.reportedBy), {
      title: `Report ${incident.status}`,
      body: message,
      url: `/incidents/${incident._id}`,
    });
  }
}

router.patch(
  "/incidents/:id/status",
  protect,
  requireModeratorOrAdmin,
  async (req: AuthRequest, res) => {
    try {
      const { status, note } = req.body;

      const validStatuses = ["Pending", "Verified", "Resolved", "Rejected"];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }

      const incident = await Incident.findById(req.params.id);
      if (!incident) {
        return res.status(404).json({ message: "Incident not found" });
      }

      incident.status = status;
      if (note) incident.resolutionNote = note;

      incident.statusHistory.push({
        status,
        changedBy: req.user?.id as any,
        note,
        changedAt: new Date(),
      });

      await incident.save();

      await notifyReporter(
        incident,
        `Your report "${incident.title}" has been marked as ${status}${
          note ? `: ${note}` : ""
        }`,
        `Your report has been ${status}`,
        `Your report is now ${status}`,
        note || `An admin has updated the status of your report.`
      );

      res.status(200).json({ message: "Status updated", incident });
    } catch (error) {
      res.status(500).json({ message: "Something went wrong", error });
    }
  }
);

router.post(
  "/incidents/bulk-status",
  protect,
  requireModeratorOrAdmin,
  async (req: AuthRequest, res) => {
    try {
      const { ids, status, note } = req.body;

      const validStatuses = ["Pending", "Verified", "Resolved", "Rejected"];
      if (!Array.isArray(ids) || ids.length === 0 || !validStatuses.includes(status)) {
        return res.status(400).json({ message: "Invalid request" });
      }

      const incidents = await Incident.find({ _id: { $in: ids } });

      for (const incident of incidents) {
        incident.status = status;
        if (note) incident.resolutionNote = note;
        incident.statusHistory.push({
          status,
          changedBy: req.user?.id as any,
          note,
          changedAt: new Date(),
        });
        await incident.save();

        await notifyReporter(
          incident,
          `Your report "${incident.title}" has been marked as ${status}`,
          `Your report has been ${status}`,
          `Your report is now ${status}`,
          note || `An admin has updated the status of your report.`
        );
      }

      res.status(200).json({ message: `${incidents.length} incidents updated` });
    } catch (error) {
      res.status(500).json({ message: "Something went wrong", error });
    }
  }
);

router.patch(
  "/incidents/:id/assign",
  protect,
  requireModeratorOrAdmin,
  async (req: AuthRequest, res) => {
    try {
      const { department } = req.body;

      const validDepartments = [
        "Police",
        "Fire Department",
        "Municipal Corporation",
        "Traffic Police",
        "Unassigned",
      ];
      if (!validDepartments.includes(department)) {
        return res.status(400).json({ message: "Invalid department" });
      }

      const incident = await Incident.findByIdAndUpdate(
        req.params.id,
        { assignedDepartment: department },
        { new: true }
      );

      if (!incident) {
        return res.status(404).json({ message: "Incident not found" });
      }

      res.status(200).json({ message: "Department assigned", incident });
    } catch (error) {
      res.status(500).json({ message: "Something went wrong", error });
    }
  }
);

router.patch(
  "/incidents/:id/priority",
  protect,
  requireModeratorOrAdmin,
  async (req: AuthRequest, res) => {
    try {
      const incident = await Incident.findById(req.params.id);
      if (!incident) {
        return res.status(404).json({ message: "Incident not found" });
      }

      incident.isPriority = !incident.isPriority;
      await incident.save();

      res.status(200).json({
        message: "Priority toggled",
        isPriority: incident.isPriority,
      });
    } catch (error) {
      res.status(500).json({ message: "Something went wrong", error });
    }
  }
);

router.post(
  "/incidents/:id/notes",
  protect,
  requireModeratorOrAdmin,
  async (req: AuthRequest, res) => {
    try {
      const { text } = req.body;
      if (!text || !text.trim()) {
        return res.status(400).json({ message: "Note text is required" });
      }

      const incident = await Incident.findById(req.params.id);
      if (!incident) {
        return res.status(404).json({ message: "Incident not found" });
      }

      incident.internalNotes.push({
        text: text.trim(),
        addedBy: req.user?.id as any,
        addedAt: new Date(),
      });

      await incident.save();

      res.status(200).json({
        message: "Note added",
        internalNotes: incident.internalNotes,
      });
    } catch (error) {
      res.status(500).json({ message: "Something went wrong", error });
    }
  }
);

export default router;