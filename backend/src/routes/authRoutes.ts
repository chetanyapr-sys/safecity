import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import User from "../models/User";
import { protect, AuthRequest } from "../middleware/authMiddleware";
import { validate } from "../middleware/validate";
import { sendEmail } from "../config/email";

const router = express.Router();

const signupSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["citizen", "moderator", "admin"]).optional(),
});

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

router.post("/signup", validate(signupSchema), async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      role,
      otp,
      otpExpires: new Date(Date.now() + 10 * 60 * 1000),
    });

    await newUser.save();

    sendEmail({
      to: email,
      subject: "Verify your SafeCity account",
      heading: "Your verification code",
      message: `Welcome to SafeCity! Use the code below to verify your email address. This code expires in 10 minutes.`,
      details: [{ label: "Verification Code", value: otp }],
    });

    res.status(201).json({
      message:
        "Account created. Please check your email for the verification code.",
      email,
    });
  } catch (error) {
    res.status(500).json({ message: "Something went wrong", error });
  }
});

router.post("/verify-otp", async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res
        .status(400)
        .json({ message: "Email and OTP are required" });
    }

    const user = await User.findOne({
      email,
      otp,
      otpExpires: { $gt: new Date() },
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    user.isEmailVerified = true;
    user.otp = undefined as any;
    user.otpExpires = undefined as any;
    await user.save();

    const authToken = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET as string,
      { expiresIn: "7d" }
    );

    res.status(200).json({
      message: "Email verified successfully",
      token: authToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Something went wrong", error });
  }
});

router.post("/resend-otp", async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({ message: "Email already verified" });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.otp = otp;
    user.otpExpires = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    sendEmail({
      to: email,
      subject: "Your new SafeCity verification code",
      heading: "Your verification code",
      message: `Here is your new verification code. This code expires in 10 minutes.`,
      details: [{ label: "Verification Code", value: otp }],
    });

    res.status(200).json({ message: "OTP resent successfully" });
  } catch (error) {
    res.status(500).json({ message: "Something went wrong", error });
  }
});

router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(200).json({
        message: "If an account exists with this email, a reset code has been sent.",
      });
    }

    const resetOtp = Math.floor(100000 + Math.random() * 900000).toString();
    user.resetOtp = resetOtp;
    user.resetOtpExpires = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    sendEmail({
      to: email,
      subject: "Reset your SafeCity password",
      heading: "Password reset code",
      message: `We received a request to reset your password. Use the code below to continue. If you didn't request this, you can safely ignore this email.`,
      details: [{ label: "Reset Code", value: resetOtp }],
    });

    res.status(200).json({
      message: "If an account exists with this email, a reset code has been sent.",
    });
  } catch (error) {
    res.status(500).json({ message: "Something went wrong", error });
  }
});

router.post("/reset-password", async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res
        .status(400)
        .json({ message: "Email, OTP and new password are required" });
    }

    if (newPassword.length < 6) {
      return res
        .status(400)
        .json({ message: "Password must be at least 6 characters" });
    }

    const user = await User.findOne({
      email,
      resetOtp: otp,
      resetOtpExpires: { $gt: new Date() },
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired reset code" });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    user.resetOtp = undefined as any;
    user.resetOtpExpires = undefined as any;
    await user.save();

    res.status(200).json({ message: "Password reset successfully" });
  } catch (error) {
    res.status(500).json({ message: "Something went wrong", error });
  }
});

router.post("/login", validate(loginSchema), async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    if (!user.isEmailVerified) {
      return res.status(403).json({
        message:
          "Please verify your email before logging in. Check your inbox for the verification code.",
      });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET as string,
      { expiresIn: "7d" }
    );

    res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Something went wrong", error });
  }
});

router.get("/profile", protect, async (req: AuthRequest, res) => {
  res.status(200).json({
    message: "This is protected data",
    user: req.user,
  });
});

export default router;