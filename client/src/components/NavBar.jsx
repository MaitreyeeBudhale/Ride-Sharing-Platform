import React from "react";
import { Navigation2, Menu, X, User, History, LogOut } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/api";

function NavBar({ user, setUser }) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await api.post("/auth/logout");
    } catch (err) {
      console.warn("Logout request failed, cleaning up cookie:", err);
    }
    // Delete cookie
    document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;";
    if (setUser) setUser(null);
    navigate("/");
  };

  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-zinc-100">
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-zinc-950 flex items-center justify-center">
              <Navigation2 className="w-4 h-4 text-white" strokeWidth={2.5} />
            </div>
            <span
              className="text-lg tracking-tight text-zinc-950"
              style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontWeight: 700,
              }}
            >
              Wheelie
            </span>
          </Link>

          {/* Navigation links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-zinc-600">
            {user ? (
              <>
                <Link
                  to={user.role === "Driver" ? "/driver" : "/dashboard"}
                  className="hover:text-zinc-950 transition-colors"
                >
                  Dashboard
                </Link>
                <Link to="/history" className="hover:text-zinc-950 transition-colors">
                  Ride History
                </Link>
                <Link to="/profile" className="hover:text-zinc-950 transition-colors">
                  Profile
                </Link>
              </>
            ) : (
              <>
                <a href="#features" className="hover:text-zinc-950 transition-colors">
                  Ride
                </a>
                <a href="#drive" className="hover:text-zinc-950 transition-colors">
                  Drive
                </a>
                <a href="#stats" className="hover:text-zinc-950 transition-colors">
                  Cities
                </a>
              </>
            )}
          </nav>

          {/* Actions */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-4">
                <span className="text-xs bg-zinc-50 border border-zinc-100 text-zinc-600 font-semibold px-2.5 py-1 rounded-full">
                  {user.role}
                </span>
                <button
                  onClick={handleLogout}
                  className="text-sm font-semibold text-zinc-600 hover:text-rose-600 flex items-center gap-1 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </div>
            ) : (
              <>
                <Link
                  to="/auth/login"
                  className="text-sm font-semibold text-zinc-950 px-4 py-2 hover:text-emerald-600 transition-colors"
                >
                  Log in
                </Link>
                <Link
                  to="/auth/register"
                  className="text-sm font-semibold bg-zinc-950 text-white px-4 py-2 rounded-full shadow-sm hover:bg-zinc-800 transition-colors"
                >
                  Sign up
                </Link>
              </>
            )}
          </div>

          <button
            className="md:hidden p-2 -mr-2 text-zinc-950"
            onClick={() => setOpen(!open)}
            aria-label="Toggle menu"
          >
            {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="md:hidden border-t border-zinc-100 bg-white">
          <div className="px-6 py-4 flex flex-col gap-4 text-sm font-medium text-zinc-700">
            {user ? (
              <>
                <Link to={user.role === "Driver" ? "/driver" : "/dashboard"} onClick={() => setOpen(false)}>
                  Dashboard
                </Link>
                <Link to="/history" onClick={() => setOpen(false)}>
                  Ride History
                </Link>
                <Link to="/profile" onClick={() => setOpen(false)}>
                  Profile
                </Link>
                <button
                  onClick={() => {
                    setOpen(false);
                    handleLogout();
                  }}
                  className="text-left text-rose-600 font-semibold flex items-center gap-1.5 pt-2 border-t border-zinc-100"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </>
            ) : (
              <>
                <a href="#features" onClick={() => setOpen(false)}>
                  Ride
                </a>
                <a href="#drive" onClick={() => setOpen(false)}>
                  Drive
                </a>
                <a href="#stats" onClick={() => setOpen(false)}>
                  Cities
                </a>
                <div className="flex gap-3 pt-2 border-t border-zinc-100">
                  <Link
                    to="/auth/login"
                    onClick={() => setOpen(false)}
                    className="flex-1 text-center text-sm font-semibold border border-zinc-200 rounded-full py-2"
                  >
                    Log in
                  </Link>
                  <Link
                    to="/auth/register"
                    onClick={() => setOpen(false)}
                    className="flex-1 text-center text-sm font-semibold bg-zinc-950 text-white rounded-full py-2"
                  >
                    Sign up
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

export default NavBar;
