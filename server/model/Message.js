import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    rideId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Ride",
      required: true,
      index: true,
    },

    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    senderRole: {
      type: String,
      enum: ["rider", "driver"],
      required: true,
    },

    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },

    type: {
      type: String,
      enum: ["text"],
      default: "text",
    },
  },
  {
    timestamps: true,
  },
);

messageSchema.index({ rideId: 1, createdAt: 1 });

export default mongoose.model("Message", messageSchema);
