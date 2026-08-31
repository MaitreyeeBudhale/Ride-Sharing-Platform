import mongoose from "mongoose";
import Vehicle from "../model/Vehicle.js";
import Driver from "../model/Driver.js";

// @desc    Add vehicle details for a Driver
// @route   POST /api/vehicle/add
// @access  Private (Driver only)
export const addVehicle = async (req, res) => {
  try {
    // Verify the user role is Driver
    if (req.user.role !== "Driver") {
      return res
        .status(403)
        .json({ message: "Access denied. Only drivers can add a vehicle." });
    }

    const { vehicleType, brand, model, registrationNumber, color, seats } =
      req.body;
    console.log(req.body);

    if (
      !vehicleType ||
      !brand ||
      !model ||
      !registrationNumber ||
      !color ||
      !seats
    ) {
      return res
        .status(400)
        .json({ message: "Please provide all required vehicle fields." });
    }

    // Find the driver profile corresponding to the logged in user
    const driver = await Driver.findOne({ userId: req.user._id });
    if (!driver) {
      return res.status(404).json({ message: "Driver profile not found." });
    }

    // Create the vehicle object
    const vehicleId = new mongoose.Types.ObjectId();
    const vehicle = await Vehicle.create({
      _id: vehicleId,
      driverId: driver._id,
      vehicleType,
      brand,
      model,
      registrationNumber,
      color,
      seats,
    });

    // Link vehicle to driver
    driver.vehicleId = vehicle._id;
    await driver.save();

    return res.status(201).json({
      message: "Vehicle added successfully.",
      vehicle,
    });
  } catch (error) {
    console.error("Error adding vehicle:", error);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};

// @desc    Get vehicle details for a Driver
// @route   GET /api/vehicle
// @access  Private (Driver only)
export const getVehicles = async (req, res) => {
  try {
    if (req.user.role !== "Driver") {
      return res
        .status(403)
        .json({ message: "Access denied. Only drivers can fetch vehicle details." });
    }

    const driver = await Driver.findOne({ userId: req.user._id });
    if (!driver) {
      return res.status(404).json({ message: "Driver profile not found." });
    }

    if (!driver.vehicleId) {
      return res.status(404).json({ message: "No vehicle registered for this driver." });
    }

    const vehicle = await Vehicle.findById(driver.vehicleId);
    if (!vehicle) {
      return res.status(404).json({ message: "Vehicle not found." });
    }

    return res.status(200).json({ success: true, vehicle });
  } catch (error) {
    console.error("Error fetching vehicle:", error);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};

