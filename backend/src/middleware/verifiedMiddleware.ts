import { Response, NextFunction } from "express";
import { AuthRequest } from "./authMiddleware";
import User from "../models/User";

export const requireVerified = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = await User.findById(req.user?.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!user.isEmailVerified) {
      return res.status(403).json({
        message:
          "Please verify your email before performing this action. Check your inbox for the verification link.",
      });
    }

    next();
  } catch (error) {
    res.status(500).json({ message: "Something went wrong", error });
  }
};