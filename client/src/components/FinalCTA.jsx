import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

function FinalCTA() {
  return (
    <section className="max-w-6xl mx-auto px-6 py-20 md:py-24">
      <div className="rounded-3xl bg-zinc-950 px-8 py-14 md:px-16 md:py-16 text-center relative overflow-hidden shadow-[0_20px_50px_-16px_rgba(10,10,10,0.4)]">
        <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-emerald-500 opacity-10" />
        <div className="absolute -bottom-20 -left-10 w-64 h-64 rounded-full bg-emerald-500 opacity-10" />
        <h2
          className="relative text-3xl sm:text-4xl text-white tracking-tight max-w-lg mx-auto"
          style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700 }}
        >
          Your next ride is a tap away
        </h2>
        <p className="relative mt-4 text-zinc-400 max-w-md mx-auto">
          Or turn your car into an income stream. Set your own hours, keep your
          own pace.
        </p>
        <div className="relative mt-8 flex flex-col sm:flex-row gap-3 justify-center">
          <Link to="/dashboard" className="inline-flex items-center justify-center gap-2 bg-emerald-500 text-zinc-950 text-sm font-semibold px-6 py-3.5 rounded-full hover:bg-emerald-400 transition-colors">
            Book a Ride
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link to="/auth/register" className="inline-flex items-center justify-center gap-2 bg-transparent text-white text-sm font-semibold px-6 py-3.5 rounded-full border border-zinc-700 hover:border-zinc-500 transition-colors">
            Become a Driver
          </Link>
        </div>
      </div>
    </section>
  );
}
export default FinalCTA;
