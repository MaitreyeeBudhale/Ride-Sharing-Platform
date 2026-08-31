import express from "express";
import { protect } from "../middlewares/authMiddleware.js";
import {
  createRide,
  cancelRide,
  getRideHistory,
  rateRide,
  claimRide,
  releaseRide,
  getPendingRides,
  getRideMessages,
} from "../controllers/rideController.js";

const router = express.Router();

// All ride routes are protected
router.post("/", protect, createRide);
router.post("/:id/cancel", protect, cancelRide);
router.post("/:id/rate", protect, rateRide);
router.get("/history", protect, getRideHistory);
router.get("/:rideId/messages", protect, getRideMessages);

router.get("/pending", protect, getPendingRides);

// handle redis locks
router.post("/claim/:rideId", protect, claimRide);
router.delete("/release/:rideId", protect, releaseRide);

export default router;

