import redisClient from "../config/redis.js";
import Driver from "../model/Driver.js";

// driverId -> latest location
const activeDrivers = new Map();

/**
 * Called every time a driver sends a location (every 5s)
 */
export const updateDriverLocation = async (
  driverId,
  longitude,
  latitude,
  socketId,
) => {
  if (!driverId) return;
  const id = driverId.toString();

  // 1. Update Redis immediately
  await redisClient.geoAdd("drivers", {
    longitude,
    latitude,
    member: id,
  });
  console.log("driver location updated in redis", longitude, latitude);

  // Optional: store metadata
  await redisClient.hSet(`driver:${id}`, {
    socketId,
    updatedAt: Date.now(),
  });

  // 2. Update in-memory cache
  const existing = activeDrivers.get(id);

  activeDrivers.set(id, {
    longitude,
    latitude,
    dirtyForMongo: true,
    lastMongoCoords: existing?.lastMongoCoords ?? null,
    lastUpdated: Date.now(),
  });
};

/**
 * Force Mongo update immediately
 * (ride accepted, completed, offline, etc.)
 */
export const forceMongoSync = async (driverId) => {
  if (!driverId) return;
  const id = driverId.toString();

  const driver = activeDrivers.get(id);

  if (!driver) return;

  await Driver.findByIdAndUpdate(driverId, {
    currentLocation: {
      type: "Point",
      coordinates: [driver.longitude, driver.latitude],
    },
  });

  driver.lastMongoCoords = [driver.longitude, driver.latitude];

  driver.dirtyForMongo = false;
};

/**
 * Driver disconnect
 */
export const removeDriver = async (driverId) => {
  if (!driverId) return;
  const id = driverId.toString();

  activeDrivers.delete(id);

  await redisClient.zRem("drivers", id);

  await redisClient.del(`driver:${id}`);
};

/**
 * Mongo snapshot every minute
 */
export const startMongoSnapshotJob = () => {
  setInterval(async () => {
    const bulkOps = [];

    for (const [driverId, driver] of activeDrivers.entries()) {
      if (!driver.dirtyForMongo) continue;

      bulkOps.push({
        updateOne: {
          filter: {
            _id: driverId,
          },
          update: {
            currentLocation: {
              type: "Point",
              coordinates: [driver.longitude, driver.latitude],
            },
            updatedAt: new Date(),
          },
        },
      });

      driver.dirtyForMongo = false;

      driver.lastMongoCoords = [driver.longitude, driver.latitude];
    }

    if (bulkOps.length) {
      try {
        await Driver.bulkWrite(bulkOps);
      } catch (err) {
        console.error(err);
      }
    }
  }, 60000);
};
