import { Routes, Route } from "react-router-dom";
import LoginPage from "../pages/LoginPage";
import RegisterPage from "../pages/RegisterPage";
import ProtectedRoutes from "./ProtectedRoutes";
import RideShareLanding from "../pages/RideSharingLanding";
import RiderDashboard from "../pages/RiderDashboard";
import DriverDashboard from "../pages/DriverDashboard";
import DriverRide from "../pages/DriverRide";
import RideHistory from "../pages/RideHistory";
import Profile from "../pages/Profile";

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<RideShareLanding />} />
      <Route path="/auth">
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />
      </Route>
      <Route element={<ProtectedRoutes />}>
        {/* Rider Routes */}
        <Route path="/dashboard" element={<RiderDashboard />} />
        
        {/* Driver Routes */}
        <Route path="/driver" element={<DriverDashboard />} />
        <Route path="/driver/ride/:rideId" element={<DriverRide />} />

        {/* Shared Routes */}
        <Route path="/history" element={<RideHistory />} />
        <Route path="/profile" element={<Profile />} />
      </Route>
    </Routes>
  );
}
