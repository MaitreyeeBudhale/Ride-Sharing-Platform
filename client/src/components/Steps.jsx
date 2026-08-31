import { Wallet, Navigation2, ShieldCheck, Car } from "lucide-react";

const STEPS = [
  {
    n: "01",
    title: "Set your route",
    body: "Drop a pickup and destination pin. See your price and wait time instantly.",
  },
  {
    n: "02",
    title: "Get matched",
    body: "A nearby verified driver accepts your trip and heads your way.",
  },
  {
    n: "03",
    title: "Ride and go",
    body: "Track the car live, hop in, and the fare is charged automatically at drop-off.",
  },
];

function HowItWorks() {
  return (
    <section id="drive" className="bg-zinc-50 border-y border-zinc-100">
      <div className="max-w-6xl mx-auto px-6 py-20 md:py-28">
        <div className="max-w-xl mb-14">
          <h2
            className="text-3xl sm:text-4xl text-zinc-950 tracking-tight"
            style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontWeight: 700,
            }}
          >
            How it works
          </h2>
          <p className="mt-4 text-zinc-500 text-lg leading-relaxed">
            Three steps, start to finish. No calls, no haggling.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 relative">
          <div
            className="hidden md:block absolute top-6 left-[16.6%] right-[16.6%] h-px bg-zinc-200"
            style={{
              backgroundImage:
                "repeating-linear-gradient(90deg, #D4D4D8 0 6px, transparent 6px 14px)",
            }}
          />
          {STEPS.map((s) => (
            <div key={s.n} className="relative">
              <div
                className="w-12 h-12 rounded-full bg-white border border-zinc-200 shadow-sm flex items-center justify-center text-sm font-bold text-zinc-950 mb-5 relative z-10"
                style={{ fontFamily: "'Space Grotesk', sans-serif" }}
              >
                {s.n}
              </div>
              <h3 className="text-lg font-semibold text-zinc-950 mb-2">
                {s.title}
              </h3>
              <p className="text-sm text-zinc-500 leading-relaxed max-w-xs">
                {s.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
export default HowItWorks;
