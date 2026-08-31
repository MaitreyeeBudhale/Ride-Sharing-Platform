import React, { useState, useEffect, useRef } from "react";
import { useOutletContext, useNavigate } from "react-router-dom";
import {
  Box,
  Stack,
  Typography,
  Card,
  CardContent,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Avatar,
  IconButton,
  Divider,
  Snackbar,
  CircularProgress,
  Switch,
  Menu,
  MenuItem,
  Container,
  Grid,
} from "@mui/material";
import {
  CarFront,
  Bell,
  UserCircle,
  Circle,
  CheckCircle,
  IndianRupee,
  Star,
  MapPin,
  Navigation,
  Users,
  Clock3,
  Check,
  X,
  CircleHelp,
  Lightbulb,
  ArrowDown,
} from "lucide-react";
import NavBar from "../components/NavBar";
import socket from "../sockets/socket";
import {
  setDriverOnline,
  setDriverOffline,
  emitDriverLocation,
  subscribeToRideRequests,
} from "../sockets/driver.socket";
import api from "../api/api";
import * as driverService from "../services/driverService";

export default function DriverDashboard() {
  const { user, setUser } = useOutletContext();
  const navigate = useNavigate();

  // Redirect rider to rider dashboard if they access driver page
  useEffect(() => {
    if (user?.role === "Rider") {
      navigate("/dashboard", { replace: true });
    }
  }, [user, navigate]);

  // Socket & online logic states
  const [online, setOnline] = useState(false);
  const [driverProfile, setDriverProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [coordinates, setCoordinates] = useState({ lat: null, lng: null });

  // UI state management
  const [rideRequests, setRideRequests] = useState([]);
  const [completedRides, setCompletedRides] = useState([]);
  const [stats, setStats] = useState({
    completedRidesCount: 0,
    earnings: 0,
    rating: 4.8,
  });
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [requestModalOpen, setRequestModalOpen] = useState(false);
  const [acceptingRide, setAcceptingRide] = useState(false);
  const [timeLeft, setTimeLeft] = useState(120);

  useEffect(() => {
    let timer;
    if (requestModalOpen) {
      setTimeLeft(120);
      timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            handleCloseRequestModal();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      setTimeLeft(120);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [requestModalOpen]);

  // Menu states
  const [anchorEl, setAnchorEl] = useState(null);
  const profileMenuOpen = Boolean(anchorEl);

  // Snackbar notification state
  const [snackbar, setSnackbar] = useState({ open: false, message: "" });

  // Location simulation refs
  const locationRef = useRef({ lng: null, lat: null }); // Default Bangalore coordinates
  const intervalRef = useRef(null);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        const coords = {
          lng: position.coords.longitude,
          lat: position.coords.latitude,
        };
        locationRef.current = coords;
        setCoordinates(coords);
      });
    }
  }, []);
  // Setup sockets and check active ride
  useEffect(() => {
    socket.connect();

    // Fetch driver profile
    const fetchProfile = async () => {
      try {
        const response = await api.get("/driver/profile");
        if (response.data.success) {
          const profile = response.data.driver;
          setDriverProfile(profile);
          if (profile.isAvailable) {
            setOnline(true);
            setDriverOnline(profile._id);
          }
        }
      } catch (err) {
        console.error("Error fetching driver profile:", err);
      }
    };
    fetchProfile();

    // Check if there is an active accepted ride to resume
    const checkActiveRide = async () => {
      try {
        const response = await api.get("/rides/history");
        if (response.data.success && response.data.rides.length > 0) {
          const latest = response.data.rides[0];
          if (latest.status === "accepted") {
            navigate(`/driver/ride/${latest._id}`);
          }
        }
      } catch (err) {
        console.error("Error checking driver active rides:", err);
      }
    };
    checkActiveRide();

    // Fetch initial service data
    const fetchDashboardData = async () => {
      try {
        console.log("fetch dashboard data");
        const history = await driverService.getCompletedRides();
        setCompletedRides(history);
        console.log(history);
        setStats({ completedRidesCount: history.length });
      } catch (err) {
        console.error("Error loading dashboard data:", err);
      }
    };
    fetchDashboardData();

    // Listeners for live ride requests via socket
    const unsubscribe = subscribeToRideRequests((request) => {
      console.log("Received new ride request via socket:", request);
      // Play notification vibration
      if (navigator.vibrate) navigator.vibrate(200);

      // Add to local requests list dynamically
      const formattedRequest = {
        id: `req_${Date.now()}`,
        rideId: request.rideId,
        userId: request.userId,
        riderName: request.riderName || "Rider",
        riderRating: request.riderRating || 4.7,
        riderTrips: request.riderTrips || 3,
        pickup: request.pickup || "Current Location",
        pickupAddress: request.pickupAddress || "",
        destination: request.destination || "Destination",
        destinationAddress: request.destinationAddress || "",
        distance: request.distance || "2.0 km",
        duration: request.duration || "10 min",
        passengers: request.passengers || 1,
        fare: request.fare || 100,
        timeAgo: "Just now",
      };

      setRideRequests((prev) => [formattedRequest, ...prev]);
    });

    return () => {
      unsubscribe();
      stopLocationUpdates();
      socket.disconnect();
    };
  }, [navigate]);

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

  const fetchPendingRides = async () => {
    if (locationRef.current.lat === null || locationRef.current.lng === null)
      return;
    try {
      const response = await api.get(
        `/rides/pending?lat=${locationRef.current.lat}&lng=${locationRef.current.lng}`,
      );
      if (response.data.success) {
        const formatted = response.data.rides.map((ride) => ({
          id: `req_${ride._id}`,
          rideId: ride._id,
          userId: ride.userId?._id,
          riderName: ride.userId?.fullName || "Rider",
          riderRating: ride.userId?.rating || 4.7,
          riderTrips: 3,
          pickup: ride.start || "Current Location",
          pickupAddress: ride.start || "",
          destination: ride.destination || "Destination",
          destinationAddress: ride.destination || "",
          distance: `${ride.distance} km`,
          duration: "10 min",
          passengers: 1,
          fare: ride.fare || 100,
          timeAgo: "Active",
        }));
        setRideRequests(formatted);
      }
    } catch (err) {
      console.error("Error fetching pending rides:", err);
    }
  };

  useEffect(() => {
    if (online && coordinates.lat !== null && coordinates.lng !== null) {
      startLocationUpdates();
      fetchPendingRides();
    } else {
      stopLocationUpdates();
    }
    return () => stopLocationUpdates();
  }, [online, coordinates]);

  const urlBase64ToUint8Array = (base64String) => {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
      .replace(/\-/g, "+")
      .replace(/_/g, "/");

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  };

  const subscribeToPushNotifications = async () => {
    try {
      if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
        console.warn("Push messaging is not supported in this browser");
        return;
      }

      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        console.warn("Notification permission was not granted");
        return;
      }

      const registration = await navigator.serviceWorker.ready;

      // Get VAPID public key from backend
      const keyResponse = await api.get("/push/vapid-public-key");
      const publicKey = keyResponse.data.publicKey;

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });

      // Send subscription to backend
      await api.post("/push/subscribe", { subscription });
      console.log("Push subscription registered successfully on backend");
    } catch (err) {
      console.error("Failed to subscribe to push notifications:", err);
    }
  };

  const handleToggleOnline = async () => {
    setLoading(true);
    try {
      if (!online) {
        let currentDriver = driverProfile;
        if (!currentDriver) {
          const response = await api.get("/driver/profile");
          if (response.data.success) {
            currentDriver = response.data.driver;
            setDriverProfile(currentDriver);
          }
        }

        if (!currentDriver) {
          throw new Error("Driver profile not found");
        }

        setDriverOnline(currentDriver._id);
        setOnline(true);
        startLocationUpdates();
        showSnackbar("You are now Online");
        subscribeToPushNotifications();
      } else {
        // Go offline
        setDriverOffline();
        stopLocationUpdates();
        setOnline(false);
        showSnackbar("You are now Offline");
      }
    } catch (err) {
      console.error("Failed to update online status:", err);
      showSnackbar(
        "Error setting status. Make sure vehicle details are added.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleOpenRequest = async (request) => {
    try {
      console.log("Requesting to view ride:", request.rideId);
      const res = await api.post(`/rides/claim/${request.rideId}`);
      console.log("Ride claim response:", res.data);

      if (res.data.busy) {
        showSnackbar("Ride is already being viewed by another driver");
        return;
      }
      setSelectedRequest(request);
      setRequestModalOpen(true);
    } catch (err) {
      console.error("Failed to claim ride:", err);
      showSnackbar("Error claiming ride. Please try again.");
    }
  };

  const handleReleaseRide = async () => {
    try {
      const res = await api.delete(`/rides/release/${selectedRequest?.rideId}`);
      console.log("Ride released successfully");
    } catch (err) {
      console.error("Error releasing ride:", err);
    }
  };

  const handleCloseRequestModal = () => {
    handleReleaseRide();
    setRequestModalOpen(false);
    setSelectedRequest(null);
  };

  const handleAcceptRideRequest = async () => {
    if (!selectedRequest) return;
    setAcceptingRide(true);
    try {
      // Call standard dashboard accept
      await driverService.acceptRide(selectedRequest.rideId);

      // Emit accept via socket
      socket.emit("accept-ride", {
        rideId: selectedRequest.rideId,
        riderId: selectedRequest.userId,
        driverId: driverProfile?._id || user?._id,
      });

      showSnackbar("Ride accepted!");
      handleCloseRequestModal();

      // Update UI lists
      setRideRequests((prev) =>
        prev.filter((r) => r.rideId !== selectedRequest.rideId),
      );

      // Navigate to active ride route view
      navigate(`/driver/ride/${selectedRequest.rideId}`);
    } catch (err) {
      console.error("Failed to accept ride:", err);
      showSnackbar("Error accepting ride. Please try again.");
    } finally {
      setAcceptingRide(false);
    }
  };

  const handleRejectRideRequest = async () => {
    if (!selectedRequest) return;
    try {
      await driverService.rejectRide(selectedRequest.rideId);

      socket.emit("reject-ride", {
        rideId: selectedRequest.rideId,
        riderId: selectedRequest.userId,
        driverId: driverProfile?._id || user?._id,
      });

      showSnackbar("Ride request rejected");
      handleCloseRequestModal();
      setRideRequests((prev) =>
        prev.filter((r) => r.rideId !== selectedRequest.rideId),
      );
    } catch (err) {
      console.error("Failed to reject ride:", err);
      showSnackbar("Error rejecting ride.");
    }
  };

  const showSnackbar = (message) => {
    setSnackbar({ open: true, message });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    handleMenuClose();
    // Redirect or call logout
    navigate("/login");
  };

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#F8FAFC", pb: 6 }}>
      <NavBar user={user} setUser={setUser} />

      <Container maxWidth="lg" sx={{ mt: 4 }}>
        {/* Compact Header */}
        <Card
          elevation={0}
          sx={{ border: "1px solid #E2E8F0", borderRadius: "18px", mb: 3 }}
        >
          <CardContent sx={{ py: "16px !important", px: 3 }}>
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center"
            >
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 800,
                  color: "#0F172A",
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                }}
              >
                <CarFront size={22} className="text-zinc-900" />
                Driver Dashboard
              </Typography>
              <Stack direction="row" alignItems="center" spacing={2.5}>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Chip
                    icon={
                      <Circle
                        size={10}
                        fill={online ? "#10B981" : "#64748B"}
                        color={online ? "#10B981" : "#64748B"}
                      />
                    }
                    label={online ? "Online" : "Offline"}
                    variant="outlined"
                    sx={{
                      fontWeight: 600,
                      borderColor: online ? "#A7F3D0" : "#E2E8F0",
                      bgcolor: online ? "#ECFDF5" : "transparent",
                      color: online ? "#047857" : "#64748B",
                      "& .MuiChip-icon": { marginLeft: "8px" },
                    }}
                  />
                  <Switch
                    checked={online}
                    onChange={handleToggleOnline}
                    disabled={loading}
                    size="small"
                    color="success"
                  />
                </Stack>

                <IconButton sx={{ border: "1px solid #E2E8F0" }}>
                  <Bell size={18} />
                </IconButton>

                <IconButton onClick={handleMenuOpen} sx={{ p: 0 }}>
                  <Avatar sx={{ width: 36, height: 36, bgcolor: "#0F172A" }}>
                    <UserCircle size={24} />
                  </Avatar>
                </IconButton>

                <Menu
                  anchorEl={anchorEl}
                  open={profileMenuOpen}
                  onClose={handleMenuClose}
                  elevation={2}
                  PaperProps={{
                    sx: {
                      borderRadius: "12px",
                      mt: 1,
                      minWidth: 150,
                      border: "1px solid #F1F5F9",
                    },
                  }}
                >
                  <MenuItem onClick={handleMenuClose}>Profile</MenuItem>
                  <MenuItem onClick={handleMenuClose}>Vehicle Details</MenuItem>
                  <MenuItem onClick={handleMenuClose}>Settings</MenuItem>
                  <Divider sx={{ my: 1 }} />
                  <MenuItem onClick={handleLogout} sx={{ color: "#EF4444" }}>
                    Logout
                  </MenuItem>
                </Menu>
              </Stack>
            </Stack>
          </CardContent>
        </Card>

        {/* Welcome Section */}
        <Box sx={{ mb: 4, px: 1 }}>
          <Typography
            variant="h4"
            sx={{ fontWeight: 800, color: "#0F172A", mb: 0.5 }}
          >
            Good evening, {user?.fullName?.split(" ")[0] || "Rahul"} 👋
          </Typography>
          <Typography
            variant="body1"
            sx={{ color: "#64748B", fontWeight: 500 }}
          >
            {online
              ? "You're currently online and can receive ride requests."
              : "You're offline. Go online to receive ride requests."}
          </Typography>
        </Box>

        {/* Today's Overview Metrics */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={4}>
            <Card
              elevation={0}
              sx={{
                border: "1px solid #E2E8F0",
                borderRadius: "18px",
                transition: "transform 0.2s",
                "&:hover": { transform: "translateY(-2px)" },
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                >
                  <Box>
                    <Typography
                      variant="h4"
                      sx={{ fontWeight: 800, color: "#0F172A", mb: 0.5 }}
                    >
                      {stats.completedRidesCount}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{ fontWeight: 600, color: "#64748B" }}
                    >
                      Completed Rides
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      p: 1.5,
                      bgcolor: "#ECFDF5",
                      borderRadius: "12px",
                      color: "#10B981",
                    }}
                  >
                    <CheckCircle size={24} />
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={4}>
            <Card
              elevation={0}
              sx={{
                border: "1px solid #E2E8F0",
                borderRadius: "18px",
                transition: "transform 0.2s",
                "&:hover": { transform: "translateY(-2px)" },
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                >
                  <Box>
                    <Typography
                      variant="h4"
                      sx={{ fontWeight: 800, color: "#0F172A", mb: 0.5 }}
                    >
                      ₹{stats.earnings ? stats.earnings.toLocaleString() : 0}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{ fontWeight: 600, color: "#64748B" }}
                    >
                      Today's Earnings
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      p: 1.5,
                      bgcolor: "#EFF6FF",
                      borderRadius: "12px",
                      color: "#3B82F6",
                    }}
                  >
                    <IndianRupee size={24} />
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={4}>
            <Card
              elevation={0}
              sx={{
                border: "1px solid #E2E8F0",
                borderRadius: "18px",
                transition: "transform 0.2s",
                "&:hover": { transform: "translateY(-2px)" },
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                >
                  <Box>
                    <Typography
                      variant="h4"
                      sx={{ fontWeight: 800, color: "#0F172A", mb: 0.5 }}
                    >
                      {stats.rating ? stats.rating : 0} ★
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{ fontWeight: 600, color: "#64748B" }}
                    >
                      Rating
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      p: 1.5,
                      bgcolor: "#FFFBEB",
                      borderRadius: "12px",
                      color: "#F59E0B",
                    }}
                  >
                    <Star size={24} fill="#F59E0B" />
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Ride Requests & Completed History Sections */}
        <Grid container spacing={4}>
          {/* Left/Main Column: Ride Requests */}
          <Grid item xs={12} md={7}>
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center"
              sx={{ mb: 2 }}
            >
              <Typography
                variant="h6"
                sx={{ fontWeight: 800, color: "#0F172A" }}
              >
                Ride Requests
              </Typography>
              <Chip
                label={`${rideRequests.length} pending`}
                size="small"
                sx={{
                  bgcolor: "#EFF6FF",
                  color: "#2563EB",
                  fontWeight: 700,
                  borderRadius: "6px",
                }}
              />
            </Stack>

            {rideRequests.length === 0 ? (
              <Card
                elevation={0}
                sx={{
                  border: "1px dashed #CBD5E1",
                  borderRadius: "18px",
                  py: 6,
                  bgcolor: "transparent",
                }}
              >
                <CardContent sx={{ textAlign: "center" }}>
                  <CarFront
                    size={40}
                    className="text-slate-400"
                    style={{ margin: "0 auto 12px" }}
                  />
                  <Typography
                    variant="h6"
                    sx={{ fontWeight: 700, color: "#475569", mb: 1 }}
                  >
                    No ride requests right now
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{ color: "#64748B", maxWidth: "260px", mx: "auto" }}
                  >
                    Stay online and we'll notify you when a nearby rider
                    requests a ride.
                  </Typography>
                </CardContent>
              </Card>
            ) : (
              <Stack spacing={2}>
                {rideRequests.map((req) => (
                  <Card
                    key={req.id}
                    elevation={0}
                    onClick={() => handleOpenRequest(req)}
                    sx={{
                      border: "1px solid #E2E8F0",
                      borderRadius: "18px",
                      cursor: "pointer",
                      transition: "all 0.2s",
                      "&:hover": {
                        transform: "translateY(-2px)",
                        boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.05)",
                        borderColor: "#CBD5E1",
                      },
                    }}
                  >
                    <CardContent sx={{ p: 2.5 }}>
                      <Stack
                        direction="row"
                        justifyContent="space-between"
                        alignItems="center"
                        sx={{ mb: 2 }}
                      >
                        <Typography
                          variant="subtitle2"
                          sx={{
                            fontWeight: 800,
                            color: "#1E293B",
                            display: "flex",
                            alignItems: "center",
                            gap: 1,
                          }}
                        >
                          <Circle size={8} fill="#3B82F6" color="#3B82F6" />
                          New Ride Request
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{ color: "#64748B", fontWeight: 600 }}
                        >
                          {req.timeAgo}
                        </Typography>
                      </Stack>

                      <Stack spacing={1.5} sx={{ mb: 2.5 }}>
                        <Stack
                          direction="row"
                          alignItems="center"
                          spacing={1.5}
                        >
                          <MapPin
                            size={16}
                            className="text-emerald-600 shrink-0"
                          />
                          <Typography
                            variant="body2"
                            sx={{ fontWeight: 700, color: "#334155" }}
                          >
                            {req.pickup}
                          </Typography>
                        </Stack>
                        <Box
                          sx={{
                            borderLeft: "2px dashed #CBD5E1",
                            height: "16px",
                            ml: "7px",
                          }}
                        />
                        <Stack
                          direction="row"
                          alignItems="center"
                          spacing={1.5}
                        >
                          <MapPin
                            size={16}
                            className="text-rose-600 shrink-0"
                          />
                          <Typography
                            variant="body2"
                            sx={{ fontWeight: 700, color: "#334155" }}
                          >
                            {req.destination}
                          </Typography>
                        </Stack>
                      </Stack>

                      <Divider sx={{ mb: 2 }} />

                      <Stack
                        direction="row"
                        justifyContent="space-between"
                        alignItems="center"
                      >
                        <Stack direction="row" spacing={3}>
                          <Stack
                            direction="row"
                            alignItems="center"
                            spacing={0.5}
                          >
                            <Navigation size={14} className="text-slate-500" />
                            <Typography
                              variant="caption"
                              sx={{ color: "#64748B", fontWeight: 600 }}
                            >
                              {req.distance}
                            </Typography>
                          </Stack>
                          <Stack
                            direction="row"
                            alignItems="center"
                            spacing={0.5}
                          >
                            <Users size={14} className="text-slate-500" />
                            <Typography
                              variant="caption"
                              sx={{ color: "#64748B", fontWeight: 600 }}
                            >
                              {req.passengers} passengers
                            </Typography>
                          </Stack>
                        </Stack>
                        <Typography
                          variant="subtitle1"
                          sx={{ fontWeight: 800, color: "#0F172A" }}
                        >
                          ₹{req.fare}
                        </Typography>
                      </Stack>
                    </CardContent>
                  </Card>
                ))}
              </Stack>
            )}
          </Grid>

          {/* Right Column: History & Tips */}
          <Grid item xs={12} md={5}>
            <Typography
              variant="h6"
              sx={{ fontWeight: 800, color: "#0F172A", mb: 2 }}
            >
              Completed Ride History
            </Typography>

            {completedRides.length === 0 ? (
              <Card
                elevation={0}
                sx={{
                  border: "1px dashed #CBD5E1",
                  borderRadius: "18px",
                  py: 4,
                  mb: 3,
                }}
              >
                <CardContent sx={{ textAlign: "center" }}>
                  <Typography
                    variant="subtitle2"
                    sx={{ fontWeight: 700, color: "#64748B" }}
                  >
                    No completed rides yet
                  </Typography>
                  <Typography variant="caption" sx={{ color: "#94A3B8" }}>
                    Your completed rides will appear here.
                  </Typography>
                </CardContent>
              </Card>
            ) : (
              <Stack spacing={2} sx={{ mb: 3 }}>
                {completedRides.map((ride) => (
                  <Card
                    key={ride.id}
                    elevation={0}
                    sx={{ border: "1px solid #E2E8F0", borderRadius: "14px" }}
                  >
                    <CardContent sx={{ p: 2 }}>
                      <Stack
                        direction="row"
                        spacing={1}
                        alignItems="flex-start"
                        sx={{ mb: 1.5 }}
                      >
                        <MapPin
                          size={14}
                          className="text-slate-400 shrink-0 mt-0.5"
                        />
                        <Typography
                          variant="body2"
                          sx={{ fontWeight: 700, color: "#334155" }}
                        >
                          {ride.pickup} → {ride.destination}
                        </Typography>
                      </Stack>
                      <Stack
                        direction="row"
                        justifyContent="space-between"
                        alignItems="center"
                      >
                        <Typography
                          variant="caption"
                          sx={{ color: "#94A3B8", fontWeight: 600 }}
                        >
                          {ride.date} • {ride.time} • {ride.distance}
                        </Typography>
                        <Typography
                          variant="subtitle2"
                          sx={{ fontWeight: 800, color: "#10B981" }}
                        >
                          ₹{ride.fare}
                        </Typography>
                      </Stack>
                    </CardContent>
                  </Card>
                ))}
              </Stack>
            )}

            {/* Tips & Support */}
            <Card
              elevation={0}
              sx={{
                border: "1px solid #F1F5F9",
                borderRadius: "14px",
                bgcolor: "#FFFBEB",
                mb: 2,
              }}
            >
              <CardContent sx={{ p: 2 }}>
                <Stack direction="row" spacing={1.5}>
                  <Lightbulb
                    size={20}
                    className="text-amber-500 shrink-0 mt-0.5"
                  />
                  <Typography
                    variant="body2"
                    sx={{ color: "#78350F", fontWeight: 550, lineHeight: 1.4 }}
                  >
                    Keep your location updated to receive nearby ride requests
                    faster.
                  </Typography>
                </Stack>
              </CardContent>
            </Card>

            <Button
              variant="text"
              color="inherit"
              fullWidth
              startIcon={<CircleHelp size={16} />}
              sx={{
                justifyContent: "flex-start",
                color: "#64748B",
                fontWeight: 700,
                textTransform: "none",
                borderRadius: "10px",
                py: 1,
                px: 1.5,
                "&:hover": { bgcolor: "#F1F5F9" },
              }}
            >
              Need Help? Contact Driver Support →
            </Button>
          </Grid>
        </Grid>
      </Container>

      {/* Ride Request Detailed Modal */}
      <Dialog
        open={requestModalOpen}
        onClose={handleCloseRequestModal}
        fullWidth
        maxWidth="xs"
        PaperProps={{
          sx: { borderRadius: "18px", p: 1 },
        }}
      >
        {selectedRequest && (
          <>
            <DialogTitle
              sx={{
                fontWeight: 850,
                pb: 1,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Stack direction="row" alignItems="center" spacing={1}>
                <span>Ride Request</span>
                <Chip
                  icon={<Clock3 size={14} style={{ color: "#E11D48" }} />}
                  label={`${Math.floor(timeLeft / 60)}:${(timeLeft % 60).toString().padStart(2, "0")}`}
                  size="small"
                  sx={{
                    fontWeight: 700,
                    bgcolor: "#FFE4E6",
                    color: "#E11D48",
                    borderColor: "#FDA4AF",
                  }}
                  variant="outlined"
                />
              </Stack>
              <Chip
                label="New Request"
                size="small"
                color="primary"
                sx={{ fontWeight: 700 }}
              />
            </DialogTitle>

            <DialogContent sx={{ pt: "8px !important" }}>
              {/* Route */}
              <Stack spacing={1.5} sx={{ mb: 3 }}>
                <Box>
                  <Typography
                    variant="caption"
                    sx={{
                      color: "#94A3B8",
                      fontWeight: 700,
                      textTransform: "uppercase",
                    }}
                  >
                    Pickup
                  </Typography>
                  <Stack direction="row" spacing={1} sx={{ mt: 0.5 }}>
                    <MapPin
                      size={16}
                      className="text-emerald-600 shrink-0 mt-0.5"
                    />
                    <Box>
                      <Typography
                        variant="body2"
                        sx={{ fontWeight: 800, color: "#1E293B" }}
                      >
                        {selectedRequest.pickup}
                      </Typography>
                      <Typography variant="caption" sx={{ color: "#64748B" }}>
                        {selectedRequest.pickupAddress}
                      </Typography>
                    </Box>
                  </Stack>
                </Box>

                <Box
                  sx={{ display: "flex", justifyContent: "flex-start", pl: 1 }}
                >
                  <ArrowDown size={16} className="text-slate-300" />
                </Box>

                <Box>
                  <Typography
                    variant="caption"
                    sx={{
                      color: "#94A3B8",
                      fontWeight: 700,
                      textTransform: "uppercase",
                    }}
                  >
                    Destination
                  </Typography>
                  <Stack direction="row" spacing={1} sx={{ mt: 0.5 }}>
                    <MapPin
                      size={16}
                      className="text-rose-600 shrink-0 mt-0.5"
                    />
                    <Box>
                      <Typography
                        variant="body2"
                        sx={{ fontWeight: 800, color: "#1E293B" }}
                      >
                        {selectedRequest.destination}
                      </Typography>
                      <Typography variant="caption" sx={{ color: "#64748B" }}>
                        {selectedRequest.destinationAddress}
                      </Typography>
                    </Box>
                  </Stack>
                </Box>
              </Stack>

              <Divider sx={{ mb: 3 }} />

              {/* Ride info details */}
              <Stack spacing={1.5} sx={{ mb: 3 }}>
                <Stack direction="row" justifyContent="space-between">
                  <Typography
                    variant="body2"
                    sx={{ color: "#64748B", fontWeight: 600 }}
                  >
                    Distance
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{ color: "#0F172A", fontWeight: 750 }}
                  >
                    {selectedRequest.distance}
                  </Typography>
                </Stack>
                <Stack direction="row" justifyContent="space-between">
                  <Typography
                    variant="body2"
                    sx={{ color: "#64748B", fontWeight: 600 }}
                  >
                    Estimated Time
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{ color: "#0F172A", fontWeight: 750 }}
                  >
                    {selectedRequest.duration}
                  </Typography>
                </Stack>
                <Stack direction="row" justifyContent="space-between">
                  <Typography
                    variant="body2"
                    sx={{ color: "#64748B", fontWeight: 600 }}
                  >
                    Passengers
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{ color: "#0F172A", fontWeight: 750 }}
                  >
                    {selectedRequest.passengers}
                  </Typography>
                </Stack>
                <Stack direction="row" justifyContent="space-between">
                  <Typography
                    variant="body2"
                    sx={{ color: "#64748B", fontWeight: 600 }}
                  >
                    Fare
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{ color: "#0F172A", fontWeight: 800 }}
                  >
                    ₹{selectedRequest.fare}
                  </Typography>
                </Stack>
              </Stack>

              <Divider sx={{ mb: 3 }} />

              {/* Rider details */}
              <Box>
                <Typography
                  variant="caption"
                  sx={{
                    color: "#94A3B8",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    display: "block",
                    mb: 1,
                  }}
                >
                  Rider
                </Typography>
                <Stack direction="row" spacing={2} alignItems="center">
                  <Avatar sx={{ width: 40, height: 40, bgcolor: "#3B82F6" }}>
                    {selectedRequest.riderName.charAt(0)}
                  </Avatar>
                  <Box>
                    <Typography
                      variant="body2"
                      sx={{ fontWeight: 800, color: "#1E293B" }}
                    >
                      {selectedRequest.riderName}
                    </Typography>
                    <Stack
                      direction="row"
                      spacing={1.5}
                      alignItems="center"
                      sx={{ mt: 0.5 }}
                    >
                      <Stack direction="row" spacing={0.5} alignItems="center">
                        <Star size={12} fill="#F59E0B" color="#F59E0B" />
                        <Typography
                          variant="caption"
                          sx={{ color: "#475569", fontWeight: 700 }}
                        >
                          {selectedRequest.riderRating}
                        </Typography>
                      </Stack>
                      <Typography variant="caption" sx={{ color: "#64748B" }}>
                        • {selectedRequest.riderTrips} previous rides
                      </Typography>
                    </Stack>
                  </Box>
                </Stack>
              </Box>
            </DialogContent>

            <DialogActions
              sx={{
                px: 3,
                pb: 2,
                pt: 1,
                display: "flex",
                flexDirection: "column",
                gap: 1,
              }}
            >
              <Button
                variant="contained"
                color="primary"
                fullWidth
                disabled={acceptingRide}
                startIcon={
                  acceptingRide ? (
                    <CircularProgress size={16} color="inherit" />
                  ) : (
                    <Check size={18} />
                  )
                }
                onClick={handleAcceptRideRequest}
                sx={{
                  borderRadius: "10px",
                  py: 1.2,
                  fontWeight: 750,
                  textTransform: "none",
                }}
              >
                Accept Ride
              </Button>
              <Button
                variant="outlined"
                color="inherit"
                fullWidth
                disabled={acceptingRide}
                startIcon={<X size={18} />}
                onClick={handleRejectRideRequest}
                sx={{
                  borderRadius: "10px",
                  py: 1.2,
                  fontWeight: 750,
                  textTransform: "none",
                  borderColor: "#CBD5E1",
                }}
              >
                Reject
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Toast Notification */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={handleCloseSnackbar}
        message={snackbar.message}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      />
    </Box>
  );
}
