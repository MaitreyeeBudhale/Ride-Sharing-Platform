import socket from "./socket";

export const setDriverOnline = (driverId) => {
  socket.emit("driver-online", { driverId });
};

export const setDriverOffline = () => {
  socket.emit("driver-offline");
};

export const emitDriverLocation = (coords) => {
  socket.emit("driver-location", coords);
};

export const acceptRide = (details) => {
  socket.emit("accept-ride", details);
};

export const rejectRide = (details) => {
  socket.emit("reject-ride", details);
};

export const joinDriverRideRoom = (rideId) => {
  socket.emit("join-ride", { rideId });
};

export const emitReachedPickup = (details) => {
  socket.emit("driver-reached-pickup", details);
};

export const emitStartRide = (details) => {
  socket.emit("start-ride", details);
};

export const emitEndRide = (details) => {
  socket.emit("end-ride", details);
};

export const subscribeToRideRequests = (onNewRideRequest) => {
  socket.on("new-ride-request", onNewRideRequest);
  return () => {
    socket.off("new-ride-request", onNewRideRequest);
  };
};
