import Ride from "../model/Ride.js";
import Driver from "../model/Driver.js";
import Message from "../model/Message.js";
import { forceMongoSync } from "./locationTracker.js";

export default function registerRideEvents(socket, io) {
  // Event: Put rider socket into rider room
  socket.on("join-rider", ({ riderId }) => {
    socket.join(`Rider: ${riderId}`);
    console.log(`Rider socket ${socket.id} joined room Rider: ${riderId}`);
  });

  // Event: Put driver and rider together into ride room
  socket.on("join-ride", ({ rideId }) => {
    socket.join(`Ride:${rideId}`);
    console.log(`Socket ${socket.id} joined room Ride:${rideId}`);
  });

  // Event: Ride accepted by driver
  socket.on("accept-ride", async (data) => {
    try {
      const rideId = data.rideId;
      const riderId = data.riderId;
      const driverId = data.driverId;
      const driver = await Driver.findById(driverId);

      if (!driver) {
        console.error("Driver not found for accept-ride");
        return;
      }

      const ride = await Ride.findOneAndUpdate(
        {
          _id: rideId,
          status: "pending",
          driverId: null,
        },
        {
          $set: {
            driverId: driverId,
            status: "accepted",
          },
        },
        { new: true },
      );
      if (!ride) {
        socket.emit("ride-accept-failed", {
          rideId,
          message: "Ride has already been accepted",
        });

        return;
      }
      // Immediate MongoDB update on Driver accepts a ride
      await forceMongoSync(driverId);

      const populatedDriver = await Driver.findById(driverId)
        .populate("userId", "fullName email phone")
        .populate("vehicleId");

      io.to(`Rider: ${riderId}`).emit("ride-accepted", {
        rideId,
        driverId,
        driver: populatedDriver,
        ride,
      });
    } catch (err) {
      console.error("Error in accept-ride socket handler:", err);
    }
  });

  socket.on("reject-ride", (data) => {
    io.to(`Rider: ${data.riderId}`).emit("ride-rejected", {
      rideId: data.rideId,
      driverId: data.driverId,
    });
  });

  // Event: Driver reaches pickup
  socket.on("driver-reached-pickup", async (data) => {
    try {
      const { driverId, rideId } = data;
      console.log(`Driver ${driverId} reached pickup for ride ${rideId}`);

      // Update location immediately in MongoDB
      await forceMongoSync(driverId);

      io.to(`Ride:${rideId}`).emit("driver-reached-pickup", {
        driverId,
        rideId,
      });
    } catch (err) {
      console.error("Error in driver-reached-pickup socket handler:", err);
    }
  });

  // Event: Ride starts
  socket.on("start-ride", async (data) => {
    try {
      const { driverId, rideId } = data;
      console.log(`Ride ${rideId} started by driver ${driverId}`);

      // Update ride status in database
      await Ride.findByIdAndUpdate(rideId, { status: "accepted" }); // status remains accepted or we can set it if there is a 'started' status, but schema has pending, accepted, completed, cancelled.

      // Update location immediately in MongoDB
      await forceMongoSync(driverId);

      io.to(`Ride:${rideId}`).emit("ride-started", { rideId });
    } catch (err) {
      console.error("Error in start-ride socket handler:", err);
    }
  });

  // Event: Ride ends
  socket.on("end-ride", async (data) => {
    try {
      const { driverId, rideId } = data;
      console.log(`Ride ${rideId} ended by driver ${driverId}`);

      // Update ride status to completed
      await Ride.findByIdAndUpdate(rideId, {
        status: "completed",
        completedAt: new Date(),
      });

      // Increment driver's completed rides count
      await Driver.findByIdAndUpdate(driverId, {
        $inc: { completedRides: 1 },
        isAvailable: true, // Make driver available again
      });

      // Update location immediately in MongoDB
      await forceMongoSync(driverId);

      io.to(`Ride:${rideId}`).emit("ride-completed", { rideId });
    } catch (err) {
      console.error("Error in end-ride socket handler:", err);
    }
  });

  // rider and driver joins chat room
  socket.on("join-ride-chat", async ({ rideId }) => {
    try {
      const ride = await Ride.findById(rideId);
      if (!ride) {
        return socket.emit("chat-error", "Ride not found");
      }
      // Only allow active ride participants
      const isRider = ride.userId && ride.userId.toString() === socket.userId;

      let isDriver = false;
      if (ride.driverId) {
        const driver = await Driver.findOne({ userId: socket.userId });
        if (driver && ride.driverId.toString() === driver._id.toString()) {
          isDriver = true;
        }
      }

      if (!isRider && !isDriver) {
        return socket.emit("chat-error", {
          message: "You are not part of this ride",
        });
      }
      socket.join(`Chat:${rideId}`);
      console.log(`Socket ${socket.id} joined chat room Chat:${rideId}`);
      socket.emit("chat-joined", {
        rideId,
        message: "You are now in the ride chat",
      });
    } catch (error) {
      console.error("Error in join-ride-chat socket handler:", error);
      socket.emit("chat-error", "Failed to join chat");
    }
  });

  // sending message
  socket.on("send-message", async ({ rideId, message }) => {
    try {
      const ride = await Ride.findById(rideId);
      if (!ride) {
        return socket.emit("chat-error", "Ride not found");
      }
      const isRider = ride.userId && ride.userId.toString() === socket.userId;
      
      let isDriver = false;
      if (ride.driverId) {
        const driver = await Driver.findOne({ userId: socket.userId });
        if (driver && ride.driverId.toString() === driver._id.toString()) {
          isDriver = true;
        }
      }

      if (!isRider && !isDriver) {
        return socket.emit("chat-error", {
          message: "Unauthorized",
        });
      }

      const senderRole = isRider ? "rider" : "driver";

      const newMessage = await Message.create({
        rideId,
        senderId: socket.userId,
        senderRole,
        message: message.trim(),
      });

      io.to(`Chat:${rideId}`).emit("new-message", {
        id: newMessage._id,
        rideId: newMessage.rideId,
        senderId: newMessage.senderId,
        senderRole: newMessage.senderRole,
        message: newMessage.message,
        createdAt: newMessage.createdAt,
      });
    } catch (error) {
      console.error("Send message error:", error);

      socket.emit("chat-error", {
        message: "Message could not be sent",
      });
    }
  });

  // leave ride chat
  socket.on("leave-ride-chat", async ({ rideId }) => {
    try {
      socket.leave(`Chat:${rideId}`);
      console.log(`Socket ${socket.id} left chat room Chat:${rideId}`);
    } catch (error) {
      console.error("Error in leave-ride-chat socket handler:", error);
      socket.emit("chat-error", "Failed to leave chat");
    }
  });
}
