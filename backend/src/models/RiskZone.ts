import mongoose, { Schema, Document } from "mongoose";

export interface IRiskZone extends Document {
  category: string;
  incidentCount: number;
  riskScore: number;
  centerLocation: {
    type: "Point";
    coordinates: [number, number];
  };
  calculatedAt: Date;
}

const riskZoneSchema = new Schema<IRiskZone>({
  category: {
    type: String,
    required: true,
  },
  incidentCount: {
    type: Number,
    required: true,
  },
  riskScore: {
    type: Number,
    required: true,
  },
  centerLocation: {
    type: {
      type: String,
      enum: ["Point"],
      default: "Point",
    },
    coordinates: {
      type: [Number],
      required: true,
    },
  },
  calculatedAt: {
    type: Date,
    default: Date.now,
  },
});

const RiskZone = mongoose.model<IRiskZone>("RiskZone", riskZoneSchema);

export default RiskZone;