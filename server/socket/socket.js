import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import registerDriverEvents from "./driver.socket.js";
import registerRideEvents from "./ride.socket.js";

const JWT_SECRET = process.env.JWT_SECRET;

const parseCookies = (cookieString) => {
  if (!cookieString) return {};
  return cookieString.split(";").reduce((res, c) => {
    const [key, val] = c.trim().split("=");
    if (key && val) {
      try {
        res[key] = decodeURIComponent(val);
      } catch {
        res[key] = val;
      }
    }
    return res;
  }, {});
};

let io;
export const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: "http://localhost:5173",
      credentials: true,
    },
  });

  // Socket authentication middleware
  io.use((socket, next) => {
    try {
      let token = socket.handshake.auth?.token;

      if (!token && socket.handshake.headers.cookie) {
        const cookies = parseCookies(socket.handshake.headers.cookie);
        token = cookies.token;
      }

      if (!token && socket.handshake.headers.authorization) {
        const authHeader = socket.handshake.headers.authorization;
        if (authHeader.startsWith("Bearer ")) {
          token = authHeader.substring(7);
        }
      }

      if (!token) {
        return next(new Error("Authentication error: No token provided"));
      }

      const decoded = jwt.verify(token, JWT_SECRET);
      socket.userId = decoded.userId;
      next();
    } catch (err) {
      console.error("Socket Auth Middleware error:", err.message);
      return next(new Error("Authentication error: Invalid token"));
    }
  });

  io.on("connection", (socket) => {
    console.log("A user connected:", socket.id, "User ID:", socket.userId);

    registerDriverEvents(socket, io);
    registerRideEvents(socket, io);

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
    });
  });

  return io;
};
export const getIO = () => io;

