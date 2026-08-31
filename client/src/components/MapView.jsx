import React, { useEffect, useState } from "react";
import { Navigation2, MapPin, Flag } from "lucide-react";

/**
 * Reusable MapView Component
 * Renders a gorgeous, responsive, SVG-based simulated map
 * with grid lines, roads, water bodies, parks, and animated markers
 * for pickup, destination, and driver location.
 */
export default function MapView({
  driverLocation,
  pickupLocation,
  destination,
  showRoute = false,
  showDriver = false,
}) {
  // Normalize locations to local SVG coordinate space (0-100)
  const getCoords = (loc, defaultVal) => {
    if (!loc) return defaultVal;
    // If coordinates is array [lng, lat]
    if (Array.isArray(loc)) {
      return { x: 30 + (loc[0] % 1) * 300, y: 70 - (loc[1] % 1) * 300 };
    }
    // If coordinates is object { lat, lng } or { latitude, longitude }
    const lat = loc.lat ?? loc.latitude;
    const lng = loc.lng ?? loc.longitude;
    if (lat !== undefined && lng !== undefined) {
      return { x: 30 + (lng % 1) * 300, y: 70 - (lat % 1) * 300 };
    }
    // Fallback if string or nested
    if (loc.coordinates) {
      return getCoords(loc.coordinates, defaultVal);
    }
    return defaultVal;
  };

  const pickupCoords = getCoords(pickupLocation, { x: 30, y: 70 });
  const dropCoords = getCoords(destination, { x: 75, y: 35 });
  const initialDriverCoords = getCoords(driverLocation, { x: 20, y: 30 });

  const [driverPos, setDriverPos] = useState(initialDriverCoords);

  // Animate driver moving closer to pickup or destination
  useEffect(() => {
    if (driverLocation) {
      const newCoords = getCoords(driverLocation);
      setDriverPos(newCoords);
    }
  }, [driverLocation]);

  return (
    <div className="relative w-full h-full min-h-[300px] bg-zinc-50 border border-zinc-100 rounded-3xl overflow-hidden shadow-inner flex items-center justify-center">
      {/* Grid Pattern Background */}
      <svg className="absolute inset-0 w-full h-full opacity-60" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#E4E4E7" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>

      {/* Styled Map Background Elements */}
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
        {/* Park/Green Area */}
        <path d="M-10,30 Q20,10 40,35 T80,10 T110,30 L110,110 L-10,110 Z" fill="#F0FDF4" opacity="0.7" />
        {/* River/Water Body */}
        <path d="M-10,85 C30,85 40,65 60,65 S80,75 110,50 L110,60 C80,85 70,75 60,75 S30,95 -10,95 Z" fill="#F0F9FF" />
        
        {/* Roads Grid */}
        <line x1="0" y1="30" x2="100" y2="30" stroke="#FFFFFF" strokeWidth="2" />
        <line x1="0" y1="70" x2="100" y2="70" stroke="#FFFFFF" strokeWidth="2.5" />
        <line x1="30" y1="0" x2="30" y2="100" stroke="#FFFFFF" strokeWidth="2" />
        <line x1="75" y1="0" x2="75" y2="100" stroke="#FFFFFF" strokeWidth="2.5" />
        <path d="M0,50 Q50,20 100,50" fill="none" stroke="#FFFFFF" strokeWidth="1.5" strokeDasharray="1 1" />
      </svg>

      {/* Interactive Map Visualizations */}
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100">
        {/* Active Route Path */}
        {showRoute && (
          <g>
            {/* Pulsing route line */}
            <path
              d={`M ${pickupCoords.x} ${pickupCoords.y} Q ${(pickupCoords.x + dropCoords.x) / 2} ${(pickupCoords.y + dropCoords.y) / 2 - 10} ${dropCoords.x} ${dropCoords.y}`}
              fill="none"
              stroke="#10B981"
              strokeWidth="2"
              strokeLinecap="round"
              strokeDasharray="4 3"
              className="animate-[dash_10s_linear_infinite]"
            />
            {/* Static background route line */}
            <path
              d={`M ${pickupCoords.x} ${pickupCoords.y} Q ${(pickupCoords.x + dropCoords.x) / 2} ${(pickupCoords.y + dropCoords.y) / 2 - 10} ${dropCoords.x} ${dropCoords.y}`}
              fill="none"
              stroke="#10B981"
              strokeWidth="2.5"
              strokeLinecap="round"
              opacity="0.3"
            />
          </g>
        )}

        {/* Pickup Pin Marker */}
        {pickupLocation && (
          <g transform={`translate(${pickupCoords.x}, ${pickupCoords.y})`}>
            {/* Ripple Effect */}
            <circle r="6" fill="#10B981" opacity="0.3" className="animate-ping" />
            <circle r="3" fill="#10B981" />
          </g>
        )}

        {/* Destination Pin Marker */}
        {destination && (
          <g transform={`translate(${dropCoords.x}, ${dropCoords.y})`}>
            <circle r="6" fill="#EF4444" opacity="0.3" className="animate-ping" />
            <circle r="3" fill="#EF4444" />
          </g>
        )}

        {/* Driver Marker */}
        {showDriver && (
          <g
            transform={`translate(${driverPos.x}, ${driverPos.y})`}
            className="transition-all duration-1000 ease-out"
          >
            <circle r="8" fill="#0A0A0A" opacity="0.2" className="animate-pulse" />
            <circle r="5" fill="#0A0A0A" />
            {/* Arrow/Navigation representation */}
            <polygon points="-3,-2 0,-7 3,-2 0,-4" fill="#FFFFFF" transform="rotate(45)" />
          </g>
        )}
      </svg>

      {/* Overlay Markers Details cards */}
      <div className="absolute bottom-4 left-4 right-4 flex justify-between pointer-events-none">
        {pickupLocation && (
          <div className="bg-white/90 backdrop-blur-md border border-zinc-100 px-3 py-1.5 rounded-full shadow-sm flex items-center gap-1.5 text-[11px] font-semibold text-zinc-950">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="truncate max-w-[120px]">
              {typeof pickupLocation === "string" ? pickupLocation : "Pickup"}
            </span>
          </div>
        )}
        {destination && (
          <div className="bg-white/90 backdrop-blur-md border border-zinc-100 px-3 py-1.5 rounded-full shadow-sm flex items-center gap-1.5 text-[11px] font-semibold text-zinc-950">
            <div className="w-2 h-2 rounded-full bg-rose-500" />
            <span className="truncate max-w-[120px]">
              {typeof destination === "string" ? destination : "Drop"}
            </span>
          </div>
        )}
      </div>

      {/* Style block for animations */}
      <style>{`
        @keyframes dash {
          to {
            stroke-dashoffset: -40;
          }
        }
      `}</style>
    </div>
  );
}
