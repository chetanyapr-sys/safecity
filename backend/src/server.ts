import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import rateLimit from "express-rate-limit";
import connectDB from "./config/db";
import authRoutes from "./routes/authRoutes";
import incidentRoutes from "./routes/incidentRoutes";
import riskRoutes from "./routes/riskRoutes";
import adminRoutes from "./routes/adminRoutes";
import uploadRoutes from "./routes/uploadRoutes";
import notificationRoutes from "./routes/notificationRoutes";
import commentRoutes from "./routes/commentRoutes";
import leaderboardRoutes from "./routes/leaderboardRoutes";
import { startRiskCalculationJob } from "./jobs/riskCalculator";
import pushRoutes from "./routes/pushRoutes";

connectDB();

const app = express();
const PORT = 5000;

const httpServer = createServer(app);

export const io = new Server(httpServer, {
  cors: {
    origin: ["http://localhost:3000", "http://localhost:3001"],
    credentials: true,
  },
});

io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  socket.on("joinUserRoom", (userId: string) => {
    socket.join(`user_${userId}`);
    console.log(`Socket ${socket.id} joined room user_${userId}`);
  });

  socket.on("disconnect", () => {
    console.log("A user disconnected:", socket.id);
  });
});

app.use(
  cors({
    origin: ["http://localhost:3000", "http://localhost:3001"],
    credentials: true,
  })
);

app.use(express.json());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { message: "Too many requests, please try again later" },
});

app.use(limiter);

app.use("/api/auth", authRoutes);
app.use("/api/incidents", incidentRoutes);
app.use("/api/risk-zones", riskRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/comments", commentRoutes);
app.use("/api/leaderboard", leaderboardRoutes);
app.use("/api/push", pushRoutes);

app.get("/", (req, res) => {
  res.send("SafeCity backend is running!");
});

httpServer.listen(PORT, () => {
  console.log(`Server chal raha hai port ${PORT} par`);
  startRiskCalculationJob();
});