import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import dns from "node:dns";
import connectDB from "../config/connectDB.js";
import User from "../model/User.js";
import Rider from "../model/Rider.js";
import Driver from "../model/Driver.js";
import Vehicle from "../model/Vehicle.js";

dns.setServers(["8.8.8.8", "1.1.1.1"]);
dotenv.config();

const seedData = async () => {
  try {
    // 1. Connect to Database
    await connectDB();

    console.log("Clearing existing database collections...");
    await User.deleteMany({});
    await Rider.deleteMany({});
    await Driver.deleteMany({});
    await Vehicle.deleteMany({});
    console.log("Database cleared successfully.");

    // 2. Hash Password
    const defaultPassword = "password123";
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);

    // 3. Define central location coordinates (Mumbai: [longitude, latitude])
    const baseLon = 72.8777;
    const baseLat = 19.0760;

    // Helper to generate coordinates close to base location
    const getRandomOffset = () => (Math.random() - 0.5) * 0.05; // ~5km range

    // 4. Create Riders
    console.log("Seeding Rider users...");
    const riderUsersData = [
      { name: "Aarav Sharma", email: "aarav.rider@example.com", password: hashedPassword, role: "Rider" },
      { name: "Priya Patel", email: "priya.rider@example.com", password: hashedPassword, role: "Rider" },
      { name: "Amit Verma", email: "amit.rider@example.com", password: hashedPassword, role: "Rider" },
      { name: "Ananya Iyer", email: "ananya.rider@example.com", password: hashedPassword, role: "Rider" },
      { name: "Rohan Das", email: "rohan.rider@example.com", password: hashedPassword, role: "Rider" },
    ];

    const riderUsers = await User.create(riderUsersData);

    const ridersData = riderUsers.map((user, idx) => ({
      userId: user._id,
      currentLocation: {
        type: "Point",
        coordinates: [baseLon + getRandomOffset(), baseLat + getRandomOffset()]
      },
      rating: parseFloat((4.0 + Math.random()).toFixed(1)),
      walletBalance: Math.floor(Math.random() * 500) + 100,
      completedRides: Math.floor(Math.random() * 30),
    }));

    await Rider.create(ridersData);
    console.log(`Successfully seeded ${ridersData.length} Riders.`);

    // 5. Create Drivers and Vehicles
    console.log("Seeding Driver users and vehicles...");
    const driverUsersData = [
      { name: "Rajesh Kumar", email: "rajesh.driver@example.com", password: hashedPassword, role: "Driver" },
      { name: "Suresh Singh", email: "suresh.driver@example.com", password: hashedPassword, role: "Driver" },
      { name: "Vikram Rathore", email: "vikram.driver@example.com", password: hashedPassword, role: "Driver" },
      { name: "Sunita Yadav", email: "sunita.driver@example.com", password: hashedPassword, role: "Driver" },
      { name: "Manish Joshi", email: "manish.driver@example.com", password: hashedPassword, role: "Driver" },
    ];

    const driverUsers = await User.create(driverUsersData);

    const vehicleTypes = ["Sedan", "Hatchback", "SUV", "Sedan", "SUV"];
    const brands = ["Maruti Suzuki", "Hyundai", "Mahindra", "Honda", "Tata"];
    const models = ["Dzire", "i20", "XUV700", "City", "Nexon"];
    const colors = ["White", "Silver", "Black", "Red", "Blue"];
    const seatCounts = [4, 4, 6, 4, 5];

    for (let i = 0; i < driverUsers.length; i++) {
      const user = driverUsers[i];
      const driverId = new mongoose.Types.ObjectId();
      const vehicleId = new mongoose.Types.ObjectId();

      // Create vehicle first
      await Vehicle.create({
        _id: vehicleId,
        driverId: driverId,
        vehicleType: vehicleTypes[i],
        brand: brands[i],
        model: models[i],
        registrationNumber: `MH01AB${1000 + i}`,
        color: colors[i],
        seats: seatCounts[i]
      });

      // Create driver pointing to vehicle
      await Driver.create({
        _id: driverId,
        userId: user._id,
        vehicleId: vehicleId,
        licenseNumber: `DL-1234567890${i}`,
        isAvailable: true,
        currentLocation: {
          type: "Point",
          coordinates: [baseLon + getRandomOffset(), baseLat + getRandomOffset()]
        },
        rating: parseFloat((4.2 + Math.random() * 0.8).toFixed(1)),
        completedRides: Math.floor(Math.random() * 50) + 10,
      });
    }

    console.log(`Successfully seeded ${driverUsers.length} Drivers & Vehicles.`);
    console.log("Database seeding completed successfully!");
    
    // Close connection
    mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error("Error seeding database: ", error);
    mongoose.connection.close();
    process.exit(1);
  }
};

seedData();
