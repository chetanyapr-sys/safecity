import cron from "node-cron";
import Incident from "../models/Incident";
import RiskZone from "../models/RiskZone";

const severityWeight: Record<string, number> = {
  Low: 1,
  Medium: 2,
  High: 3,
  Critical: 5,
};

const calculateRiskZones = async () => {
  try {
    const incidents = await Incident.find();

    const groups: Record<string, { count: number; totalScore: number; lngSum: number; latSum: number }> = {};

    incidents.forEach((incident) => {
      const category = incident.category;

      if (!groups[category]) {
        groups[category] = { count: 0, totalScore: 0, lngSum: 0, latSum: 0 };
      }

      const weight = severityWeight[incident.severity] || 1;
      const group = groups[category];

      if (!group) {
        return;
      }

      group.count += 1;
      group.totalScore += weight;
      group.lngSum += incident.location.coordinates[0];
      group.latSum += incident.location.coordinates[1];
    });

    await RiskZone.deleteMany({});

    for (const category in groups) {
      const group = groups[category];

      if (!group) {
        continue;
      }

      const avgLng = group.lngSum / group.count;
      const avgLat = group.latSum / group.count;

      await RiskZone.create({
        category,
        incidentCount: group.count,
        riskScore: group.totalScore,
        centerLocation: {
          type: "Point",
          coordinates: [avgLng, avgLat],
        },
      });
    }

    console.log("Risk zones calculated successfully");
  } catch (error) {
    console.error("Error calculating risk zones:", error);
  }
};

export const startRiskCalculationJob = () => {
  cron.schedule("0 0 * * *", () => {
    console.log("Running daily risk zone calculation...");
    calculateRiskZones();
  });

  calculateRiskZones();
};