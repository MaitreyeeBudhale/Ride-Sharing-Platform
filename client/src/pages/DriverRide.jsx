import React, { useState, useEffect, useRef } from "react";
import { useOutletContext, useParams, useNavigate } from "react-router-dom";
import {
  Navigation,
  MapPin,
  Phone,
  CheckCircle,
  Navigation2,
  Compass,
  AlertCircle,
} from "lucide-react";
import NavBar from "../components/NavBar";
import MapView from "../components/MapView";
import socket from "../sockets/socket";
import {
  setDriverOnline,
  joinDriverRideRoom,
  emitDriverLocation,
  emitReachedPickup,
  emitStartRide,
  emitEndRide,
} from "../sockets/driver.socket";
import api from "../api/api";
import ActiveRideChat from "../components/ActiveRideChat";

export default function DriverRide() {
  console.log("in driver ride page");
  const { user, setUser } = useOutletContext();
  const { rideId } = useParams();
  const navigate = useNavigate();

  const [ride, setRide] = useState(null);
  const [driverProfile, setDriverProfile] = useState(null);
  const [rideStatus, setRideStatus] = useState("accepted"); // 'accepted' | 'arriving' | 'started' | 'completed'
  const [driverLocation, setDriverLocation] = useState({
    lat: 12.9716,
    lng: 77.5946,
  });

  const intervalRef = useRef(null);

  useEffect(() => {
    socket.connect();

    const fetchRideDetails = async () => {
      try {
        // Resolve driver profile
        const onlineRes = await api.get("/driver/profile");
        if (onlineRes.data.success) {
          const profile = onlineRes.data.driver;
          setDriverProfile(profile);
          setDriverOnline(profile._id);

          if (profile.currentLocation?.coordinates) {
            setDriverLocation({
              lng: profile.currentLocation.coordinates[0],
              lat: profile.currentLocation.coordinates[1],
            });
          }

          // Fetch ride info from history
          const historyRes = await api.get("/rides/history");
          if (historyRes.data.success) {
            const active = historyRes.data.rides.find((r) => r._id === rideId);
            if (active) {
              setRide(active);
              // Set starting state based on backend ride status
              if (active.status === "completed") setRideStatus("completed");
              // Join the ride room
              joinDriverRideRoom(rideId);
              startLocationUpdates();
            } else {
              alert("Ride not found or expired.");
              navigate("/driver");
            }
          }
        }
      } catch (err) {
        console.error("Failed to fetch active ride:", err);
      }
    };

    fetchRideDetails();

    socket.on("ride-cancelled", ({ rideId: cancelledId }) => {
      if (cancelledId === rideId) {
        alert("The ride has been cancelled by the rider.");
        stopLocationUpdates();
        navigate("/driver");
      }
    });

    return () => {
      stopLocationUpdates();
      socket.off("ride-cancelled");
      socket.disconnect();
    };
  }, [rideId]);

  const startLocationUpdates = () => {
    stopLocationUpdates();
    if (locationRef.current.lat === null || locationRef.current.lng === null) {
      return;
    }
    intervalRef.current = setInterval(() => {
      console.log("Emitting current driver location:", locationRef.current);
      emitDriverLocation({
        lng: locationRef.current.lng,
        lat: locationRef.current.lat,
      });
    }, 5000);
  };

  const stopLocationUpdates = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const handleReachedPickup = () => {
    if (!driverProfile) return;
    emitReachedPickup({
      driverId: driverProfile._id,
      rideId: rideId,
    });
    setRideStatus("arriving");
  };

  const handleStartRide = () => {
    if (!driverProfile) return;
    emitStartRide({
      driverId: driverProfile._id,
      rideId: rideId,
    });
    setRideStatus("started");
  };

  const handleCompleteRide = () => {
    if (!driverProfile) return;
    emitEndRide({
      driverId: driverProfile._id,
      rideId: rideId,
    });
    setRideStatus("completed");
    alert("Ride completed successfully! Returning to console.");
    stopLocationUpdates();
    navigate("/driver");
  };

  return (
    <div
      className="min-h-screen bg-zinc-50 flex flex-col"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      <NavBar user={user} setUser={setUser} />

      <main className="flex-1 max-w-6xl w-full mx-auto p-4 md:p-6 grid md:grid-cols-12 gap-6 items-stretch">
        {/* Left Side: Ride Details & Controls */}
        <div className="md:col-span-5 flex flex-col gap-5">
          <div className="bg-white rounded-3xl border border-zinc-100 p-6 shadow-sm flex-1 flex flex-col justify-between">
            <div className="space-y-6">
              <div className="pb-3 border-b border-zinc-100 flex justify-between items-center">
                <span className="text-xs bg-zinc-100 text-zinc-800 font-bold px-2.5 py-1 rounded-full uppercase">
                  Active Ride
                </span>
                <span className="text-[11px] font-semibold text-zinc-400">
                  ID: {rideId?.slice(-6)}
                </span>
              </div>

              {ride && (
                <div className="space-y-4">
                  {/* Passenger Card */}
                  <div className="p-4 bg-zinc-50 border border-zinc-100 rounded-2xl">
                    <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block">
                      Passenger Details
                    </span>
                    <h3 className="text-sm font-bold text-zinc-950 mt-1">
                      {ride.userId?.fullName || "Passenger"}
                    </h3>
                    {ride.userId?.phone && (
                      <a
                        href={`tel:${ride.userId.phone}`}
                        className="mt-2 text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1.5"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        Call Passenger ({ride.userId.phone})
                      </a>
                    )}
                  </div>

                  {/* Route details */}
                  <div className="space-y-3">
                    <div className="flex items-start gap-2.5 text-xs">
                      <MapPin className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-semibold text-zinc-400 block text-[9px] uppercase">
                          Pickup point
                        </span>
                        <span className="text-zinc-700">{ride.start}</span>
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5 text-xs">
                      <MapPin className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-semibold text-zinc-400 block text-[9px] uppercase">
                          Destination point
                        </span>
                        <span className="text-zinc-700">
                          {ride.destination}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Navigation progress status */}
            <div className="mt-8 space-y-4 pt-6 border-t border-zinc-50">
              <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100 flex items-start gap-3">
                <Compass className="w-5 h-5 text-emerald-600 animate-pulse shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-zinc-950">
                    {rideStatus === "accepted" && "Head to Pickup Location"}
                    {rideStatus === "arriving" && "Reached Pickup Point"}
                    {rideStatus === "started" && "Drive to Destination Point"}
                    {rideStatus === "completed" && "Trip Completed!"}
                  </p>
                  <p className="text-[10px] text-zinc-500 mt-0.5">
                    {rideStatus === "accepted" &&
                      "Navigate to the passenger's pickup location."}
                    {rideStatus === "arriving" &&
                      "Wait for the passenger and start the ride once boarded."}
                    {rideStatus === "started" &&
                      "Navigate and drop off passenger at destination."}
                    {rideStatus === "completed" &&
                      "The trip has ended successfully."}
                  </p>
                </div>
              </div>

              {/* Action Trigger Buttons */}
              <div className="space-y-3">
                {rideStatus === "accepted" && (
                  <button
                    onClick={handleReachedPickup}
                    className="w-full bg-zinc-950 hover:bg-zinc-800 text-white font-semibold py-3.5 rounded-full text-xs shadow-sm transition-all"
                  >
                    Mark Reached Pickup
                  </button>
                )}
                {rideStatus === "arriving" && (
                  <button
                    onClick={handleStartRide}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3.5 rounded-full text-xs shadow-sm transition-all"
                  >
                    Start Ride
                  </button>
                )}
                {rideStatus === "started" && (
                  <button
                    onClick={handleCompleteRide}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3.5 rounded-full text-xs shadow-sm transition-all"
                  >
                    Complete Ride
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Map Navigation */}
        <div className="md:col-span-7 h-[400px] md:h-auto min-h-[350px]">
          <MapView
            pickupLocation={ride?.start}
            destination={ride?.destination}
            driverLocation={driverLocation}
            showRoute={true}
            showDriver={true}
          />
        </div>
      </main>

      {/* Active Chat Component */}
      {ride && rideId && rideStatus !== "completed" && (
        <ActiveRideChat
          rideId={rideId}
          currentUser={user}
          recipientName={ride.userId?.fullName || "Rider"}
        />
      )}
    </div>
  );
}
