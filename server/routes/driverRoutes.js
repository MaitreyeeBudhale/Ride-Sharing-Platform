import express from "express";
import { protect } from "../middlewares/authMiddleware.js";
import {
  goOnline,
  goOffline,
  updateDriverLocation,
  getDriverProfile,
} from "../controllers/driverController.js";

const router = express.Router();

router.get("/profile", protect, getDriverProfile);
router.patch("/go-online", protect, goOnline);
router.patch("/go-offline", protect, goOffline);

router.put("/update-location", protect, updateDriverLocation);

export default router;
