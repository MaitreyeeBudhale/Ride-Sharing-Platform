import express from "express";
import { protect } from "../middlewares/authMiddleware.js";
import {
  getAutocomplete,
  getDistance,
  getCoordinates,
} from "../controllers/placeController.js";

const router = express.Router();

// Autocomplete route can be protected
router.get("/autocomplete", protect, getAutocomplete);
router.get("/distance", protect, getDistance);
router.get("/coords", protect, getCoordinates);

export default router;
