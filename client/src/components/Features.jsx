import { Wallet, Navigation2, ShieldCheck, Car } from "lucide-react";

const FEATURES = [
  {
    icon: Wallet,
    title: "Upfront pricing",
    body: "See your fare before you request. No surprise charges when you step out.",
  },
  {
    icon: Navigation2,
    title: "Live tracking",
    body: "Follow your driver's route in real time from request to drop-off.",
  },
  {
    icon: ShieldCheck,
    title: "Verified drivers",
    body: "Every driver passes a background check and vehicle inspection.",
  },
  {
    icon: Car,
    title: "Ride options",
    body: "Pick the size and price that fits — economy, comfort, or shared.",
  },
];

function Features() {
  return (
    <section id="features" className="max-w-6xl mx-auto px-6 py-20 md:py-28">
      <div className="max-w-xl mb-14">
        <h2
          className="text-3xl sm:text-4xl text-zinc-950 tracking-tight"
          style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700 }}
        >
          Built for the everyday ride
        </h2>
        <p className="mt-4 text-zinc-500 text-lg leading-relaxed">
          Every trip runs on the same three promises: a fair price, a safe
          driver, and a route you can watch the whole way.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {FEATURES.map(({ icon: Icon, title, body }) => (
          <div
            key={title}
            className="rounded-2xl border border-zinc-100 bg-white p-6 shadow-[0_4px_20px_-8px_rgba(10,10,10,0.08)] hover:shadow-[0_8px_28px_-8px_rgba(10,10,10,0.14)] hover:-translate-y-0.5 transition-all"
          >
            <div className="w-11 h-11 rounded-xl bg-zinc-950 flex items-center justify-center mb-5">
              <Icon className="w-5 h-5 text-white" strokeWidth={2} />
            </div>
            <h3 className="text-base font-semibold text-zinc-950 mb-1.5">
              {title}
            </h3>
            <p className="text-sm text-zinc-500 leading-relaxed">{body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export default Features;
