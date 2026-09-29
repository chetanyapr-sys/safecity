import express from "express";
import axios from "axios";
import Incident from "../models/Incident";
import { protect, AuthRequest } from "../middleware/authMiddleware";
import { io } from "../server";
import Notification from "../models/Notification";
import { sendEmail } from "../config/email";
import User from "../models/User";
import { sendPushToUser } from "../utils/sendPushToUser";

const router = express.Router();

router.post("/", protect, async (req: AuthRequest, res) => {
  try {
    const { title, description, category, longitude, latitude, mediaUrl, mediaType } =
      req.body;

    if (!title || !description || !category || !longitude || !latitude) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const nearbyDuplicates = await Incident.find({
      category,
      location: {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [Number(longitude), Number(latitude)],
          },
          $maxDistance: 100,
        },
      },
    });

    let predictedSeverity = "Low";

    try {
      const mlServiceUrl = process.env.ML_SERVICE_URL || "http://localhost:8000";
      const mlResponse = await axios.post(
        `${mlServiceUrl}/predict-severity`,
        { description }
      );
      predictedSeverity = mlResponse.data.severity;
    } catch (mlError) {
      console.error("ML service unavailable, defaulting to Low severity");
    }

    const newIncident = new Incident({
      title,
      description,
      category,
      severity: predictedSeverity,
      location: {
        type: "Point",
        coordinates: [longitude, latitude],
      },
      reportedBy: req.user?.id,
      mediaUrl: mediaUrl || undefined,
      mediaType: mediaType || undefined,
    });

    await newIncident.save();

    await User.findByIdAndUpdate(req.user?.id, { $inc: { points: 5 } });

    const populatedIncident = await newIncident.populate(
      "reportedBy",
      "name email"
    );

    io.emit("newIncident", populatedIncident);

    res.status(201).json({
      message: "Incident reported successfully",
      incident: newIncident,
      possibleDuplicate: nearbyDuplicates.length > 0,
      similarIncidentsCount: nearbyDuplicates.length,
    });
  } catch (error) {
    res.status(500).json({ message: "Something went wrong", error });
  }
});

router.get("/", async (req, res) => {
  try {
    const { category, severity, status, startDate, endDate } = req.query;

    const filter: any = {};

    if (category) {
      filter.category = category;
    }

    if (severity) {
      filter.severity = severity;
    }

    if (status) {
      filter.status = status;
    }

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) {
        filter.createdAt.$gte = new Date(startDate as string);
      }
      if (endDate) {
        filter.createdAt.$lte = new Date(endDate as string);
      }
    }

    const incidents = await Incident.find(filter).populate(
      "reportedBy",
      "name email"
    );

    res.status(200).json({
      count: incidents.length,
      incidents,
    });
  } catch (error) {
    res.status(500).json({ message: "Something went wrong", error });
  }
});

router.get("/nearby", async (req, res) => {
  try {
    const { longitude, latitude, radius } = req.query;

    if (!longitude || !latitude) {
      return res
        .status(400)
        .json({ message: "Longitude and latitude are required" });
    }

    const radiusInKm = radius ? Number(radius) : 5;
    const radiusInMeters = radiusInKm * 1000;

    const incidents = await Incident.find({
      location: {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [Number(longitude), Number(latitude)],
          },
          $maxDistance: radiusInMeters,
        },
      },
    }).populate("reportedBy", "name email");

    res.status(200).json({
      count: incidents.length,
      incidents,
    });
  } catch (error) {
    res.status(500).json({ message: "Something went wrong", error });
  }
});

router.get("/stats/public", async (req, res) => {
  try {
    const totalIncidents = await Incident.countDocuments();
    const resolvedIncidents = await Incident.countDocuments({
      status: "Resolved",
    });
    const verifiedIncidents = await Incident.countDocuments({
      status: "Verified",
    });

    res.status(200).json({
      totalIncidents,
      resolvedIncidents,
      verifiedIncidents,
    });
  } catch (error) {
    res.status(500).json({ message: "Something went wrong", error });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const incident = await Incident.findById(req.params.id).populate(
      "reportedBy",
      "name email"
    );

    if (!incident) {
      return res.status(404).json({ message: "Incident not found" });
    }

    res.status(200).json({ incident });
  } catch (error) {
    res.status(500).json({ message: "Something went wrong", error });
  }
});

