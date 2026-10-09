# 🚗 Real-Time Ride-Sharing Platform

A full-stack ride-sharing platform built with the MERN stack, featuring real-time driver location tracking, live messaging, location-based driver discovery, and concurrency-safe ride acceptance. The system combines Socket.IO, Redis, MongoDB, and Google Maps APIs to support responsive, location-aware ride coordination.

## ✨ Key Features

- **Real-Time Location Tracking:** Uses Socket.IO to transmit live location updates between clients and the backend.
- **Nearby Driver Discovery:** Identifies available drivers within a 5 km radius of a ride request.
- **Atomic Ride Acceptance:** Uses Redis atomic locking to prevent multiple drivers from successfully accepting the same ride concurrently.
- **Live Messaging:** Supports real-time communication using Socket.IO.
- **Location Autocomplete:** Integrates the Google Places API to provide pickup and destination suggestions.
- **Distance and Fare Calculation:** Integrates Google Maps APIs to obtain route distance and calculate ride fares.
- **Map Integration:** Uses Google Maps for location-based interactions and map visualization.
- **Global State Management:** Uses Redux to maintain location-related state across frontend components.
- **Location Caching:** Caches frequently updated location data in Redis for low-latency access.
- **Persistent Location Storage:** Stores the latest driver locations in MongoDB for persistent retrieval.

## 🛠️ Tech Stack

| Technology | Application |
|---|---|
| React.js | Frontend user interface |
| Node.js | Backend runtime |
| Express.js | REST API and server-side request handling |
| MongoDB | Persistent application and location data |
| Socket.IO | Real-time location updates and messaging |
| Redux | Global frontend location state |
| Redis | Location caching and atomic ride-acceptance locking |
| Google Places API | Pickup and destination autocomplete |
| Google Maps | Map-based location visualization |

## 🏗️ System Design

### 1. Location-Based Driver Discovery

When a rider requests a ride, the system searches for available drivers within a 5 km radius.

The discovery process helps narrow down potential drivers based on their proximity to the pickup location before they attempt to accept the ride.

### 2. Real-Time Location Management

The platform separates frequently changing location data from persistent storage.

1. Driver location updates are transmitted through Socket.IO.
2. Redis caches frequently updated location data for fast access.
3. MongoDB stores the latest location persistently.
4. Redux maintains location-related state on the frontend.

This architecture separates real-time communication, caching, persistent storage, and frontend state management.

### 3. Concurrency-Safe Ride Acceptance

When a ride request is available to multiple nearby drivers, several drivers may attempt to accept it simultaneously. This creates a race condition that can lead to duplicate ride assignments if requests are handled without coordination.

**Solution: Redis atomic locking**

The backend uses an atomic Redis lock to coordinate competing ride-acceptance requests.

- Multiple drivers can attempt to accept the same ride.
- The first successful atomic lock acquisition gains the right to proceed with acceptance.
- Competing requests cannot acquire the same lock while it is held.
- The backend validates and updates the ride state before finalizing the assignment.

This approach helps ensure that a ride is assigned to only one driver, provided the lock lifecycle, failure handling, and persistent ride-state updates are implemented correctly.

## 🔮 Future Scope

### Shared Rides Through Route-Based Matching

Extend the platform to support multiple riders sharing a ride when their journeys are compatible with an existing driver's route.

The proposed functionality includes:

- **Route Compatibility:** Match new ride requests with existing rides based on pickup and destination locations relative to the current route.
- **Dynamic Ride Pooling:** Allow additional riders to join a ride already in progress or scheduled, subject to route and operational constraints.
- **Detour Optimization:** Minimize additional travel distance and time when accommodating multiple riders.
- **Capacity-Aware Matching:** Consider available seats and passenger requirements before adding a rider.
- **Efficient Matching Algorithms:** Evaluate route overlap, pickup and drop-off order, and estimated detour costs to identify suitable shared rides.

The objective is to improve vehicle utilization, reduce individual travel costs, and make ride-sharing more efficient.

## 🎯 Engineering Highlights

- Implemented real-time communication using Socket.IO.
- Designed a Redis caching strategy for frequently updated location data.
- Applied atomic locking to address concurrent ride-acceptance requests.
- Integrated proximity-based driver discovery within a 5 km radius.
- Managed shared frontend location state using Redux.
- Integrated Google Places autocomplete and Google Maps.
- Identified route-based ride pooling as an extension for improving vehicle utilization.

