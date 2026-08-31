import mongoose from "mongoose";
import Ride from "../model/Ride.js";
import Driver from "../model/Driver.js";
import Rider from "../model/Rider.js";
import User from "../model/User.js";
import Message from "../model/Message.js";
import { getIO } from "../socket/socket.js";
import redisClient from "../config/redis.js";
import webpush from "web-push";
import PushSubscription from "../model/PushSubscription.js";
import { decodePolyline } from "../utils/polyline.js";

// @desc    Create a new ride
// @route   POST /api/rides
// @access  Private (Rider only)
export const createRide = async (req, res) => {
  const io = getIO();
  try {
    // Only Riders can create a ride
    if (req.user.role !== "Rider") {
      return res
        .status(403)
        .json({ message: "Access denied. Only riders can request a ride." });
    }

    const {
      start,
      destination,
      startLocation,
      destinationLocation,
      distance,
      fare,
      polyline,
      // paymentMethod,
    } = req.body;

    if (
      !start ||
      !destination ||
      !startLocation ||
      !destinationLocation ||
      distance === undefined ||
      fare === undefined
    ) {
      return res
        .status(400)
        .json({ message: "Please provide all required ride fields." });
    }

    // Parse start coordinates
    let startCoords = [0, 0];
    if (Array.isArray(startLocation.coordinates)) {
      startCoords = startLocation.coordinates;
    } else if (
      startLocation.longitude !== undefined &&
      startLocation.latitude !== undefined
    ) {
      startCoords = [startLocation.longitude, startLocation.latitude];
    } else if (
      startLocation.coordinates &&
      startLocation.coordinates.longitude !== undefined
    ) {
      startCoords = [
        startLocation.coordinates.longitude,
        startLocation.coordinates.latitude,
      ];
    }

    // Parse destination coordinates
    let destCoords = [0, 0];
    if (Array.isArray(destinationLocation.coordinates)) {
      destCoords = destinationLocation.coordinates;
    } else if (
      destinationLocation.longitude !== undefined &&
      destinationLocation.latitude !== undefined
    ) {
      destCoords = [
        destinationLocation.longitude,
        destinationLocation.latitude,
      ];
    } else if (
      destinationLocation.coordinates &&
      destinationLocation.coordinates.longitude !== undefined
    ) {
      destCoords = [
        destinationLocation.coordinates.longitude,
        destinationLocation.coordinates.latitude,
      ];
    }

    // Find the rider profile
    const riderProfile = await Rider.findOne({ userId: req.user._id });
    if (!riderProfile) {
      return res.status(404).json({ message: "Rider profile not found." });
    }

    console.log("start coordinates", startCoords);
    // Try to find an available driver nearby (within 10 km) using Redis geoSearch
    let nearbyDrivers = [];
    try {
      const driverIds = await redisClient.geoSearch(
        "drivers",
        {
          longitude: startCoords[0],
          latitude: startCoords[1],
        },
        {
          radius: 10,
          unit: "km",
        },
      );

      if (driverIds && driverIds.length > 0) {
        nearbyDrivers = await Driver.find({
          _id: { $in: driverIds.map((id) => new mongoose.Types.ObjectId(id)) },
          isAvailable: true,
        });
      }
    } catch (redisErr) {
      console.error(
        "Error finding nearby drivers via Redis geoSearch, falling back to MongoDB:",
        redisErr,
      );
      nearbyDrivers = await Driver.find({
        isAvailable: true,
        currentLocation: {
          $near: {
            $geometry: {
              type: "Point",
              coordinates: startCoords,
            },
            $maxDistance: 10000, // 10 km
          },
        },
      });
    }

    let assignedDriverId = null;
    let assignedVehicleId = null;
    let rideStatus = "pending";

    if (nearbyDrivers.length === 0) {
      return res.status(404).json({
        message: "No nearby drivers available.",
      });
    }

    console.log(nearbyDrivers);

    const routeCoords = polyline ? decodePolyline(polyline) : [];

    const ride = await Ride.create({
      userId: req.user._id,
      driverId: assignedDriverId,
      vehicleId: assignedVehicleId,
      riders: [req.user._id],
      start,
      destination,
      startLocation: {
        type: "Point",
        coordinates: startCoords,
      },
      destinationLocation: {
        type: "Point",
        coordinates: destCoords,
      },
      distance,
      fare,
      status: rideStatus,
      paymentStatus: "pending",
      polyline,
      routeCoordinates: routeCoords,
    });

    if (nearbyDrivers.length > 0) {
      const nearbyDriversRooms = nearbyDrivers.map(
        (driver) => `Driver:${driver._id}`,
      );
      console.log("Emitting new-ride-request to drivers:", nearbyDriversRooms);
      io.to(nearbyDriversRooms).emit("new-ride-request", {
        rideId: ride._id,
        userId: req.user._id,
        riderName: req.user.fullName,
        start,
        pickup: start, // mapping start as pickup for frontend
        destination,
        distance,
        fare,
        startLocation: {
          type: "Point",
          coordinates: startCoords,
        },
        destinationLocation: {
          type: "Point",
          coordinates: destCoords,
        },
      });

      // Send Web Push notifications to all matched drivers
      (async () => {
        try {
          const userIds = nearbyDrivers.map((driver) => driver.userId);
          const pushSubscriptions = await PushSubscription.find({
            userId: { $in: userIds },
          });

          const payload = JSON.stringify({
            title: "New Ride Request!",
            body: `Pickup: ${start}\nFare: ₹${fare} (${distance} km)`,
            data: {
              rideId: ride._id,
              userId: req.user._id,
              riderName: req.user.fullName,
              start,
              pickup: start,
              destination,
              distance,
              fare,
              startLocation: {
                type: "Point",
                coordinates: startCoords,
              },
              destinationLocation: {
                type: "Point",
                coordinates: destCoords,
              },
            },
          });

          for (const sub of pushSubscriptions) {
            try {
              await webpush.sendNotification(sub.subscription, payload);
              console.log(
                `Push notification successfully sent to user ${sub.userId}`,
              );
            } catch (pushErr) {
              console.error(
                `Error sending push notification to user ${sub.userId}:`,
                pushErr,
              );
              if (pushErr.statusCode === 410 || pushErr.statusCode === 404) {
                await PushSubscription.deleteOne({ _id: sub._id });
              }
            }
          }
        } catch (err) {
          console.error("Error in sending background push notifications:", err);
        }
      })();
    }

    return res.status(201).json({
      message:
        nearbyDrivers.length > 0
          ? "Ride requested and driver assigned successfully."
          : "Ride requested successfully. Searching for drivers...",
      ride,
    });
  } catch (error) {
    console.error("Error creating ride:", error);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};

// @desc    Cancel a ride
// @route   POST /api/rides/:id/cancel
// @access  Private
export const cancelRide = async (req, res) => {
  try {
    const rideId = req.params.id;
    const ride = await Ride.findById(rideId);

    if (!ride) {
      return res.status(404).json({ message: "Ride not found." });
    }

    if (ride.status === "completed" || ride.status === "cancelled") {
      return res.status(400).json({
        message: `Cannot cancel a ride that is already ${ride.status}.`,
      });
    }

    // Check if the user is authorized to cancel (the requesting rider, or the assigned driver)
    const isRider = ride.userId.toString() === req.user._id.toString();

    let isDriver = false;
    let driverProfile = null;
    if (req.user.role === "Driver") {
      driverProfile = await Driver.findOne({ userId: req.user._id });
      if (
        driverProfile &&
        ride.driverId &&
        ride.driverId.toString() === driverProfile._id.toString()
      ) {
        isDriver = true;
      }
    }

    if (!isRider && !isDriver) {
      return res.status(403).json({
        message: "Access denied. You are not authorized to cancel this ride.",
      });
    }

    // Update status
    ride.status = "cancelled";
    ride.paymentStatus = "cancelled";
    await ride.save();

    const io = getIO();
    io.to(`Ride:${rideId}`).emit("ride-cancelled", { rideId });

    // If a driver was assigned, make them available again
    if (ride.driverId) {
      const driver = await Driver.findById(ride.driverId);
      if (driver) {
        driver.isAvailable = true;
        await driver.save();
      }
    }

    return res.status(200).json({
      message: "Ride cancelled successfully.",
      ride,
    });
  } catch (error) {
    console.error("Error cancelling ride:", error);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};

// @desc    Get ride history
// @route   GET /api/rides/history
// @access  Private
export const getRideHistory = async (req, res) => {
  try {
    let rides = [];

    if (req.user.role === "Rider") {
      rides = await Ride.find({ userId: req.user._id })
        .populate("driverId")
        .populate("vehicleId")
        .sort({ requestedAt: -1 });
    } else if (req.user.role === "Driver") {
      const driver = await Driver.findOne({ userId: req.user._id });
      if (!driver) {
        return res.status(404).json({ message: "Driver profile not found." });
      }
      rides = await Ride.find({ driverId: driver._id })
        .populate("userId", "name email")
        .populate("vehicleId")
        .sort({ requestedAt: -1 });
    }

    return res.status(200).json({
      success: true,
      count: rides.length,
      rides,
    });
  } catch (error) {
    console.error("Error fetching ride history:", error);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};

// @desc    Rate a completed ride
// @route   POST /api/rides/:id/rate
// @access  Private (Rider only)
export const rateRide = async (req, res) => {
  try {
    const { rating } = req.body;
    const rideId = req.params.id;

    if (rating === undefined || rating < 1 || rating > 5) {
      return res
        .status(400)
        .json({ message: "Please provide a valid rating between 1 and 5." });
    }

    const ride = await Ride.findById(rideId);
    if (!ride) {
      return res.status(404).json({ message: "Ride not found." });
    }

    // Make sure the ride is completed
    if (ride.status !== "completed") {
      return res
        .status(400)
        .json({ message: "You can only rate completed rides." });
    }

    // Make sure the requesting user is the rider of the ride
    if (ride.userId.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ message: "Access denied. You can only rate your own rides." });
    }

    // Save rating on the Ride
    ride.rating = rating;
    await ride.save();

    // Recalculate average rating of the driver
    if (ride.driverId) {
      const ratedRides = await Ride.find({
        driverId: ride.driverId,
        rating: { $exists: true, $ne: null },
      });

      const totalRating = ratedRides.reduce((sum, r) => sum + r.rating, 0);
      const averageRating =
        ratedRides.length > 0
          ? Number((totalRating / ratedRides.length).toFixed(1))
          : rating;

      await Driver.findByIdAndUpdate(ride.driverId, { rating: averageRating });
    }

    return res.status(200).json({
      success: true,
      message: "Ride rated successfully.",
      ride,
    });
  } catch (error) {
    console.error("Error rating ride:", error);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};

export const claimRide = async (req, res) => {
  try {
    const requestId = req.params.rideId;
    const driverId = req.user._id.toString();
    const key = `req-ride:lock${requestId}`;

    // NX : Only set if not exists
    // EX: Automatically expire after 120 seconds
    // ride id-driver id
    const result = await redisClient.set(key, driverId, {
      NX: true,
      EX: 120,
    });

    if (result == null) {
      return res.status(409).json({
        success: false,
        busy: true,
        message: "This ride is currently being viewed by another driver.",
      });
    }
    console.log("claimed lock in redis");

    return res.status(200).json({
      success: true,
      busy: false,
      message: "Ride claimed successfully.",
    });
  } catch (error) {
    console.error("Error getting lock:", error);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};

export const releaseRide = async (req, res) => {
  try {
    const requestId = req.params.rideId;
    const driverId = req.user._id.toString();
    const key = `req-ride:lock${requestId}`;

    const result = await redisClient.del(key);

    if (result === 0) {
      return res.status(404).json({
        success: false,
        message: "Ride lock not found or already released.",
      });
    }

    console.log("released lock in redis");

    return res.status(200).json({
      success: true,
      message: "Ride released successfully.",
    });
  } catch (error) {
    console.error("Error releasing lock:", error);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};

export const getPendingRides = async (req, res) => {
  try {
    if (req.user.role !== "Driver") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Only drivers can fetch pending rides.",
      });
    }

    const { lat, lng } = req.query;
    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        message: "Latitude and Longitude are required.",
      });
    }

    const driverCoords = [parseFloat(lng), parseFloat(lat)];

    // Find pending rides within 10 km (10000 meters) of the driver's location
    const pendingRides = await Ride.find({
      status: "pending",
      startLocation: {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: driverCoords,
          },
          $maxDistance: 10000, // 10 km
        },
      },
    }).populate("userId", "fullName rating");

    return res.status(200).json({
      success: true,
      rides: pendingRides,
    });
  } catch (error) {
    console.error("Error fetching pending rides:", error);
    return res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
};

// @desc    Get messages for a specific ride
// @route   GET /api/rides/:rideId/messages
// @access  Private (Participants only)
export const getRideMessages = async (req, res) => {
  try {
    const { rideId } = req.params;
    const userId = req.user._id;

    const ride = await Ride.findById(rideId);
    if (!ride) {
      return res.status(404).json({ success: false, message: "Ride not found" });
    }

    // Verify requesting user is either the rider or driver of the ride
    const isRider = ride.userId && ride.userId.toString() === userId.toString();
    
    let isDriver = false;
    if (ride.driverId) {
      const driver = await Driver.findOne({ userId });
      if (driver && ride.driverId.toString() === driver._id.toString()) {
        isDriver = true;
      }
    }

    if (!isRider && !isDriver) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized: You are not a participant in this ride",
      });
    }

    const messages = await Message.find({ rideId })
      .sort({ createdAt: 1 })
      .limit(100);

    return res.status(200).json({
      success: true,
      messages,
    });
  } catch (error) {
    console.error("Error fetching ride messages:", error);
    return res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
};

