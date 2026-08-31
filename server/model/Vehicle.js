import mongoose from "mongoose";
const vehicleSchema = new mongoose.Schema({
  _id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Vehicle",
  },
  driverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Driver",
  },
  vehicleType: {
    type: String,
    required: true,
  },
  brand: {
    type: String,
    required: true,
  },
  model: {
    type: String,
    required: true,
  },
  registrationNumber: {
    type: String,
    required: true,
  },
  color: {
    type: String,
    required: true,
  },
  seats: {
    type: Number,
    required: true,
  },
  // status: {
  //     type: String,
  //     enum: ["APPROVED", "PENDING", "REJECTED"],
  //     default: "PENDING",
  // },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

const Vehicle = mongoose.model("Vehicle", vehicleSchema);

export default Vehicle;
