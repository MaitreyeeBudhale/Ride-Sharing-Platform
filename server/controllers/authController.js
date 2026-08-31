import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import User from "../model/User.js";
import Rider from "../model/Rider.js";
import Driver from "../model/Driver.js";
import dotenv from "dotenv";
dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;

// Helper function to generate token
const generateToken = (userId, role) => {
  return jwt.sign({ userId, role }, JWT_SECRET, { expiresIn: "7d" });
};

// @desc    Register a new Rider
// @route   POST /api/auth/register/rider
// @access  Public
export const registerRider = async (req, res) => {
  try {
    const { fullName, email, password, currentLocation } = req.body;
    console.log(req.body);
    if (!fullName || !email || !password) {
      return res
        .status(400)
        .json({ message: "Please provide name, email, and password" });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res
        .status(400)
        .json({ message: "User already exists with this email" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      fullName,
      email,
      password: hashedPassword,
      role: "Rider",
    });

    let coords = [0, 0];
    const loc = currentLocation;
    if (loc) {
      if (Array.isArray(loc.coordinates)) {
        coords = loc.coordinates;
      } else if (
        loc.coordinates &&
        loc.coordinates.longitude !== undefined &&
        loc.coordinates.latitude !== undefined
      ) {
        coords = [loc.coordinates.longitude, loc.coordinates.latitude];
      } else if (loc.longitude !== undefined && loc.latitude !== undefined) {
        coords = [loc.longitude, loc.latitude];
      }
    }

    const rider = await Rider.create({
      userId: user._id,
      currentLocation: {
        type: "Point",
        coordinates: coords,
      },
    });

    const token = generateToken(user._id, user.role);

    return res.status(201).json({
      status: "Success",
      message: "Rider Registered Successfully",
      token,
      user: {
        id: user._id,
        name: user.fullName,
        email: user.email,
        role: user.role,
      },
      rider,
    });
  } catch (error) {
    console.error("Error registering rider:", error);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};

// @desc    Register a new Driver
// @route   POST /api/auth/register/driver
// @access  Public
export const registerDriver = async (req, res) => {
  try {
    const { fullName, email, phone, password, license, location } = req.body;
    if (!fullName || !email || !phone || !password || !license) {
      return res.status(400).json({
        message: "Please fill all required fields for driver registration",
      });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res
        .status(400)
        .json({ message: "User already exists with this email" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      fullName,
      email,
      password: hashedPassword,
      role: "Driver",
    });

    let coords = [0, 0];
    if (location) {
      if (Array.isArray(location.coordinates)) {
        coords = location.coordinates;
      } else if (
        location.coordinates &&
        location.coordinates.longitude !== undefined &&
        location.coordinates.latitude !== undefined
      ) {
        coords = [
          location.coordinates.longitude,
          location.coordinates.latitude,
        ];
      } else if (
        location.longitude !== undefined &&
        location.latitude !== undefined
      ) {
        coords = [location.longitude, location.latitude];
      }
    }

    const driver = await Driver.create({
      userId: user._id,
      licenseNumber: license,
      currentLocation: {
        type: "Point",
        coordinates: coords,
      },
    });

    const token = generateToken(user._id, user.role);

    return res.status(201).json({
      status: "Success",
      message: "Driver Registered Successfully",
      token,
      user: {
        id: user._id,
        name: user.fullName,
        email: user.email,
        role: user.role,
      },
      driver,
    });
  } catch (error) {
    console.error("Error registering driver:", error);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};

// @desc    User Login
// @route   POST /api/auth/login
// @access  Public
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Please provide email and password" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = generateToken(user._id, user.role);

    let profile = null;
    if (user.role === "Rider") {
      profile = await Rider.findOne({ userId: user._id });
    } else if (user.role === "Driver") {
      profile = await Driver.findOne({ userId: user._id });
    }

    return res.status(200).json({
      status: "Success",
      message: "User Logged In Successfully",
      token,
      user: user,
      profile,
    });
  } catch (error) {
    console.error("Error logging in:", error);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};
export const logoutUser = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(400).json({ message: "No token provided" });

    const decoded = jwt.decode(token);
    const expiry = new Date(decoded.exp * 1000);

    await Blacklist.create({ token, expiresAt: expiry });
    res.status(200).json({
      status: "Successful",
      message: "logged out successfully",
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
export const getCurrentUser = async (req, res) => {
  try {
    const token = req.cookies.token;
    if (!token) {
      return res.status(401).json({ message: "user not found" });
    }
    const decoded = jwt.decode(token);
    const user = await User.findById(decoded.userId || decoded.id).select(
      "-password",
    );
    if (!user) {
      return res.status(401).json({ message: "user not found" });
    }
    res.status(200).json({ user: user });
  } catch (error) {
    console.log(error);
  }
};
