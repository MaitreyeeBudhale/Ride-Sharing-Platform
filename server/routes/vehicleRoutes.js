import express from "express";
import { addVehicle, getVehicles } from "../controllers/vehicleController.js";
import { protect } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Protected route to add vehicle
router.post("/add", protect, addVehicle);
router.get("/", protect, getVehicles);

export default router;
