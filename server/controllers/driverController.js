import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import User from "../model/User.js";
import Rider from "../model/Rider.js";
import Driver from "../model/Driver.js";
import redisClient from "../config/redis.js";
// import { setDriverLocation } from "../socket/locationTracker.js";

export const goOnline = async (req, res) => {
  try {
    const { driverId } = req.body;
    const id = driverId;
    let driver;
    if (id) {
      driver = await Driver.findById(id);
    } else {
      driver = await Driver.findOne({ userId: req.user._id });
    }

    if (!driver) {
      return res
        .status(404)
        .json({ success: false, message: "Driver profile not found" });
    }

    driver.isAvailable = true;
    await driver.save();

    // Trigger immediate update on going online
    // await handleImportantLocationEvent(driver._id, "online", driver.currentLocation?.coordinates);

    res
      .status(200)
      .json({ success: true, message: "Driver is now online", driver });
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .json({ success: false, message: "Failed to update driver status" });
  }
};

export const goOffline = async (req, res) => {
  try {
    const { driverId } = req.body;
    const id = driverId || dirverId;
    let driver;
    if (id) {
      driver = await Driver.findById(id);
    } else {
      driver = await Driver.findOne({ userId: req.user._id });
    }

    if (!driver) {
      return res
        .status(404)
        .json({ success: false, message: "Driver profile not found" });
    }

    driver.isAvailable = false;
    await driver.save();

    // Remove from Redis spatial index
    try {
      await redisClient.zRem("drivers", driver._id.toString());
      await redisClient.del(`driver:${driver._id}`);
    } catch (err) {
      console.error(
        `Error removing driver ${driver._id} from Redis on offline:`,
        err,
      );
    }

    // Trigger immediate update on going offline
    // await handleImportantLocationEvent(driver._id, "offline", driver.currentLocation?.coordinates);

    res
      .status(200)
      .json({ success: true, message: "Driver is now offline", driver });
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .json({ success: false, message: "Failed to update driver status" });
  }
};

export const updateDriverLocation = async (req, res) => {
  try {
    const { driverId, location } = req.body;
    let driver;
    if (driverId) {
      driver = await Driver.findById(driverId);
    } else {
      driver = await Driver.findOne({ userId: req.user._id });
    }

    if (!driver) {
      return res
        .status(404)
        .json({ success: false, message: "Driver profile not found" });
    }

    let coords = [0, 0];
    const loc = location;
    if (loc) {
      if (Array.isArray(loc.coordinates)) {
        coords = loc.coordinates;
      } else if (
        loc.coordinates &&
        loc.coordinates.longitude !== undefined &&
        loc.coordinates.latitude !== undefined
      ) {
        coords = [loc.coordinates.longitude, loc.coordinates.latitude];
      } else if (loc.longitude !== undefined && loc.latitude !== undefined) {
        coords = [loc.longitude, loc.latitude];
      }
    }

    // Update in-memory location tracker instead of immediate Mongo write.
    // The tracker will write to Redis every 5s and MongoDB every 60s.
    setDriverLocation(driver._id, coords[0], coords[1]);

    // Update driver object locally for the API response
    driver.currentLocation = { type: "Point", coordinates: coords };

    res
      .status(200)
      .json({ success: true, message: "Driver location updated", driver });
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .json({ success: false, message: "Failed to update driver location" });
  }
};

export const getDriverProfile = async (req, res) => {
  try {
    const driver = await Driver.findOne({ userId: req.user._id });
    if (!driver) {
      return res
        .status(404)
        .json({ success: false, message: "Driver profile not found" });
    }
    res.status(200).json({ success: true, driver });
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch driver profile" });
  }
};

