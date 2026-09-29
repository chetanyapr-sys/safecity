import mongoose, { Schema, Document } from "mongoose";

interface IStatusHistoryEntry {
  status: string;
  changedBy: mongoose.Types.ObjectId;
  note?: string;
  changedAt: Date;
}

export interface IIncident extends Document {
  title: string;
  description: string;
  category: string;
  severity: "Low" | "Medium" | "High" | "Critical";
  location: {
    type: "Point";
    coordinates: [number, number];
  };
  reportedBy: mongoose.Types.ObjectId;
  status: "Pending" | "Verified" | "Resolved" | "Rejected";
  verifiedBy: mongoose.Types.ObjectId[];
  mediaUrl?: string;
  mediaType?: "image" | "video";
  resolutionNote?: string;
  statusHistory: IStatusHistoryEntry[];
  assignedDepartment?: string;
  isPriority: boolean;
  internalNotes: {
    text: string;
    addedBy: mongoose.Types.ObjectId;
    addedAt: Date;
  }[];
}

const incidentSchema = new Schema<IIncident>(
  {
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: true,
      enum: [
        "Theft",
        "Accident",
        "Harassment",
        "Infrastructure",
        "Fire",
        "Other",
      ],
    },
    severity: {
      type: String,
      enum: ["Low", "Medium", "High", "Critical"],
      default: "Low",
    },
    location: {
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
    reportedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: ["Pending", "Verified", "Resolved", "Rejected"],
      default: "Pending",
    },
    verifiedBy: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    mediaUrl: {
      type: String,
      required: false,
    },
    mediaType: {
      type: String,
      enum: ["image", "video"],
      required: false,
    },
    resolutionNote: {
      type: String,
      required: false,
    },
    statusHistory: [
      {
        status: { type: String, required: true },
        changedBy: { type: Schema.Types.ObjectId, ref: "User" },
        note: { type: String },
        changedAt: { type: Date, default: Date.now },
      },
    ],
    assignedDepartment: {
      type: String,
      enum: ["Police", "Fire Department", "Municipal Corporation", "Traffic Police", "Unassigned"],
      default: "Unassigned",
    },
    isPriority: {
      type: Boolean,
      default: false,
    },
    internalNotes: [
      {
        text: { type: String, required: true },
        addedBy: { type: Schema.Types.ObjectId, ref: "User" },
        addedAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

incidentSchema.index({ location: "2dsphere" });

const Incident = mongoose.model<IIncident>("Incident", incidentSchema);

export default Incident;