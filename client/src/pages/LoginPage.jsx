import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { Mail, Lock, Eye, EyeOff, Navigation2, ArrowRight } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import FONT_IMPORT from "../theme/FONT_IMPORT";
import api from "../api/api";

/**
 * Wheelie — Login
 * Same brand as the landing page: ink #0A0A0A, white, emerald #16A34A accent.
 * Glassmorphism card floats over a soft white gradient with a faint route
 * watermark, echoing the route motif from the marketing site.
 */

function GoogleIcon(props) {
  return (
    <svg viewBox="0 0 48 48" width="18" height="18" {...props}>
      <path
        fill="#FFC107"
        d="M43.6 20.5H42V20H24v8h11.3C33.7 32.9 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 8 3l5.7-5.7C34.6 6 29.6 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.7-.4-3.5z"
      />
      <path
        fill="#FF3D00"
        d="M6.3 14.7l6.6 4.8C14.5 15.9 18.9 13 24 13c3.1 0 5.8 1.1 8 3l5.7-5.7C34.6 6 29.6 4 24 4c-7.4 0-13.8 4.1-17.1 10.1z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.4 0 10.3-1.9 14-5.6l-6.5-5.4C29.4 34.7 26.9 35.5 24 35.5c-5.3 0-9.7-3.4-11.3-8.1l-6.6 5.1C9.6 39.6 16.2 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.2-4.3 5.6l6.5 5.4C41.3 35.8 44 30.4 44 24c0-1.3-.1-2.7-.4-3.5z"
      />
    </svg>
  );
}

function RouteWatermark() {
  return (
    <svg
      viewBox="0 0 500 500"
      className="absolute inset-0 w-full h-full opacity-[0.05] pointer-events-none"
      aria-hidden="true"
    >
      <path
        d="M 40 420 C 120 420, 110 300, 190 280 S 320 200, 340 120 S 420 60, 470 40"
        fill="none"
        stroke="#0A0A0A"
        strokeWidth="2.5"
        strokeDasharray="2 14"
        strokeLinecap="round"
      />
      <circle cx="40" cy="420" r="9" fill="#0A0A0A" />
      <circle cx="470" cy="40" r="9" fill="#16A34A" />
    </svg>
  );
}

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      email: "",
      password: "",
      remember: false,
    },
  });

  const onSubmit = async (data) => {
    try {
      const response = await api.post("/auth/login", {
        email: data.email,
        password: data.password,
      });
      console.log("Logged in successfully:", response.data);
      if (response.data.token) {
        document.cookie = `token=${response.data.token}; path=/; max-age=604800`;
      }
      if (response.data.user?.role === "Driver") {
        navigate("/driver");
      } else {
        navigate("/dashboard");
      }
    } catch (error) {
      console.error("Login failed:", error);
      alert(error.response?.data?.message || "Login failed. Please try again.");
    }
  };

  return (
    <div
      className="h-screen w-screen relative flex items-center justify-center overflow-hidden bg-white px-4"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      <style>{FONT_IMPORT}</style>

      {/* background: white with soft color blobs + route watermark */}
      <div className="absolute -top-32 -left-24 w-96 h-96 rounded-full bg-emerald-200 opacity-40 blur-3xl" />
      <div className="absolute -bottom-40 -right-16 w-[28rem] h-[28rem] rounded-full bg-emerald-100 opacity-60 blur-3xl" />
      <RouteWatermark />

      {/* glass card */}
      <div className="relative w-full max-w-[328px] xs:max-w-[348px] sm:max-w-[380px]">
        <div className="rounded-3xl border border-white/60 bg-white/60 backdrop-blur-2xl shadow-[0_20px_60px_-15px_rgba(10,10,10,0.15)] px-5 py-5 sm:px-6 sm:py-6">
          {/* logo */}
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-zinc-950 flex items-center justify-center shrink-0">
              <Navigation2 className="w-4 h-4 text-white" strokeWidth={2.5} />
            </div>
            <span
              className="text-md text-zinc-950 tracking-tight"
              style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontWeight: 700,
              }}
            >
              Wheelie
            </span>
          </div>

          {/* welcome text */}
          <p
            className="text-xl sm:text-[1.3rem] text-zinc-950 tracking-tight"
            style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontWeight: 700,
            }}
          >
            Welcome back
          </p>
          <p className="mt-1 text-[11px] text-zinc-500">
            Log in to book your next ride or manage your trips.
          </p>

          {/* form */}
          <form className="mt-4 space-y-2.5" onSubmit={handleSubmit(onSubmit)}>
            {/* email */}
            <div>
              <label
                htmlFor="email"
                className="block text-[11px] font-medium text-zinc-500 mb-1"
              >
                Email
              </label>
              <div className="relative">
                <Mail className="w-3.5 h-3.5 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  autoComplete="email"
                  {...register("email", {
                    required: "Email is required",
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: "Invalid email address",
                    },
                  })}
                  className={`w-full rounded-xl bg-white/70 border text-zinc-950 placeholder-zinc-400 text-xs pl-10 pr-4 py-2 outline-none focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 transition-all ${
                    errors.email
                      ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
                      : "border-zinc-200"
                  }`}
                />
              </div>
              {errors.email && (
                <p className="text-[10px] text-red-500 mt-1">
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* password */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label
                  htmlFor="password"
                  className="block text-[11px] font-medium text-zinc-500"
                >
                  Password
                </label>
                <a
                  href="#"
                  className="text-[11px] font-medium text-emerald-600 hover:text-emerald-700 transition-colors"
                >
                  Forgot password?
                </a>
              </div>
              <div className="relative">
                <Lock className="w-3.5 h-3.5 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  {...register("password", {
                    required: "Password is required",
                    minLength: {
                      value: 6,
                      message: "Password must be at least 6 characters",
                    },
                  })}
                  className={`w-full rounded-xl bg-white/70 border text-zinc-950 placeholder-zinc-400 text-xs pl-10 pr-10 py-2 outline-none focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 transition-all ${
                    errors.password
                      ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
                      : "border-zinc-200"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="w-3.5 h-3.5" />
                  ) : (
                    <Eye className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-[10px] text-red-500 mt-1">
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* login button */}
            <button
              type="submit"
              className="group w-full inline-flex items-center justify-center gap-1.5 bg-zinc-950 text-white text-xs font-semibold rounded-xl py-2.5 mt-1 hover:bg-zinc-800 shadow-[0_8px_24px_-8px_rgba(10,10,10,0.4)] transition-colors"
            >
              Log in
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </form>

          {/* register link */}
          <p className="mt-5 text-center text-xs text-zinc-500">
            Don't have an account?{" "}
            <Link
              to="/auth/register"
              className="font-semibold text-emerald-600 hover:text-emerald-700 transition-colors"
            >
              Sign up
            </Link>
          </p>
        </div>

        <p className="mt-4 text-center text-[10px] text-zinc-400">
          © 2026 Wheelie, Inc. · Terms · Privacy
        </p>
      </div>
    </div>
  );
}
