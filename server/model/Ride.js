import mongoose from "mongoose";

const rideSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  driverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Driver",
  },
  vehicleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Vehicle",
  },
  riders: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: "User",
    default: [],
  },
  start: {
    type: String,
    required: true,
  },
  destination: {
    type: String,
    required: true,
  },
  startLocation: {
    type: {
      type: String,
      enum: ["Point"],
      default: "Point",
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true,
    },
  },
  destinationLocation: {
    type: {
      type: String,
      enum: ["Point"],
      default: "Point",
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true,
    },
  },
  distance: {
    type: Number,
    // required: true,
  },
  fare: {
    type: Number,
    // required: true,
  },
  paymentMethod: {
    type: String,
    enum: ["cash", "card"],
    default: "cash",
  },
  status: {
    type: String,
    enum: [
      "pending",
      "accepted",
      "started",
      "reached_pickup",
      "completed",
      "cancelled",
    ],
    default: "pending",
  },
  paymentStatus: {
    type: String,
    enum: ["pending", "completed", "cancelled"],
    default: "pending",
  },
  requestedAt: {
    type: Date,
    default: Date.now,
  },
  acceptedAt: {
    type: Date,
    default: Date.now,
  },
  completedAt: {
    type: Date,
    default: Date.now,
  },
  rating: {
    type: Number,
  },
  polyline: {
    type: String,
  },
  routeCoordinates: {
    type: [[Number]], // [[longitude, latitude], ...]
  },
});
rideSchema.index({ startLocation: "2dsphere" });
rideSchema.index({ destinationLocation: "2dsphere" });
const Ride = mongoose.model("Ride", rideSchema);

export default Ride;
