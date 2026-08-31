import axios from "axios";
import { calculateFare, FARE_CONFIG } from "../utils/fareCalculator.js";

export const getAutocomplete = async (req, res) => {
  try {
    const { input, lat, lng } = req.query;
    if (!input) {
      return res.status(400).json({
        message: "Input required",
      });
    }

    const response = await axios.post(
      "https://places.googleapis.com/v1/places:autocomplete",
      {
        input: input,
        includedRegionCodes: ["in"],
        locationBias: {
          circle: {
            center: {
              latitude: Number(lat),
              longitude: Number(lng),
            },
            radius: 5000.0,
          },
        },
      },

      {
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": process.env.GOOGLE_API_KEY,
        },
      },
    );

    res.json(response.data.suggestions);
  } catch (error) {
    console.error("Error in getAutocomplete:", error.message);
    res.status(500).json({
      message: "Internal server error during autocomplete request",
      error: error.message,
    });
  }
};

export const getDistance = async (req, res) => {
  try {
    const { start_place_id, end_place_id } = req.query;
    const distance = await axios.post(
      "https://routes.googleapis.com/directions/v2:computeRoutes",
      {
        origin: {
          placeId: start_place_id,
        },

        destination: {
          placeId: end_place_id,
        },
        travelMode: "DRIVE",
      },

      {
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": process.env.GOOGLE_API_KEY,
          "X-Goog-FieldMask":
            "routes.distanceMeters,routes.duration,routes.polyline",
        },
      },
    );

    if (!distance.data.routes || distance.data.routes.length === 0) {
      return res.status(404).json({ message: "No routes found" });
    }

    const distanceKm = distance.data.routes[0].distanceMeters / 1000;
    const duration = distance.data.routes[0].duration.split("s")[0] / 60;
    const polyline = distance.data.routes[0].polyline?.encodedPolyline || "";

    const fares = {};
    for (const key of Object.keys(FARE_CONFIG)) {
      fares[key] = calculateFare(key, distanceKm, duration);
    }

    res.json({ distanceKm, duration, polyline, fares });
  } catch (error) {
    console.error(
      "Error in getDistance:",
      error.response?.data || error.message,
    );
    res.status(500).json({
      message: "Internal server error during route calculation",
      error: error.response?.data || error.message,
    });
  }
};

export const getCoordinates = async (req, res) => {
  try {
    const { place_id } = req.query;
    if (!place_id) {
      return res.status(400).json({ message: "place_id required" });
    }
    const response = await axios.get(
      `https://places.googleapis.com/v1/places/${place_id}`,
      {
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": process.env.GOOGLE_API_KEY,
          "X-Goog-FieldMask": "location",
        },
      },
    );
    res.json(response.data.location);
  } catch (err) {
    console.error(
      "Error while getting coordinates:",
      err.response?.data || err.message,
    );
    res.status(err.response?.status || 500).json({
      message: "Error retrieving coordinates",
      error: err.response?.data || err.message,
    });
  }
};
