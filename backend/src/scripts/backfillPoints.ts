import mongoose from "mongoose";
import dotenv from "dotenv";
import Incident from "../models/Incident";
import User from "../models/User";

dotenv.config();

const backfillPoints = async () => {
  await mongoose.connect(process.env.MONGO_URI as string);
  console.log("Connected to MongoDB");

  await User.updateMany({}, { $set: { points: 0 } });

  const incidents = await Incident.find();

  for (const incident of incidents) {
    await User.findByIdAndUpdate(incident.reportedBy, {
      $inc: { points: 5 },
    });

    for (const verifierId of incident.verifiedBy) {
      await User.findByIdAndUpdate(verifierId, { $inc: { points: 1 } });
      await User.findByIdAndUpdate(incident.reportedBy, {
        $inc: { points: 2 },
      });
    }
  }

  console.log("Points backfilled successfully!");
  process.exit(0);
};

backfillPoints();