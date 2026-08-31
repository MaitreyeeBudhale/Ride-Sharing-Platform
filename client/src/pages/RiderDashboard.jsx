import React, { useState, useEffect } from "react";
import { useOutletContext, useNavigate } from "react-router-dom";
import {
  Navigation,
  MapPin,
  Loader2,
  Phone,
  Car,
  Compass,
  AlertCircle,
  X,
} from "lucide-react";
import NavBar from "../components/NavBar";
import GMap from "../components/GMap";
import BookingModal from "../components/BookingModal";
import StatusTimeline from "../components/StatusTimeline";
import socket from "../sockets/socket";
import { joinRider, joinRide, subscribeToRideUpdates } from "../sockets/rider.socket";
import api from "../api/api";
import ActiveRideChat from "../components/ActiveRideChat";

export default function RiderDashboard() {
  const { user, setUser } = useOutletContext();
  const navigate = useNavigate();

  useEffect(() => {
    if (user?.role === "Driver") {
      navigate("/driver", { replace: true });
    }
  }, [user, navigate]);

  console.log(user);

  const [pickup, setPickup] = useState("");
  const [drop, setDrop] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);

  // Ride tracking states
  const [activeRide, setActiveRide] = useState(null);
  const [rideStatus, setRideStatus] = useState(null); // 'pending' | 'accepted' | 'arriving' | 'started' | 'completed'
  const [driverDetails, setDriverDetails] = useState(null);
  const [driverLocation, setDriverLocation] = useState(null);
  const [loading, setLoading] = useState(false);

  // Rating states
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [ratingSubmitted, setRatingSubmitted] = useState(false);
  const [submittingRating, setSubmittingRating] = useState(false);

  // Setup sockets
  useEffect(() => {
    socket.connect();

    // Join private room
    if (user?._id) {
      joinRider(user._id);
    }

    // Check if rider already has an active ride on load
    const fetchActiveRide = async () => {
      try {
        const response = await api.get("/rides/history");
        if (response.data.success && response.data.rides.length > 0) {
          const latest = response.data.rides[0];
          if (latest.status === "pending" || latest.status === "accepted") {
            setActiveRide(latest);
            setRideStatus(latest.status);
            if (latest.driverId) {
              setDriverDetails(latest.driverId);
              if (latest.driverId.currentLocation?.coordinates) {
                setDriverLocation({
                  lng: latest.driverId.currentLocation.coordinates[0],
                  lat: latest.driverId.currentLocation.coordinates[1],
                });
              }
            }
            joinRide(latest._id);
          }
        }
      } catch (err) {
        console.error("Failed to check active rides:", err);
      }
    };
    fetchActiveRide();

    const unsubscribe = subscribeToRideUpdates({
      onRideAccepted: (data) => {
        console.log("Ride accepted by driver:", data);
        setActiveRide(data.ride);
        setRideStatus("accepted");
        setDriverDetails(data.driver);
        if (data.driver?.currentLocation?.coordinates) {
          setDriverLocation({
            lng: data.driver.currentLocation.coordinates[0],
            lat: data.driver.currentLocation.coordinates[1],
          });
        }
        joinRide(data.rideId);
      },
      onDriverLocationUpdated: (coords) => {
        console.log("Live driver location:", coords);
        setDriverLocation(coords);
      },
      onDriverReachedPickup: () => {
        setRideStatus("arriving");
      },
      onRideStarted: () => {
        setRideStatus("started");
      },
      onRideCompleted: () => {
        setRideStatus("completed");
      },
      onRideRejected: () => {
        alert("Driver declined the request. Still searching for other drivers...");
      },
    });

    return () => {
      unsubscribe();
      socket.disconnect();
    };
  }, [user]);

  const handleBookRide = async (bookingData) => {
    setIsModalOpen(false);
    setLoading(true);
    try {
      const response = await api.post("/rides", {
        start: bookingData.start,
        destination: bookingData.destination,
        startLocation: bookingData.startLocation,
        destinationLocation: bookingData.destinationLocation,
        distance: bookingData.distance,
        fare: bookingData.fare,
        polyline: bookingData.polyline,
      });

      if (response.data.ride) {
        setActiveRide(response.data.ride);
        setRideStatus(response.data.ride.status || "pending");
      }
    } catch (err) {
      console.error("Error booking ride:", err);
      alert(
        err.response?.data?.message || "Failed to book ride. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCancelRide = async () => {
    if (!activeRide) return;
    if (!confirm("Are you sure you want to cancel this ride?")) return;

    try {
      await api.post(`/rides/${activeRide._id}/cancel`);
      setActiveRide(null);
      setRideStatus(null);
      setDriverDetails(null);
      setDriverLocation(null);
    } catch (err) {
      console.error("Failed to cancel ride:", err);
      alert("Error cancelling ride. Please try again.");
    }
  };

  const resetDashboard = () => {
    setActiveRide(null);
    setRideStatus(null);
    setDriverDetails(null);
    setDriverLocation(null);
    setPickup("");
    setDrop("");
    setRating(0);
    setHoverRating(0);
    setRatingSubmitted(false);
  };

  return (
    <div
      className="min-h-screen bg-zinc-50 flex flex-col"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      <NavBar user={user} setUser={setUser} />

      <main className="flex-1 max-w-6xl w-full mx-auto p-4 md:p-6 grid md:grid-cols-12 gap-6 items-stretch">
        {/* Left Side: Controls & Status Card */}
        <div className="md:col-span-5 flex flex-col gap-5">
          {/* Greeting Card */}
          <div className="bg-white rounded-3xl border border-zinc-100 p-6 shadow-sm">
            <h1
              className="text-xl font-bold text-zinc-950 flex items-center gap-1.5"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              Hi, {user?.fullName?.split(" ")[0] || "Cutie"} 👋
            </h1>
            <p className="text-xs text-zinc-500 mt-1">
              Where are you heading today?
            </p>
          </div>

          {/* Booking Inputs or Active Tracking Controls */}
          <div className="bg-white rounded-3xl border border-zinc-100 p-6 shadow-sm flex-1 flex flex-col justify-between">
            {!activeRide ? (
              <div className="space-y-5">
                <div className="space-y-4">
                  <div className="relative">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                      Pickup Location
                    </label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-600" />
                      <input
                        type="text"
                        placeholder="Click Book Ride to set location"
                        value={pickup}
                        readOnly
                        onClick={() => setIsModalOpen(true)}
                        className="w-full pl-9 pr-4 py-2.5 bg-zinc-50 border border-zinc-100 rounded-2xl text-sm text-zinc-800 cursor-pointer outline-none"
                      />
                    </div>
                  </div>

                  <div className="relative">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                      Drop Location
                    </label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-rose-600" />
                      <input
                        type="text"
                        placeholder="Click Book Ride to set destination"
                        value={drop}
                        readOnly
                        onClick={() => setIsModalOpen(true)}
                        className="w-full pl-9 pr-4 py-2.5 bg-zinc-50 border border-zinc-100 rounded-2xl text-sm text-zinc-800 cursor-pointer outline-none"
                      />
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setIsModalOpen(true)}
                  className="w-full bg-zinc-950 hover:bg-zinc-850 text-white font-semibold py-3.5 rounded-full text-sm shadow-sm transition-all"
                >
                  Book Ride
                </button>
              </div>
            ) : (
              // Active Ride Tracking Panel
              <div className="flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-sm font-bold text-zinc-900 mb-2 uppercase tracking-wider text-[11px]">
                    Ride Status
                  </h3>

                  {/* Timeline */}
                  <StatusTimeline currentStatus={rideStatus} />

                  {/* Status description */}
                  <div className="mt-4 p-4 bg-zinc-50 rounded-2xl border border-zinc-100 flex items-start gap-3">
                    <Compass className="w-5 h-5 text-emerald-600 animate-spin shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-bold text-zinc-950">
                        {rideStatus === "pending" &&
                          "Searching for nearby drivers..."}
                        {rideStatus === "accepted" && "Driver is coming!"}
                        {rideStatus === "arriving" &&
                          "Driver has reached pickup point!"}
                        {rideStatus === "started" && "Ride in progress."}
                        {rideStatus === "completed" &&
                          "You have arrived at your destination!"}
                      </p>
                      <p className="text-[11px] text-zinc-500 mt-0.5">
                        {rideStatus === "pending" &&
                          "Please wait while we match you with a driver."}
                        {rideStatus === "accepted" &&
                          "Driver has accepted your trip request."}
                        {rideStatus === "arriving" &&
                          "Please meet your driver at the pickup point."}
                        {rideStatus === "started" &&
                          "Sit back and enjoy the journey."}
                        {rideStatus === "completed" &&
                          "Thank you for riding with Wheelie!"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Driver & Ride info details card */}
                <div className="mt-6 space-y-4">
                  {driverDetails && (
                    <div className="p-4 border border-zinc-100 rounded-2xl bg-white space-y-3">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-[10px] font-bold text-zinc-400 uppercase">
                            Driver Details
                          </p>
                          <h4 className="text-sm font-bold text-zinc-950">
                            {driverDetails.userId?.fullName || "Driver"}
                          </h4>
                        </div>
                        {driverDetails.rating !== undefined && (
                          <div className="flex items-center gap-0.5 text-amber-500 bg-amber-50 px-2 py-0.5 rounded-full font-bold">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <span key={star} className="text-xs">
                                {star <= Math.round(driverDetails.rating) ? "★" : "☆"}
                              </span>
                            ))}
                            <span className="text-[10px] text-zinc-600 ml-1">
                              ({driverDetails.rating})
                            </span>
                          </div>
                        )}
                      </div>

                      {driverDetails.vehicleId && (
                        <div className="flex items-center gap-3 text-xs text-zinc-600 bg-zinc-50 p-2.5 rounded-xl">
                          <Car className="w-4 h-4 text-zinc-500 shrink-0" />
                          <div>
                            <span className="font-semibold text-zinc-900">
                              {driverDetails.vehicleId.brand}{" "}
                              {driverDetails.vehicleId.model}
                            </span>
                            <span className="mx-1.5 text-zinc-300">|</span>
                            <span className="text-[11px] bg-white border border-zinc-200 px-1.5 py-0.5 rounded font-mono font-bold text-zinc-800">
                              {driverDetails.vehicleId.registrationNumber}
                            </span>
                          </div>
                        </div>
                      )}

                      <div className="flex gap-2">
                        <a
                          href={`tel:${driverDetails.userId?.phone}`}
                          className="flex-1 py-2 text-center text-xs font-semibold bg-zinc-100 hover:bg-zinc-200 rounded-xl transition-all flex items-center justify-center gap-1.5 text-zinc-800"
                        >
                          <Phone className="w-3.5 h-3.5" />
                          Call Driver
                        </a>
                      </div>
                    </div>
                  )}

                  {rideStatus === "completed" && !ratingSubmitted && (
                    <div className="mt-4 p-4 bg-amber-50/40 rounded-2xl border border-amber-100/60 space-y-3">
                      <p className="text-xs font-bold text-zinc-900 text-center">
                        How was your ride with {driverDetails?.userId?.fullName || "your driver"}?
                      </p>
                      <div className="flex justify-center gap-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setRating(star)}
                            onMouseEnter={() => setHoverRating(star)}
                            onMouseLeave={() => setHoverRating(0)}
                            className="text-2xl transition-transform hover:scale-110 focus:outline-none"
                          >
                            <span className={(hoverRating || rating) >= star ? "text-amber-500" : "text-zinc-300"}>
                              ★
                            </span>
                          </button>
                        ))}
                      </div>
                      <button
                        onClick={async () => {
                          if (rating === 0) {
                            alert("Please select a rating!");
                            return;
                          }
                          setSubmittingRating(true);
                          try {
                            await api.post(`/rides/${activeRide._id}/rate`, { rating });
                            setRatingSubmitted(true);
                          } catch (err) {
                            console.error("Failed to submit rating:", err);
                            alert("Failed to submit rating. Please try again.");
                          } finally {
                            setSubmittingRating(false);
                          }
                        }}
                        disabled={submittingRating}
                        className="w-full bg-amber-500 hover:bg-amber-600 disabled:bg-amber-300 text-white font-semibold py-2.5 rounded-xl text-xs transition-all shadow-sm"
                      >
                        {submittingRating ? "Submitting..." : "Submit Rating"}
                      </button>
                    </div>
                  )}

                  {/* Actions */}
                  {rideStatus !== "completed" ? (
                    <button
                      onClick={handleCancelRide}
                      className="w-full bg-rose-50 text-rose-700 border border-rose-100 hover:bg-rose-100 font-semibold py-3.5 rounded-full text-xs transition-all flex items-center justify-center gap-1.5"
                    >
                      <AlertCircle className="w-4 h-4" />
                      Cancel Ride
                    </button>
                  ) : (
                    <div className="space-y-3">
                      {ratingSubmitted && (
                        <p className="text-xs text-center text-emerald-600 font-semibold">
                          ✓ Rating submitted! Thank you.
                        </p>
                      )}
                      <button
                        onClick={resetDashboard}
                        className="w-full bg-zinc-950 text-white hover:bg-zinc-850 font-semibold py-3.5 rounded-full text-xs shadow-sm transition-all"
                      >
                        Book Another Ride
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Map Container */}
        <div className="md:col-span-7 h-[400px] md:h-auto min-h-[350px]">
          <GMap
            driverLocation={
              (rideStatus === "accepted" ||
                rideStatus === "arriving" ||
                rideStatus === "started")
                ? driverLocation
                : null
            }
            pickupLocation={activeRide ? (activeRide.startLocation || activeRide.start) : pickup}
            destination={activeRide ? (activeRide.destinationLocation || activeRide.destination) : drop}
          />
        </div>
      </main>

      {/* Booking Form Dialog Modal */}
      <BookingModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onBookRide={(booking) => {
          setPickup(booking.start);
          setDrop(booking.destination);
          handleBookRide(booking);
        }}
      />

      {/* Active Chat Component */}
      {activeRide && rideStatus && rideStatus !== "pending" && rideStatus !== "completed" && (
        <ActiveRideChat
          rideId={activeRide._id}
          currentUser={user}
          recipientName={driverDetails?.userId?.fullName || "Driver"}
        />
      )}
    </div>
  );
}
