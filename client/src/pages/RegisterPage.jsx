import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/api";
import {
  User,
  Mail,
  Phone,
  Lock,
  Eye,
  EyeOff,
  Navigation2,
  ArrowRight,
  ArrowLeft,
  Check,
  Car,
  UserRound,
} from "lucide-react";
import FONT_IMPORT from "../theme/FONT_IMPORT";

/**
 * Wheelie — Register
 * Same brand system as login/landing: ink #0A0A0A, white, emerald #16A34A.
 * Three-step glass card: Account → Security → Role, with a progress rail
 * that mirrors the route line motif used across the product.
 */

const STEPS = [
  { key: "account", label: "Account" },
  { key: "security", label: "Security" },
  { key: "role", label: "Role" },
];

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

function ProgressRail({ stepIndex }) {
  return (
    <div className="flex items-center mb-6">
      {STEPS.map((s, i) => {
        const done = i < stepIndex;
        const current = i === stepIndex;
        return (
          <React.Fragment key={s.key}>
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors shrink-0 ${
                  done
                    ? "bg-emerald-500 text-white"
                    : current
                      ? "bg-zinc-950 text-white"
                      : "bg-zinc-100 text-zinc-400 border border-zinc-200"
                }`}
                style={{ fontFamily: "'Space Grotesk', sans-serif" }}
              >
                {done ? (
                  <Check className="w-3.5 h-3.5" strokeWidth={3} />
                ) : (
                  i + 1
                )}
              </div>
              <span
                className={`text-[10px] font-medium whitespace-nowrap ${
                  current ? "text-zinc-950" : "text-zinc-400"
                }`}
              >
                {s.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className="flex-1 h-px mx-1.5 mb-4 relative top-0">
                <div className="h-px w-full bg-zinc-200" />
                <div
                  className="h-px bg-emerald-500 absolute top-0 left-0 transition-all duration-300"
                  style={{ width: done ? "100%" : "0%" }}
                />
              </div>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

function Field({ label, icon: Icon, children }) {
  return (
    <div>
      <label className="block text-xs font-medium text-zinc-500 mb-1">
        {label}
      </label>
      <div className="relative">
        {Icon && (
          <Icon className="w-3.5 h-3.5 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        )}
        {children}
      </div>
    </div>
  );
}

const inputClass =
  "w-full rounded-xl bg-white/70 border border-zinc-200 text-zinc-950 placeholder-zinc-400 text-xs pl-10 pr-4 py-2 outline-none focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 transition-all";

export default function RegisterPage() {
  const [step, setStep] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [currentLocation, setCurrentLocation] = useState({
    longitude: null,
    latitude: null,
  });

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    trigger,
    formState: { errors, isValid },
  } = useForm({
    defaultValues: {
      fullName: "",
      email: "",
      phone: "",
      password: "",
      confirmPassword: "",
      role: "rider",
      license: "",
    },
    mode: "onChange",
  });

  const role = watch("role");
  const password = watch("password");
  const confirmPassword = watch("confirmPassword");
  const fullName = watch("fullName");
  const email = watch("email");
  const phone = watch("phone");
  const license = watch("license");

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

  const canProceed = () => {
    if (step === 0) {
      return fullName?.trim() && email?.trim() && phone?.trim();
    }
    if (step === 1) {
      return (
        password?.length >= 6 &&
        confirmPassword?.length > 0 &&
        password === confirmPassword
      );
    }
    if (step === 2) {
      return role === "rider" || (role === "driver" && license?.trim());
    }
    return true;
  };

  const navigate = useNavigate();

  const passwordsMismatch =
    step === 1 && confirmPassword && password !== confirmPassword;

  const next = () => setStep((s) => Math.min(s + 1, STEPS.length - 1));
  const back = () => setStep((s) => Math.max(s - 1, 0));

  const handleNextStep = async () => {
    let fieldsToValidate = [];
    if (step === 0) {
      fieldsToValidate = ["fullName", "email", "phone"];
    } else if (step === 1) {
      fieldsToValidate = ["password", "confirmPassword"];
    } else if (step === 2) {
      fieldsToValidate = ["role"];
      if (role === "driver") {
        fieldsToValidate.push("license");
      }
    }

    const isStepValid = await trigger(fieldsToValidate);
    if (isStepValid) {
      if (step < STEPS.length - 1) {
        next();
      } else {
        try {
          let response;
          if (role === "driver") {
            response = await api.post("/auth/register/driver", {
              fullName,
              email,
              phone,
              password,
              license,
              location: currentLocation,
            });
          } else {
            response = await api.post("/auth/register/rider", {
              fullName,
              email,
              phone,
              password,
            });
          }
          if (response.data.token) {
            document.cookie = `token=${response.data.token}; path=/; max-age=604800`;
          }
          setSubmitted(true);
        } catch (error) {
          console.log(error);
          console.error("Registration failed:", error);
          alert(
            error.response?.data?.message ||
              "Registration failed. Please try again.",
          );
        }
      }
    }
  };

  return (
    <div
      className="h-screen w-screen relative flex items-center justify-center overflow-hidden bg-white px-4"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      <style>{FONT_IMPORT}</style>

      {/* background */}
      <div className="absolute -top-32 -left-24 w-96 h-96 rounded-full bg-emerald-200 opacity-40 blur-3xl" />
      <div className="absolute -bottom-40 -right-16 w-[28rem] h-[28rem] rounded-full bg-emerald-100 opacity-60 blur-3xl" />
      <RouteWatermark />

      <div className="relative w-full max-w-[328px] xs:max-w-[348px] sm:max-w-[390px]">
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

          {submitted ? (
            <div className="py-4 text-center">
              <div className="w-12 h-12 rounded-full bg-emerald-500 flex items-center justify-center mx-auto mb-4">
                <Check className="w-6 h-6 text-white" strokeWidth={3} />
              </div>
              <p
                className="text-lg text-zinc-950 tracking-tight"
                style={{
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontWeight: 70,
                }}
              >
                You're all set, {fullName.split(" ")[0] || "there"}
              </p>
              <p className="mt-1.5 text-xs text-zinc-500 max-w-xs mx-auto">
                {role === "driver"
                  ? "We're reviewing your license details. You'll get an email once you're approved to drive."
                  : "Your account is ready. Head to the app to book your first ride."}
              </p>
              <button
                onClick={() => {
                  if (role === "driver") {
                    navigate("/driver");
                  } else {
                    navigate("/dashboard");
                  }
                }}
                className="mt-5 w-full inline-flex items-center justify-center gap-1.5 bg-zinc-950 text-white text-xs font-semibold rounded-xl py-2.5 hover:bg-zinc-800 shadow-[0_8px_24px_-8px_rgba(10,10,10,0.4)] transition-all"
              >
                Go to Dashboard
              </button>
              <button
                onClick={() => {
                  setSubmitted(false);
                  setStep(0);
                }}
                className="mt-3 text-xs font-semibold text-emerald-600 hover:text-emerald-700 transition-colors block mx-auto"
              >
                Back to form
              </button>
            </div>
          ) : (
            <>
              <p
                className="text-xl sm:text-[1.3rem] text-zinc-950 tracking-tight"
                style={{
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontWeight: 700,
                }}
              >
                Create your account
              </p>
              <p className="text-xs text-zinc-500 mb-3.5">
                Join Wheelie in a few quick steps.
              </p>

              <ProgressRail stepIndex={step} />

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleNextStep();
                }}
              >
                {/* STEP 0: account */}
                {step === 0 && (
                  <div className="space-y-2.5">
                    <Field label="Full name" icon={User}>
                      <input
                        type="text"
                        placeholder="Jordan Rivera"
                        {...register("fullName", {
                          required: "Full name is required",
                        })}
                        className={`${inputClass} ${errors.fullName ? "border-red-500 focus:border-red-500 focus:ring-red-500/20" : ""}`}
                        autoComplete="name"
                      />
                      {errors.fullName && (
                        <p className="text-[10px] text-red-500 mt-1">
                          {errors.fullName.message}
                        </p>
                      )}
                    </Field>
                    <Field label="Email" icon={Mail}>
                      <input
                        type="email"
                        placeholder="you@example.com"
                        {...register("email", {
                          required: "Email is required",
                          pattern: {
                            value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                            message: "Invalid email address",
                          },
                        })}
                        className={`${inputClass} ${errors.email ? "border-red-500 focus:border-red-500 focus:ring-red-500/20" : ""}`}
                        autoComplete="email"
                      />
                      {errors.email && (
                        <p className="text-[10px] text-red-500 mt-1">
                          {errors.email.message}
                        </p>
                      )}
                    </Field>
                    <Field label="Phone" icon={Phone}>
                      <input
                        type="tel"
                        placeholder="+1 (555) 000-0000"
                        {...register("phone", {
                          required: "Phone number is required",
                        })}
                        className={`${inputClass} ${errors.phone ? "border-red-500 focus:border-red-500 focus:ring-red-500/20" : ""}`}
                        autoComplete="tel"
                      />
                      {errors.phone && (
                        <p className="text-[10px] text-red-500 mt-1">
                          {errors.phone.message}
                        </p>
                      )}
                    </Field>
                  </div>
                )}

                {/* STEP 1: security */}
                {step === 1 && (
                  <div className="space-y-2.5">
                    <Field label="Password" icon={Lock}>
                      <input
                        type={showPassword ? "text" : "password"}
                        placeholder="At least 6 characters"
                        {...register("password", {
                          required: "Password is required",
                          minLength: {
                            value: 6,
                            message: "Password must be at least 6 characters",
                          },
                        })}
                        className={`${inputClass} pr-10 ${errors.password ? "border-red-500 focus:border-red-500 focus:ring-red-500/20" : ""}`}
                        autoComplete="new-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 transition-colors"
                        aria-label={
                          showPassword ? "Hide password" : "Show password"
                        }
                      >
                        {showPassword ? (
                          <EyeOff className="w-3.5 h-3.5" />
                        ) : (
                          <Eye className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </Field>
                    {errors.password && (
                      <p className="text-[10px] text-red-500 mt-1">
                        {errors.password.message}
                      </p>
                    )}
                    <Field label="Confirm password" icon={Lock}>
                      <input
                        type={showConfirm ? "text" : "password"}
                        placeholder="Re-enter your password"
                        {...register("confirmPassword", {
                          required: "Please confirm your password",
                          validate: (value) =>
                            value === password || "Passwords don't match",
                        })}
                        className={`${inputClass} pr-10 ${
                          errors.confirmPassword
                            ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
                            : ""
                        }`}
                        autoComplete="new-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirm(!showConfirm)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 transition-colors"
                        aria-label={
                          showConfirm ? "Hide password" : "Show password"
                        }
                      >
                        {showConfirm ? (
                          <EyeOff className="w-3.5 h-3.5" />
                        ) : (
                          <Eye className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </Field>
                    {errors.confirmPassword && (
                      <p className="text-[10px] text-red-500 mt-1">
                        {errors.confirmPassword.message}
                      </p>
                    )}
                    {passwordsMismatch && !errors.confirmPassword && (
                      <p className="text-[10px] text-red-500 mt-1">
                        Passwords don't match yet.
                      </p>
                    )}
                    <p className="text-[10px] text-zinc-400">
                      Use 6+ characters with a mix of letters and numbers.
                    </p>
                  </div>
                )}

                {/* STEP 2: role */}
                {step === 2 && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-2.5">
                      <button
                        type="button"
                        onClick={() => setValue("role", "rider")}
                        className={`rounded-xl border p-2.5 text-left transition-all ${
                          role === "rider"
                            ? "border-emerald-500 bg-emerald-50/70 ring-2 ring-emerald-500/20"
                            : "border-zinc-200 bg-white/60 hover:border-zinc-300"
                        }`}
                      >
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 ${
                            role === "rider" ? "bg-emerald-500" : "bg-zinc-100"
                          }`}
                        >
                          <UserRound
                            className={
                              role === "rider" ? "text-white" : "text-zinc-500"
                            }
                            style={{ width: 16, height: 16 }}
                          />
                        </div>
                        <div className="text-xs font-semibold text-zinc-950">
                          Rider
                        </div>
                        <div className="text-[10px] text-zinc-500 mt-0.5">
                          Book and take rides
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setValue("role", "driver")}
                        className={`rounded-xl border p-2.5 text-left transition-all ${
                          role === "driver"
                            ? "border-emerald-500 bg-emerald-50/70 ring-2 ring-emerald-500/20"
                            : "border-zinc-200 bg-white/60 hover:border-zinc-300"
                        }`}
                      >
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 ${
                            role === "driver" ? "bg-emerald-500" : "bg-zinc-100"
                          }`}
                        >
                          <Car
                            className={`${role === "driver" ? "text-white" : "text-zinc-500"}`}
                            style={{ width: 16, height: 16 }}
                          />
                        </div>
                        <div className="text-xs font-semibold text-zinc-950">
                          Driver
                        </div>
                        <div className="text-[10px] text-zinc-500 mt-0.5">
                          Drive and earn
                        </div>
                      </button>
                    </div>

                    <div
                      className={`grid transition-all duration-300 ease-out ${
                        role === "driver"
                          ? "grid-rows-[1fr] opacity-100"
                          : "grid-rows-[0fr] opacity-0"
                      }`}
                    >
                      <div className="overflow-hidden">
                        <Field label="License number">
                          <input
                            type="text"
                            placeholder="e.g. D1234567"
                            {...register("license", {
                              validate: (value) => {
                                if (role === "driver" && !value?.trim()) {
                                  return "License number is required for drivers";
                                }
                                return true;
                              },
                            })}
                            className={`${inputClass} pl-4 ${errors.license ? "border-red-500 focus:border-red-500 focus:ring-red-500/20" : ""}`}
                          />
                        </Field>
                        {errors.license && (
                          <p className="text-[10px] text-red-500 mt-1">
                            {errors.license.message}
                          </p>
                        )}
                        <p className="text-[10px] text-zinc-400 mt-1.5">
                          We'll verify this against your state's DMV records.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* nav buttons */}
                <div className="flex items-center gap-2.5 mt-5">
                  {step > 0 && (
                    <button
                      type="button"
                      onClick={back}
                      className="inline-flex items-center justify-center gap-1 text-zinc-600 text-xs font-semibold rounded-xl px-4 py-2.5 border border-zinc-200 hover:bg-zinc-50 transition-colors"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      Back
                    </button>
                  )}

                  {step < STEPS.length - 1 ? (
                    <button
                      type="submit"
                      disabled={!canProceed()}
                      className="group flex-1 inline-flex items-center justify-center gap-1.5 bg-zinc-950 text-white text-xs font-semibold rounded-xl py-2.5 hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed shadow-[0_8px_24px_-8px_rgba(10,10,10,0.4)] transition-all"
                    >
                      Continue
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </button>
                  ) : (
                    <button
                      type="submit"
                      disabled={!canProceed()}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 bg-emerald-500 text-zinc-950 text-xs font-semibold rounded-xl py-2.5 hover:bg-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed shadow-[0_8px_24px_-8px_rgba(16,185,129,0.5)] transition-all"
                    >
                      Create account
                    </button>
                  )}
                </div>
              </form>

              <p className="mt-5 text-center text-xs text-zinc-500">
                Already have an account?{" "}
                <Link
                  to="/auth/login"
                  className="font-semibold text-emerald-600 hover:text-emerald-700 transition-colors"
                >
                  Log in
                </Link>
              </p>
            </>
          )}
        </div>

        <p className="mt-4 text-center text-[10px] text-zinc-400">
          © 2026 Wheelie, Inc. · Terms · Privacy
        </p>
      </div>
    </div>
  );
}