router.get("/user/mine", protect, async (req: AuthRequest, res) => {
  try {
    const incidents = await Incident.find({
      reportedBy: req.user?.id as any,
    }).sort({
      createdAt: -1,
    });

    res.status(200).json({
      count: incidents.length,
      incidents,
    });
  } catch (error) {
    res.status(500).json({ message: "Something went wrong", error });
  }
});

router.post("/:id/verify", protect, async (req: AuthRequest, res) => {
  try {
    const incident = await Incident.findById(req.params.id);

    if (!incident) {
      return res.status(404).json({ message: "Incident not found" });
    }

    const userId = req.user?.id;

    if (incident.reportedBy.toString() === userId) {
      return res
        .status(400)
        .json({ message: "You cannot verify your own report" });
    }

    if (incident.verifiedBy.some((id) => id.toString() === userId)) {
      return res
        .status(400)
        .json({ message: "You have already verified this incident" });
    }

    incident.verifiedBy.push(userId as any);


    await User.findByIdAndUpdate(userId, { $inc: { points: 1 } });
    await User.findByIdAndUpdate(incident.reportedBy, { $inc: { points: 2 } });

    const justGotVerified =
      incident.verifiedBy.length >= 3 && incident.status === "Pending";

    if (justGotVerified) {
      incident.status = "Verified";
    }

    await incident.save();

    if (incident.reportedBy.toString() !== userId) {
      const notification = await Notification.create({
        user: incident.reportedBy,
        message: `Someone verified your report: "${incident.title}"`,
        type: "verification",
        relatedIncident: incident._id,
      });

      io.to(`user_${incident.reportedBy}`).emit(
        "newNotification",
        notification
      );

      const reporter = await User.findById(incident.reportedBy);
      if (reporter) {
        sendEmail({
          to: reporter.email,
          subject: "Your report was verified",
          heading: "Someone verified your report",
          message: `Your report has received a new verification from a fellow citizen, adding credibility to your submission.`,
          details: [
            { label: "Report", value: incident.title },
            { label: "Category", value: incident.category },
            {
              label: "Total Verifications",
              value: `${incident.verifiedBy.length}`,
            },
          ],
          actionUrl: `http://localhost:3000/incidents/${incident._id}`,
          actionLabel: "View Report",
        });

        sendPushToUser(String(incident.reportedBy), {
          title: "New Verification",
          body: `Someone verified your report: "${incident.title}"`,
          url: `/incidents/${incident._id}`,
        });
      }
    }

    if (justGotVerified) {
      const statusNotification = await Notification.create({
        user: incident.reportedBy,
        message: `Your report "${incident.title}" is now Verified!`,
        type: "status_change",
        relatedIncident: incident._id,
      });

      io.to(`user_${incident.reportedBy}`).emit(
        "newNotification",
        statusNotification
      );

      const reporter = await User.findById(incident.reportedBy);
      if (reporter) {
        sendEmail({
          to: reporter.email,
          subject: "Your report is now Verified!",
          heading: "🎉 Your report is now Verified",
          message: `Great news! Your report has received enough community verifications and is now officially marked as Verified. This increases its visibility and priority.`,
          details: [
            { label: "Report", value: incident.title },
            { label: "Category", value: incident.category },
            { label: "Severity", value: incident.severity },
            { label: "Status", value: "Verified" },
          ],
          actionUrl: `http://localhost:3000/incidents/${incident._id}`,
          actionLabel: "View Report",
        });

        sendPushToUser(String(incident.reportedBy), {
          title: "Report Verified! 🎉",
          body: `Your report "${incident.title}" is now officially Verified`,
          url: `/incidents/${incident._id}`,
        });
      }
    }

    res.status(200).json({
      message: "Incident verified successfully",
      verifiedCount: incident.verifiedBy.length,
      status: incident.status,
    });
  } catch (error) {
    res.status(500).json({ message: "Something went wrong", error });
  }
});

export default router;