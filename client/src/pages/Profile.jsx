import React, { useState, useEffect } from "react";
import { useOutletContext, useNavigate } from "react-router-dom";
import {
  User,
  Phone,
  Mail,
  Car,
  ShieldAlert,
  LogOut,
  PlusCircle,
  Check,
} from "lucide-react";
import NavBar from "../components/NavBar";
import api from "../api/api";

export default function Profile() {
  const { user, setUser } = useOutletContext();
  const navigate = useNavigate();

  const [driverProfile, setDriverProfile] = useState(null);
  const [vehicle, setVehicle] = useState(null);
  const [loading, setLoading] = useState(false);

  // Form states to add vehicle (if driver)
  const [showAddVehicle, setShowAddVehicle] = useState(false);
  const [vehicleType, setVehicleType] = useState("cab");
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [regNo, setRegNo] = useState("");
  const [color, setColor] = useState("");
  const [seats, setSeats] = useState(4);
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    if (user?.role === "Driver") {
      fetchDriverProfile();
      fetchVehicleDetails();
    }
  }, [user]);

  const fetchDriverProfile = async () => {
    try {
      const response = await api.get("/driver/profile");
      if (response.data.success) {
        setDriverProfile(response.data.driver);
      }
    } catch (err) {
      console.error("Failed to load driver profile:", err);
    }
  };

  const fetchVehicleDetails = async () => {
    setLoading(true);
    try {
      const vehRes = await api.get("/vehicle");
      if (vehRes.data.success && vehRes.data.vehicle) {
        setVehicle(vehRes.data.vehicle);
      }
    } catch (vehErr) {
      console.error("Failed to fetch vehicle details from endpoint:", vehErr);
      // Fallback check
      try {
        const hist = await api.get("/rides/history");
        if (hist.data.success && hist.data.rides.length > 0) {
          const sample = hist.data.rides.find((r) => r.vehicleId);
          if (sample?.vehicleId) {
            setVehicle(sample.vehicleId);
          }
        }
      } catch (histErr) {
        console.error("Failed to fetch history:", histErr);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await api.post("/auth/logout");
    } catch (err) {
      console.warn("Logout request failed, cleaning up cookie:", err);
    }
    document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;";
    setUser(null);
    navigate("/");
  };

  const handleAddVehicleSubmit = async (e) => {
    e.preventDefault();
    if (!brand || !model || !regNo || !color) return;
    setFormLoading(true);
    try {
      const response = await api.post("/vehicle/add", {
        vehicleType,
        brand,
        model,
        registrationNumber: regNo,
        color,
        seats: Number(seats),
      });
      if (response.data.vehicle) {
        setVehicle(response.data.vehicle);
        setShowAddVehicle(false);
        alert("Vehicle details added successfully!");
      }
    } catch (err) {
      console.error("Failed to add vehicle:", err);
      alert(
        err.response?.data?.message ||
          "Failed to add vehicle. Please try again.",
      );
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col font-sans">
      <NavBar user={user} setUser={setUser} />

      <main className="flex-1 max-w-lg w-full mx-auto p-4 md:p-6 space-y-6 flex flex-col justify-center">
        {/* Profile Card */}
        <div className="bg-white rounded-3xl border border-zinc-100 p-6 shadow-sm space-y-5">
          <div className="flex items-center gap-4 border-b border-zinc-50 pb-4">
            <div className="w-12 h-12 rounded-full bg-zinc-950 flex items-center justify-center text-white text-base font-bold shrink-0">
              {user?.fullName?.charAt(0) || "U"}
            </div>
            <div>
              <h2
                className="text-base font-bold text-zinc-950"
                style={{ fontFamily: "'Space Grotesk', sans-serif" }}
              >
                {user?.fullName}
              </h2>
              <span className="inline-block text-[10px] bg-zinc-50 border border-zinc-100 font-semibold px-2 py-0.5 rounded-full text-zinc-500 mt-0.5">
                {user?.role} Account
              </span>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-3 text-xs text-zinc-600">
              <Mail className="w-4 h-4 text-zinc-400 shrink-0" />
              <span>{user?.email}</span>
            </div>

            {user?.phone && (
              <div className="flex items-center gap-3 text-xs text-zinc-600">
                <Phone className="w-4 h-4 text-zinc-400 shrink-0" />
                <span>{user?.phone}</span>
              </div>
            )}
          </div>

          <button
            onClick={handleLogout}
            className="w-full bg-zinc-50 hover:bg-zinc-100 text-rose-600 font-semibold py-3 rounded-2xl text-xs transition-colors flex items-center justify-center gap-1.5 border border-zinc-100"
          >
            <LogOut className="w-3.5 h-3.5" />
            Logout
          </button>
        </div>

        {/* Driver specific vehicle detail card */}
        {user?.role === "Driver" && (
          <div className="bg-white rounded-3xl border border-zinc-100 p-6 shadow-sm space-y-5">
            <div className="flex justify-between items-center border-b border-zinc-50 pb-3">
              <div className="flex items-center gap-2">
                <Car className="w-4 h-4 text-zinc-600" />
                <h3
                  className="text-sm font-bold text-zinc-950"
                  style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                >
                  Vehicle Information
                </h3>
              </div>
            </div>

            {loading ? (
              <div className="py-4 text-center text-xs text-zinc-400">
                Loading details...
              </div>
            ) : vehicle ? (
              <div className="space-y-3.5">
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-[10px] text-zinc-400 font-semibold block uppercase">
                      Brand / Model
                    </span>
                    <span className="text-zinc-800 font-medium">
                      {vehicle.brand} {vehicle.model}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-zinc-400 font-semibold block uppercase">
                      Color / Seats
                    </span>
                    <span className="text-zinc-800 font-medium">
                      {vehicle.color} ({vehicle.seats} seats)
                    </span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-[10px] text-zinc-400 font-semibold block uppercase">
                      Registration Number
                    </span>
                    <span className="inline-block bg-zinc-50 border border-zinc-200/60 font-mono font-bold px-2 py-0.5 rounded text-zinc-950 mt-0.5">
                      {vehicle.registrationNumber}
                    </span>
                  </div>
                </div>
              </div>
            ) : !showAddVehicle ? (
              <div className="text-center py-4 space-y-3">
                <div className="text-xs text-zinc-400">
                  No vehicle details registered. Add one to go online.
                </div>
                <button
                  onClick={() => setShowAddVehicle(true)}
                  className="mx-auto py-2 px-4 text-xs font-semibold text-white bg-zinc-950 hover:bg-zinc-800 rounded-full transition-all flex items-center gap-1.5"
                >
                  <PlusCircle className="w-4 h-4" />
                  Add Vehicle Info
                </button>
              </div>
            ) : (
              <form onSubmit={handleAddVehicleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-3.5">
                  <div className="col-span-2">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                      Vehicle Type
                    </label>
                    <select
                      value={vehicleType}
                      onChange={(e) => setVehicleType(e.target.value)}
                      className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs outline-none focus:border-zinc-950 focus:bg-white transition-all"
                    >
                      <option value="bike">Bike</option>
                      <option value="auto">Auto</option>
                      <option value="cab">Cab</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                      Brand
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Suzuki"
                      value={brand}
                      onChange={(e) => setBrand(e.target.value)}
                      required
                      className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs outline-none focus:border-zinc-950 focus:bg-white transition-all"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                      Model
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Swift"
                      value={model}
                      onChange={(e) => setModel(e.target.value)}
                      required
                      className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs outline-none focus:border-zinc-950 focus:bg-white transition-all"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                      Reg. Number
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. KA03HA1234"
                      value={regNo}
                      onChange={(e) => setRegNo(e.target.value)}
                      required
                      className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs outline-none focus:border-zinc-950 focus:bg-white transition-all"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                      Color
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. White"
                      value={color}
                      onChange={(e) => setColor(e.target.value)}
                      required
                      className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs outline-none focus:border-zinc-950 focus:bg-white transition-all"
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                      Seats
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="8"
                      value={seats}
                      onChange={(e) => setSeats(e.target.value)}
                      required
                      className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs outline-none focus:border-zinc-950 focus:bg-white transition-all"
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddVehicle(false)}
                    className="flex-1 py-2.5 text-xs font-bold bg-zinc-50 text-zinc-500 rounded-full border border-zinc-200 hover:bg-zinc-100 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={formLoading}
                    className="flex-1 py-2.5 text-xs font-bold bg-zinc-950 text-white rounded-full hover:bg-zinc-800 transition-all"
                  >
                    {formLoading ? "Saving..." : "Save Vehicle"}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
