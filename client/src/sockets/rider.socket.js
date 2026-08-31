import socket from "./socket";

export const joinRider = (riderId) => {
  socket.emit("join-rider", { riderId });
};

export const joinRide = (rideId) => {
  socket.emit("join-ride", { rideId });
};

export const subscribeToRideUpdates = (handlers) => {
  const {
    onRideAccepted,
    onDriverLocationUpdated,
    onDriverReachedPickup,
    onRideStarted,
    onRideCompleted,
    onRideRejected,
  } = handlers;

  if (onRideAccepted) socket.on("ride-accepted", onRideAccepted);
  if (onDriverLocationUpdated)
    socket.on("driver-location-updated", onDriverLocationUpdated);
  if (onDriverReachedPickup)
    socket.on("driver-reached-pickup", onDriverReachedPickup);
  if (onRideStarted) socket.on("ride-started", onRideStarted);
  if (onRideCompleted) socket.on("ride-completed", onRideCompleted);
  if (onRideRejected) socket.on("ride-rejected", onRideRejected);

  return () => {
    if (onRideAccepted) socket.off("ride-accepted", onRideAccepted);
    if (onDriverLocationUpdated)
      socket.off("driver-location-updated", onDriverLocationUpdated);
    if (onDriverReachedPickup)
      socket.off("driver-reached-pickup", onDriverReachedPickup);
    if (onRideStarted) socket.off("ride-started", onRideStarted);
    if (onRideCompleted) socket.off("ride-completed", onRideCompleted);
    if (onRideRejected) socket.off("ride-rejected", onRideRejected);
  };
};
