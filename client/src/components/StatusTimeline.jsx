import React from "react";
import { Check } from "lucide-react";

const STAGES = [
  { key: "pending", label: "Searching" },
  { key: "accepted", label: "Accepted" },
  { key: "arriving", label: "Arriving" },
  { key: "started", label: "Ongoing" },
  { key: "completed", label: "Completed" },
];

export default function StatusTimeline({ currentStatus }) {
  // Map current database status or socket status to an index
  const getActiveIndex = () => {
    switch (currentStatus) {
      case "pending":
        return 0;
      case "accepted":
        return 1;
      case "arriving":
      case "reached-pickup":
        return 2;
      case "started":
      case "ongoing":
        return 3;
      case "completed":
        return 4;
      default:
        return 0;
    }
  };

  const activeIndex = getActiveIndex();

  return (
    <div className="w-full py-4 px-2">
      <div className="flex items-center justify-between w-full">
        {STAGES.map((stage, idx) => {
          const isDone = idx < activeIndex;
          const isActive = idx === activeIndex;
          
          return (
            <React.Fragment key={stage.key}>
              <div className="flex flex-col items-center gap-1.5 z-10">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                    isDone
                      ? "bg-emerald-500 text-white shadow-sm shadow-emerald-500/20"
                      : isActive
                        ? "bg-zinc-950 text-white shadow-md shadow-zinc-950/20 scale-110"
                        : "bg-zinc-100 text-zinc-400 border border-zinc-200"
                  }`}
                  style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                >
                  {isDone ? (
                    <Check className="w-3.5 h-3.5" strokeWidth={3} />
                  ) : (
                    idx + 1
                  )}
                </div>
                <span
                  className={`text-[9px] font-semibold tracking-wide uppercase ${
                    isActive ? "text-zinc-950" : "text-zinc-400"
                  }`}
                >
                  {stage.label}
                </span>
              </div>

              {/* Progress Line Connector */}
              {idx < STAGES.length - 1 && (
                <div className="flex-1 h-0.5 mx-1 relative -top-3">
                  <div className="h-full w-full bg-zinc-100" />
                  <div
                    className="h-full bg-emerald-500 absolute top-0 left-0 transition-all duration-500"
                    style={{ width: isDone ? "100%" : isActive ? "50%" : "0%" }}
                  />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
