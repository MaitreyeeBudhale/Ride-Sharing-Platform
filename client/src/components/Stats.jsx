import { Wallet, Navigation2, ShieldCheck, Car } from "lucide-react";

const STATS = [
  { value: "42M+", label: "Trips completed" },
  { value: "180K", label: "Active drivers" },
  { value: "120+", label: "Cities served" },
];

function Stats() {
  return (
    <section id="stats" className="max-w-6xl mx-auto px-6 py-20 md:py-24">
      <div className="grid sm:grid-cols-3 gap-6">
        {STATS.map((s) => (
          <div
            key={s.label}
            className="rounded-2xl bg-zinc-950 text-white p-8 shadow-[0_12px_32px_-12px_rgba(10,10,10,0.35)]"
          >
            <div
              className="text-4xl sm:text-5xl tracking-tight"
              style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontWeight: 700,
              }}
            >
              {s.value}
            </div>
            <div className="mt-2 text-sm text-zinc-400">{s.label}</div>
            <div className="mt-4 h-1 w-10 rounded-full bg-emerald-500" />
          </div>
        ))}
      </div>
    </section>
  );
}
export default Stats;
