import mongoose, { Schema, Document } from "mongoose";

export interface INotification extends Document {
  user: mongoose.Types.ObjectId;
  message: string;
  type: "verification" | "nearby_critical" | "status_change";
  relatedIncident?: mongoose.Types.ObjectId;
  read: boolean;
}

const notificationSchema = new Schema<INotification>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ["verification", "nearby_critical", "status_change"],
      required: true,
    },
    relatedIncident: {
      type: Schema.Types.ObjectId,
      ref: "Incident",
    },
    read: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const Notification = mongoose.model<INotification>(
  "Notification",
  notificationSchema
);

export default Notification;