import React, { useState, useEffect } from "react";
import {
  X,
  MapPin,
  Navigation,
  Info,
  Bike,
  Car,
  ArrowRight,
} from "lucide-react";
import api from "../api/api";
import { useOutletContext } from "react-router-dom";

const VEHICLE_TYPES = [
  { id: "cab", label: "Cab", icon: Car, baseRate: 28, speedMultiplier: 1.5 },
];

const PRESETS = [
  { name: "Downtown Office", lat: 12.9716, lng: 77.5946 },
  { name: "Grand Mall", lat: 12.9352, lng: 77.6245 },
  { name: "City Railway Station", lat: 12.9784, lng: 77.5694 },
  { name: "International Airport", lat: 13.1986, lng: 77.7066 },
];

export default function BookingModal({ isOpen, onClose, onBookRide }) {
  const { user, setUser } = useOutletContext();
  const [pickup, setPickup] = useState("");
  const [drop, setDrop] = useState("");

  const [pickupCoords, setPickupCoords] = useState(null);
  const [dropCoords, setDropCoords] = useState(null);

  const [pickupPlaceId, setPickupPlaceId] = useState(null);
  const [dropPlaceId, setDropPlaceId] = useState(null);

  const [pickupSuggestions, setPickupSuggestions] = useState([]);
  const [dropSuggestions, setDropSuggestions] = useState([]);

  const [selectedType, setSelectedType] = useState("cab");

  const [distance, setDistance] = useState(0);
  const [duration, setDuration] = useState(0);
  const [fare, setFare] = useState(0);
  const [fares, setFares] = useState({});
  const [polyline, setPolyline] = useState("");
  const [loading, setLoading] = useState(false);

  const [currentLocation, setCurrentLocation] = useState({
    longitude: null,
    latitude: null,
  });

  //get current location of user
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        setCurrentLocation({
          longitude: position.coords.longitude,
          latitude: position.coords.latitude,
        });
      });
    }
  }, []);

  // Compute distance and duration when locations are chosen
  useEffect(() => {
    const getSummary = async () => {
      try {
        if (pickupCoords && dropCoords) {
          const response = await api.get(
            `places/distance?start_place_id=${pickupPlaceId}&end_place_id=${dropPlaceId}`,
          );
          setDistance(response.data.distanceKm);
          setDuration(response.data.duration);
          setPolyline(response.data.polyline || "");
          if (response.data.fares) {
            setFares(response.data.fares);
          }
        }
      } catch (error) {
        console.log(error);
      }
    };
    getSummary();
  }, [pickupCoords, dropCoords]);

  // Update selected fare when vehicle type or fares update
  useEffect(() => {
    if (fares && fares[selectedType]) {
      setFare(fares[selectedType]);
    }
  }, [selectedType, fares]);

  const handleSearch = async (val, setSug) => {
    if (!val || val.length < 3) {
      setSug([]);
      return;
    }
    try {
      const response = await api.get(
        `/places/autocomplete?input=${val}&lat=${currentLocation.latitude}&lng=${currentLocation.longitude}`,
      );
      console.log(response.data);
      if (Array.isArray(response.data)) {
        setSug(
          response.data.map((p) => {
            const desc =
              p.placePrediction?.text?.text ||
              p.queryPrediction?.text?.text ||
              "";
            return {
              description: desc,
              placeId: p.placePrediction?.placeId || p.queryPrediction?.placeId,
              lng:
                p.placePrediction?.geometry?.location?.longitude ||
                p.queryPrediction?.geometry?.location?.longitude,
              lat:
                p.placePrediction?.geometry?.location?.latitude ||
                p.queryPrediction?.geometry?.location?.latitude,
            };
          }),
        );
      } else {
        // Fallback preset filtering
        setSug(
          PRESETS.filter((p) =>
            p.name.toLowerCase().includes(val.toLowerCase()),
          ),
        );
      }
    } catch (err) {
      console.warn("Autocomplete error, falling back to presets:", err);
      setSug(
        PRESETS.filter((p) => p.name.toLowerCase().includes(val.toLowerCase())),
      );
    }
  };

  const selectSuggestion = async (sug, isPickup) => {
    if (isPickup) {
      setPickup(sug.description || sug.name);
      const resp = await api.get(`/places/coords?place_id=${sug.placeId}`);
      setPickupCoords({ lng: resp.data.longitude, lat: resp.data.latitude });
      setPickupPlaceId(sug.placeId);
      setPickupSuggestions([]);
    } else {
      setDrop(sug.description || sug.name);
      const resp = await api.get(`/places/coords?place_id=${sug.placeId}`);
      setDropCoords({ lng: resp.data.longitude, lat: resp.data.latitude });
      setDropPlaceId(sug.placeId);
      setDropSuggestions([]);
    }
  };

  const handleBook = () => {
    if (!pickup || !drop || !pickupCoords || !dropCoords) return;
    onBookRide({
      start: pickup,
      destination: drop,
      startLocation: {
        type: "Point",
        coordinates: [pickupCoords.lng, pickupCoords.lat],
      },
      destinationLocation: {
        type: "Point",
        coordinates: [dropCoords.lng, dropCoords.lat],
      },
      distance,
      fare,
      polyline,
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/40 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]">
      <div className="w-full max-w-[420px] bg-white rounded-3xl border border-zinc-100 shadow-[0_24px_70px_-10px_rgba(10,10,10,0.2)] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100">
          <h2
            className="text-lg font-bold text-zinc-950"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            Book a Ride
          </h2>
          <button
            onClick={onClose}
            className="p-1 text-zinc-400 hover:text-zinc-950 rounded-full hover:bg-zinc-50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 flex-1 overflow-y-auto space-y-5">
          {/* Pickup Input */}
          <div className="relative">
            <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block mb-1.5">
              Pickup Location
            </label>
            <div className="relative">
              <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-600" />
              <input
                type="text"
                placeholder="Enter pickup point..."
                value={pickup}
                onChange={(e) => {
                  setPickup(e.target.value);
                  handleSearch(e.target.value, setPickupSuggestions);
                }}
                className="w-full pl-10 pr-4 py-2.5 bg-zinc-50 border border-zinc-200/80 rounded-2xl text-sm focus:bg-white focus:border-zinc-950 focus:ring-1 focus:ring-zinc-950 outline-none transition-all"
              />
            </div>
            {pickupSuggestions.length > 0 && (
              <div className="w-full mt-2 bg-zinc-50 border border-zinc-100 rounded-2xl max-h-40 overflow-y-auto p-1 divide-y divide-zinc-200/50">
                {pickupSuggestions.map((s, idx) => (
                  <button
                    key={idx}
                    onClick={() => selectSuggestion(s, true)}
                    className="w-full text-left px-3 py-2 text-xs hover:bg-white rounded-xl flex items-center gap-2 text-zinc-700 transition-colors"
                  >
                    <Navigation className="w-3 h-3 text-zinc-400 shrink-0" />
                    <span className="truncate">{s.description || s.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Drop Location */}
          <div className="relative">
            <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block mb-1.5">
              Drop Location
            </label>
            <div className="relative">
              <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-rose-600" />
              <input
                type="text"
                placeholder="Enter drop point..."
                value={drop}
                onChange={(e) => {
                  setDrop(e.target.value);
                  handleSearch(e.target.value, setDropSuggestions);
                }}
                className="w-full pl-10 pr-4 py-2.5 bg-zinc-50 border border-zinc-200/80 rounded-2xl text-sm focus:bg-white focus:border-zinc-950 focus:ring-1 focus:ring-zinc-950 outline-none transition-all"
              />
            </div>
            {dropSuggestions.length > 0 && (
              <div className="w-full mt-2 bg-zinc-50 border border-zinc-100 rounded-2xl max-h-40 overflow-y-auto p-1 divide-y divide-zinc-200/50">
                {dropSuggestions.map((s, idx) => (
                  <button
                    key={idx}
                    onClick={() => selectSuggestion(s, false)}
                    className="w-full text-left px-3 py-2 text-xs hover:bg-white rounded-xl flex items-center gap-2 text-zinc-700 transition-colors"
                  >
                    <Navigation className="w-3 h-3 text-zinc-400 shrink-0" />
                    <span className="truncate">{s.description || s.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Preset Pill helpers */}
          {(!pickupCoords || !dropCoords) && (
            <div className="pt-1">
              <span className="text-[10px] font-medium text-zinc-400 block mb-2">
                Preset suggestions:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {PRESETS.map((p) => (
                  <button
                    key={p.name}
                    onClick={() => {
                      if (!pickup) selectSuggestion(p, true);
                      else selectSuggestion(p, false);
                    }}
                    className="px-2.5 py-1 bg-zinc-50 hover:bg-zinc-100 border border-zinc-200/50 rounded-full text-[10px] font-medium text-zinc-600 transition-colors"
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Ride Type selection */}
          <div>
            <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block mb-2">
              Ride Type
            </label>
            <div className="grid grid-cols-3 gap-2.5">
              {VEHICLE_TYPES.map(({ id, label, icon: Icon, baseRate }) => {
                const active = selectedType === id;
                return (
                  <button
                    key={id}
                    onClick={() => setSelectedType(id)}
                    className={`flex flex-col items-center justify-center py-3.5 border rounded-2xl transition-all ${
                      active
                        ? "border-zinc-950 bg-zinc-950 text-white shadow-md shadow-zinc-950/20"
                        : "border-zinc-200 hover:border-zinc-400 text-zinc-600"
                    }`}
                  >
                    <Icon className="w-5 h-5 mb-1.5" />
                    <span className="text-xs font-bold">{label}</span>
                    <span
                      className={`text-[10px] mt-0.5 ${active ? "text-emerald-400" : "text-zinc-400"}`}
                    >
                      Est. ₹
                      {pickupCoords && dropCoords && fares[id] !== undefined
                        ? fares[id]
                        : `${baseRate}/km`}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Fare Summary */}
          {pickupCoords && dropCoords && (
            <div className="bg-zinc-50 border border-zinc-100 rounded-2xl p-4 flex justify-between items-center">
              <div>
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                  Estimate Summary
                </span>
                <div className="text-sm font-medium text-zinc-500 mt-0.5">
                  Distance:{" "}
                  <span className="font-semibold text-zinc-950">
                    {distance} km
                  </span>
                </div>
                <div className="text-sm font-medium text-zinc-500 mt-0.5">
                  Duration:{" "}
                  <span className="font-semibold text-zinc-950">
                    {duration} mins
                  </span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                  Estimated Fare
                </span>
                <span
                  className="text-2xl font-bold text-emerald-600"
                  style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                >
                  ₹{fare}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Action Button */}
        <div className="p-6 bg-zinc-50 border-t border-zinc-100">
          <button
            onClick={handleBook}
            disabled={!pickup || !drop || !pickupCoords || !dropCoords}
            className="w-full bg-zinc-950 text-white hover:bg-zinc-800 disabled:bg-zinc-200 disabled:text-zinc-400 py-3.5 rounded-full text-sm font-semibold flex items-center justify-center gap-2 shadow-sm transition-all"
          >
            Confirm & Book Ride
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
