import { ArrowRight, ShieldCheck, Star } from "lucide-react";
import RouteIllustration from "./RouteIllustration";
import { Link } from "react-router-dom";
function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="max-w-6xl mx-auto px-6 pt-16 pb-20 md:pt-24 md:pb-28 grid md:grid-cols-2 gap-14 items-center">
        <div>
          <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Now live in 120+ cities
          </div>

          <h1
            className="text-4xl sm:text-5xl lg:text-[3.4rem] leading-[1.05] text-zinc-950 tracking-tight"
            style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontWeight: 700,
            }}
          >
            Go anywhere,
            <br />
            arrive on time.
          </h1>

          <p className="mt-6 text-lg text-zinc-500 max-w-md leading-relaxed">
            Request a ride in seconds, watch your driver approach on a live map,
            and pay with a fare you saw before you got in.
          </p>

          <div className="mt-9 flex flex-col sm:flex-row gap-3">
            <Link to="/dashboard" className="group inline-flex items-center justify-center gap-2 bg-zinc-950 text-white text-sm font-semibold px-6 py-3.5 rounded-full shadow-[0_8px_24px_-8px_rgba(10,10,10,0.4)] hover:bg-zinc-800 transition-colors">
              Book a Ride
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
            <Link to="/auth/register" className="inline-flex items-center justify-center gap-2 bg-white text-zinc-950 text-sm font-semibold px-6 py-3.5 rounded-full border border-zinc-200 hover:border-emerald-500 hover:text-emerald-700 transition-colors">
              Become a Driver
            </Link>
          </div>

          <div className="mt-10 flex items-center gap-6 text-sm text-zinc-500">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Verified drivers
            </div>
            <div className="flex items-center gap-1.5">
              <Star className="w-4 h-4 text-emerald-600" />
              4.9 avg rating
            </div>
          </div>
        </div>

        <RouteIllustration />
      </div>
    </section>
  );
}
export default Hero;
