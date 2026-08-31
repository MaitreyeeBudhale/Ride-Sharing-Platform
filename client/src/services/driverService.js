import api from "../api/api";

export const getCompletedRides = async () => {
  try {
    const response = await api.get("/rides/history");
    console.log("completed rides", response);
    if (response.data && response.data.success) {
      return response.data.rides.filter((ride) => ride.status === "completed");
    }
    return [];
  } catch (err) {
    console.error("Error fetching completed rides:", err);
    return [];
  }
};

export const getDriverStats = async () => {
  try {
    const response = await api.get("/rides/history");
    if (response.data && response.data.success) {
      const completed = response.data.rides.filter(
        (ride) => ride.status === "completed",
      );
      return {
        completedRidesCount: completed.length,
        earnings: completed.reduce((total, ride) => total + ride.fare, 0),
        rating: 4.8, // default rating
      };
    }
    return { completedRidesCount: 0, earnings: 0, rating: 4.8 };
  } catch (err) {
    console.error("Error fetching driver stats:", err);
    return { completedRidesCount: 0, earnings: 0, rating: 4.8 };
  }
};

export const acceptRide = async (rideId) => {
  // Accepted via socket on the frontend. This matches dashboard interaction.
  console.log(`Accepting ride with ID: ${rideId}`);
  return { success: true, message: "Ride accepted" };
};

export const rejectRide = async (rideId) => {
  console.log(`Rejecting ride with ID: ${rideId}`);
  return { success: true, message: "Ride request rejected" };
};
