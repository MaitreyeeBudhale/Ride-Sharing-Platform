import express from "express";
import {
  registerRider,
  registerDriver,
  login,
  getCurrentUser,
  logoutUser,
} from "../controllers/authController.js";
import { protect } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Public registration routes
router.post("/register/rider", registerRider);
router.post("/register/driver", registerDriver);

// Public login route
router.post("/login", login);

// Protected route to check current user details
router.get("/me", getCurrentUser);

router.post("/logout", logoutUser);

export default router;
