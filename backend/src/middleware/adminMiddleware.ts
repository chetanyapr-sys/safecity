import { Response, NextFunction } from "express";
import { AuthRequest } from "./authMiddleware";

export const requireAdmin = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ message: "Admin access required" });
  }

  next();
};

export const requireModeratorOrAdmin = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (req.user?.role !== "admin" && req.user?.role !== "moderator") {
    return res
      .status(403)
      .json({ message: "Moderator or admin access required" });
  }

  next();
};