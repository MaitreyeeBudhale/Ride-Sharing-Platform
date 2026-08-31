import { createClient, RedisSentinel } from "redis";
import dotenv from "dotenv";
dotenv.config();

const redisClient = createClient({
  url: process.env.REDIS_URL,
});

redisClient.on("error", (err) => {
  console.error("Redis Client Error:", err);
});
redisClient.on("connect", () => {
  console.log("redis connected successfully");
});
redisClient.on("end", () => {
  console.log("redis disconnected");
});
await redisClient.connect();

export default redisClient;
