import { CheckCircle2, Navigation2 } from "lucide-react";
export default function Footer() {
  const columns = [
    {
      title: "Company",
      links: ["About", "Careers", "Newsroom", "Investors"],
    },
    {
      title: "Product",
      links: ["Ride", "Drive", "Business", "Cities"],
    },
    {
      title: "Support",
      links: ["Help center", "Safety", "Contact us", "Community"],
    },
    {
      title: "Legal",
      links: ["Terms", "Privacy", "Accessibility", "Licenses"],
    },
  ];

  return (
    <footer className="border-t border-zinc-100">
      <div className="max-w-6xl mx-auto px-6 py-16">
        <div className="grid sm:grid-cols-2 lg:grid-cols-6 gap-10">
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2 mb-4">
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
            </div>
            <p className="text-sm text-zinc-500 max-w-xs leading-relaxed">
              Rides and deliveries in 120+ cities, run by drivers who set their
              own schedule.
            </p>
            <div className="mt-5 inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-full">
              <CheckCircle2 className="w-3.5 h-3.5" />
              All systems operational
            </div>
          </div>

          {columns.map((col) => (
            <div key={col.title}>
              <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-4">
                {col.title}
              </div>
              <ul className="space-y-3">
                {col.links.map((l) => (
                  <li key={l}>
                    <a
                      href="#"
                      className="text-sm text-zinc-600 hover:text-zinc-950 transition-colors"
                    >
                      {l}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-14 pt-8 border-t border-zinc-100 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-zinc-400">
            © 2026 Wheelie, Inc. All rights reserved.
          </p>
          <div className="flex items-center gap-5 text-xs text-zinc-400">
            <a href="#" className="hover:text-zinc-950 transition-colors">
              Twitter
            </a>
            <a href="#" className="hover:text-zinc-950 transition-colors">
              Instagram
            </a>
            <a href="#" className="hover:text-zinc-950 transition-colors">
              LinkedIn
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
