import express from "express";
import RiskZone from "../models/RiskZone";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const riskZones = await RiskZone.find().sort({ riskScore: -1 });

    res.status(200).json({
      count: riskZones.length,
      riskZones,
    });
  } catch (error) {
    res.status(500).json({ message: "Something went wrong", error });
  }
});

export default router;