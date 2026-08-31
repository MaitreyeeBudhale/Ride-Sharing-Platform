export const FARE_CONFIG = {
  cab: {
    baseFare: 50,      // base fare in ₹
    distanceRate: 18,  // ₹ per km
    timeRate: 3.0      // ₹ per minute
  }
};

export const calculateFare = (vehicleType, distanceKm, durationMins) => {
  const config = FARE_CONFIG[vehicleType] || FARE_CONFIG.cab;
  const fare = config.baseFare + (distanceKm * config.distanceRate) + (durationMins * config.timeRate);
  return Math.round(fare);
};
