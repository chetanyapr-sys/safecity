import express from "express";
import User from "../models/User";
import Incident from "../models/Incident";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const topUsers = await User.find()
      .sort({ points: -1 })
      .limit(10)
      .select("name points");

    const leaderboard = await Promise.all(
      topUsers.map(async (user) => {
        const reportCount = await Incident.countDocuments({
          reportedBy: user._id,
        });

        return {
          id: user._id,
          name: user.name,
          points: user.points,
          reportCount,
        };
      })
    );

    res.status(200).json({ leaderboard });
  } catch (error) {
    res.status(500).json({ message: "Something went wrong", error });
  }
});

export default router;