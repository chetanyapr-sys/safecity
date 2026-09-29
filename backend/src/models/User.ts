import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  role: "citizen" | "moderator" | "admin";
  points: number;
  isEmailVerified: boolean;
  otp?: string;
  otpExpires?: Date;
  resetOtp?: string;
  resetOtpExpires?: Date;
}

const userSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ["citizen", "moderator", "admin"],
      default: "citizen",
    },
    points: {
      type: Number,
      default: 0,
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    otp: {
      type: String,
    },
    otpExpires: {
      type: Date,
    },
    resetOtp: {
      type: String,
    },
    resetOtpExpires: {
      type: Date,
    },
  },
  { timestamps: true }
);

const User = mongoose.model<IUser>("User", userSchema);

export default User;