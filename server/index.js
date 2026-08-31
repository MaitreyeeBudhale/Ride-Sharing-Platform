import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/connectDB.js";
import dns from "node:dns";
import redisClient from "./config/redis.js";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/authRoutes.js";
import vehicleRoutes from "./routes/vehicleRoutes.js";
import driverRoutes from "./routes/driverRoutes.js";
import rideRoutes from "./routes/rideRoutes.js";
import placeRoutes from "./routes/placeRoutes.js";
import pushRoutes from "./routes/pushRoutes.js";
import { createServer } from "node:http";
import { initSocket } from "./socket/socket.js";
import webpush from "web-push";
// import cookieParser from "cookie-parser"
dotenv.config();

webpush.setVapidDetails(
  "mailto:support@ridesharingapp.com",
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

const app = express();
const httpServer = createServer(app);
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  }),
);

dns.setServers(["8.8.8.8", "1.1.1.1"]);
app.use(express.json());
app.use(cookieParser());
app.use("/api/auth", authRoutes);
app.use("/api/vehicle", vehicleRoutes);
app.use("/api/driver", driverRoutes);
app.use("/api/rides", rideRoutes);
app.use("/api/places", placeRoutes);
app.use("/api/push", pushRoutes);

// app.use(express.urlencoded({ extended: false }))
// app.use(cookieParser())

const io = initSocket(httpServer);
// connection();
redisClient;

connectDB().then(() => {
  httpServer.listen(process.env.PORT, () => {
    console.log(`Server is running on port ${process.env.PORT}`);
  });
});
