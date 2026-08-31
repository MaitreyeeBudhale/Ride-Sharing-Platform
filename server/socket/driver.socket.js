import Driver from "../model/Driver.js";
import {
  updateDriverLocation,
  removeDriver,
  forceMongoSync,
} from "./locationTracker.js";

export default function registerDriverEvents(socket, io) {
  /**
   * Driver comes online
   */
  socket.on("driver-online", async ({ driverId }) => {
    try {
      if (!driverId) return;

      socket.driverId = driverId;
      socket.join(`Driver:${driverId}`);

      await Driver.findByIdAndUpdate(driverId, {
        isAvailable: true,
      });

      await forceMongoSync(driverId);

      console.log(`✅ Driver ${driverId} is online`);
    } catch (err) {
      console.error("driver-online error:", err);
    }
  });

  /**
   * Driver location update
   * Frontend emits every 5 seconds
   */
  socket.on("driver-location", async ({ lat, lng, timestamp }) => {
    try {
      if (!socket.driverId) {
        console.warn(`driver-location event received but driver is not online (socket.id: ${socket.id})`);
        return;
      }

      if (
        typeof lat !== "number" ||
        typeof lng !== "number" ||
        lat < -90 ||
        lat > 90 ||
        lng < -180 ||
        lng > 180
      ) {
        console.warn(`Invalid coordinates from ${socket.driverId}`);
        return;
      }

      await updateDriverLocation(socket.driverId, lng, lat, socket.id);

      // Broadcast to active ride room if driver is on a ride
      if (socket.driverId) {
        const Ride = (await import("../model/Ride.js")).default;
        const activeRide = await Ride.findOne({
          driverId: socket.driverId,
          status: "accepted",
        });
        if (activeRide) {
          io.to(`Ride:${activeRide._id}`).emit("driver-location-updated", {
            lat,
            lng,
          });
        }
      }
    } catch (err) {
      console.error("driver-location error:", err);
    }
  });

  /**
   * Driver explicitly goes offline
   */
  socket.on("driver-offline", async () => {
    try {
      if (!socket.driverId) return;

      socket.leave(`Driver:${socket.driverId}`);

      await Driver.findByIdAndUpdate(socket.driverId, {
        isAvailable: false,
      });

      await removeDriver(socket.driverId);

      await forceMongoSync(socket.driverId);

      console.log(`🔴 Driver ${socket.driverId} went offline`);
    } catch (err) {
      console.error("driver-offline error:", err);
    }
  });

  /**
   * Driver disconnects unexpectedly
   * (network loss, app closed, crash)
   */
  socket.on("disconnect", async () => {
    try {
      if (!socket.driverId) return;

      socket.leave(`Driver:${socket.driverId}`);

      console.log(
        `⚠️ Driver ${socket.driverId} disconnected (remains available for background notifications)`,
      );
    } catch (err) {
      console.error("disconnect error:", err);
    }
  });
}
