import React, { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { Clock, Navigation, MapPin } from "lucide-react";
import NavBar from "../components/NavBar";
import api from "../api/api";

export default function RideHistory() {
  const { user, setUser } = useOutletContext();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await api.get("/rides/history");
        if (response.data.success) {
          setHistory(response.data.rides);
        }
      } catch (err) {
        console.error("Failed to fetch ride history:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col font-sans">
      <NavBar user={user} setUser={setUser} />
      
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 md:p-6 space-y-6">
        <div className="bg-white rounded-3xl border border-zinc-100 p-6 shadow-sm">
          <h1 className="text-xl font-bold text-zinc-950" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            Ride History
          </h1>
          <p className="text-xs text-zinc-400 mt-1">Review all your past and active trips</p>
        </div>

        <div className="bg-white rounded-3xl border border-zinc-100 shadow-sm overflow-hidden">
          {loading ? (
            <div className="py-20 text-center text-xs font-semibold text-zinc-400">
              Loading rides...
            </div>
          ) : history.length === 0 ? (
            <div className="py-20 text-center text-xs text-zinc-400 space-y-2">
              <Clock className="w-8 h-8 text-zinc-300 mx-auto" />
              <p>No trips booked yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-zinc-100 bg-zinc-50 text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4">Route</th>
                    <th className="px-6 py-4">Fare</th>
                    <th className="px-6 py-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-50 text-xs text-zinc-700">
                  {history.map((ride) => (
                    <tr key={ride._id} className="hover:bg-zinc-50/50 transition-colors">
                      <td className="px-6 py-4 font-medium text-zinc-500 whitespace-nowrap">
                        {formatDate(ride.requestedAt)}
                      </td>
                      <td className="px-6 py-4 space-y-1 max-w-xs md:max-w-md">
                        <div className="flex items-center gap-1.5">
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                          <span className="truncate text-zinc-900 font-semibold">{ride.start}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <div className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                          <span className="truncate text-zinc-500">{ride.destination}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-bold text-zinc-900 whitespace-nowrap">
                        ₹{ride.fare || Math.round((ride.distance || 5) * 15)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase ${
                            ride.status === "completed"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                              : ride.status === "cancelled"
                                ? "bg-rose-50 text-rose-700 border border-rose-100"
                                : "bg-amber-50 text-amber-700 border border-amber-100"
                          }`}
                        >
                          {ride.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
