import { APIProvider, Map, AdvancedMarker } from "@vis.gl/react-google-maps";
import { useState, useEffect } from "react";

const GMap = ({ driverLocation, pickupLocation, destination }) => {
  const [currentLocation, setCurrentLocation] = useState({
    longitude: null,
    latitude: null,
  });

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentLocation({
            longitude: position.coords.longitude,
            latitude: position.coords.latitude,
          });
        },
        (error) => {
          console.error("Geolocation error:", error);
          // Fallback to default coordinates (e.g., Mumbai, India: 19.0760, 72.8777)
          setCurrentLocation({
            latitude: 19.076,
            longitude: 72.8777,
          });
        },
      );
    } else {
      console.warn("Geolocation not supported by this browser.");
      // Fallback
      setCurrentLocation({
        latitude: 19.076,
        longitude: 72.8777,
      });
    }
  }, []);

  const getGoogleCoords = (loc) => {
    if (!loc) return null;
    if (Array.isArray(loc) && loc.length === 2) {
      return { lng: loc[0], lat: loc[1] };
    }
    const lat = loc.lat ?? loc.latitude;
    const lng = loc.lng ?? loc.longitude;
    if (lat !== undefined && lng !== undefined) {
      return { lat, lng };
    }
    if (loc.coordinates) {
      return getGoogleCoords(loc.coordinates);
    }
    return null;
  };

  const driverCoords = getGoogleCoords(driverLocation);
  const pickupCoords = getGoogleCoords(pickupLocation);
  const dropCoords = getGoogleCoords(destination);

  // Determine central point to focus the map
  const mapCenter =
    driverCoords ||
    pickupCoords ||
    (currentLocation.latitude !== null
      ? { lat: currentLocation.latitude, lng: currentLocation.longitude }
      : null);

  return (
    <APIProvider apiKey={"AIzaSyAcxNN3SElOML5iv50Aoh37_27Elgxg-mY"}>
      {mapCenter ? (
        <Map
          style={{
            width: "100%",
            height: "100%",
            borderRadius: "24px",
            minHeight: "350px",
          }}
          defaultZoom={13}
          center={mapCenter}
          mapId="DEMO_MAP_ID"
        >
          {currentLocation.latitude !== null &&
            currentLocation.longitude !== null && (
              <AdvancedMarker
                position={{
                  lat: currentLocation.latitude,
                  lng: currentLocation.longitude,
                }}
                title="Current Location"
              >
                <div
                  style={{
                    width: "18px",
                    height: "18px",
                    backgroundColor: "#307af1ff",
                    border: "3px solid white",
                    borderRadius: "50%",
                    boxShadow: "0 1px 4px rgba(0,0,0,0.4)",
                  }}
                />
              </AdvancedMarker>
            )}
          {driverCoords && (
            <AdvancedMarker position={driverCoords} title="Driver's Location">
              <div
                style={{
                  width: "18px",
                  height: "18px",
                  backgroundColor: "#34A853",
                  border: "3px solid white",
                  borderRadius: "50%",
                  boxShadow: "0 2px 6px rgba(0,0,0,0.3)",
                }}
              />
            </AdvancedMarker>
          )}

          {pickupCoords && (
            <AdvancedMarker position={pickupCoords} title="Pickup Location">
              <div
                style={{
                  width: "18px",
                  height: "18px",
                  backgroundColor: "#FBBC04",
                  border: "3px solid white",
                  borderRadius: "50%",
                  boxShadow: "0 2px 6px rgba(0,0,0,0.3)",
                }}
              />
            </AdvancedMarker>
          )}

          {dropCoords && (
            <AdvancedMarker position={dropCoords} title="Destination">
              <div
                style={{
                  width: "18px",
                  height: "18px",
                  backgroundColor: "#EA4335",
                  border: "3px solid white",
                  borderRadius: "50%",
                  boxShadow: "0 2px 6px rgba(0,0,0,0.3)",
                }}
              />
            </AdvancedMarker>
          )}
        </Map>
      ) : (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "100%",
            minHeight: "350px",
            fontFamily: "sans-serif",
            backgroundColor: "#F4F4F5",
            borderRadius: "24px",
          }}
        >
          Loading Map...
        </div>
      )}
    </APIProvider>
  );
};
export default GMap;
