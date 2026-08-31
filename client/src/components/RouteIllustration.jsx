import { Navigation2 } from "lucide-react";
function RouteIllustration() {
  // Signature element: a dashed route connecting a rider pin to a driver pin,
  // with a car marker riding along the path.
  return (
    <div className="relative w-full aspect-[4/3] sm:aspect-square">
      <svg viewBox="0 0 420 420" className="w-full h-full" aria-hidden="true">
        <defs>
          <filter id="soft-shadow" x="-40%" y="-40%" width="180%" height="180%">
            <feDropShadow
              dx="0"
              dy="10"
              stdDeviation="14"
              floodColor="#0A0A0A"
              floodOpacity="0.10"
            />
          </filter>
          <filter
            id="soft-shadow-sm"
            x="-60%"
            y="-60%"
            width="220%"
            height="220%"
          >
            <feDropShadow
              dx="0"
              dy="4"
              stdDeviation="6"
              floodColor="#0A0A0A"
              floodOpacity="0.12"
            />
          </filter>
        </defs>

        {/* backdrop card */}
        <rect x="10" y="10" width="400" height="400" rx="32" fill="#FAFAFA" />
        <rect
          x="10"
          y="10"
          width="400"
          height="400"
          rx="32"
          fill="none"
          stroke="#F0F0F0"
          strokeWidth="1"
        />

        {/* soft green "coverage" blob */}
        <circle cx="120" cy="300" r="70" fill="#16A34A" opacity="0.06" />
        <circle cx="300" cy="120" r="90" fill="#16A34A" opacity="0.05" />

        {/* route path */}
        <path
          id="route-path"
          d="M 95 320 C 150 320, 140 220, 200 210 S 300 150, 320 100"
          fill="none"
          stroke="#0A0A0A"
          strokeWidth="3"
          strokeDasharray="2 10"
          strokeLinecap="round"
          opacity="0.35"
        />

        {/* pickup pin (rider) */}
        <g filter="url(#soft-shadow-sm)">
          <circle cx="95" cy="320" r="16" fill="#0A0A0A" />
          <circle cx="95" cy="320" r="6" fill="white" />
        </g>
        <g transform="translate(60, 345)">
          <rect
            width="70"
            height="24"
            rx="12"
            fill="white"
            filter="url(#soft-shadow-sm)"
          />
          <text
            x="35"
            y="16"
            textAnchor="middle"
            fontSize="10"
            fontWeight="600"
            fill="#18181B"
            fontFamily="'Inter', sans-serif"
          >
            Pickup
          </text>
        </g>

        {/* dropoff pin (driver destination) */}
        <g filter="url(#soft-shadow-sm)">
          <circle cx="320" cy="100" r="16" fill="#16A34A" />
          <circle cx="320" cy="100" r="6" fill="white" />
        </g>
        <g transform="translate(285, 62)">
          <rect
            width="76"
            height="24"
            rx="12"
            fill="white"
            filter="url(#soft-shadow-sm)"
          />
          <text
            x="38"
            y="16"
            textAnchor="middle"
            fontSize="10"
            fontWeight="600"
            fill="#18181B"
            fontFamily="'Inter', sans-serif"
          >
            Dropoff
          </text>
        </g>

        {/* car riding the route */}
        <g filter="url(#soft-shadow)">
          <g className="route-car">
            <animateMotion dur="6s" repeatCount="indefinite" rotate="auto">
              <mpath href="#route-path" />
            </animateMotion>
            <rect
              x="-20"
              y="-12"
              width="40"
              height="24"
              rx="10"
              fill="#0A0A0A"
            />
            <rect x="-13" y="-7" width="26" height="10" rx="4" fill="#3F3F46" />
            <circle cx="-11" cy="12" r="4" fill="#0A0A0A" />
            <circle cx="11" cy="12" r="4" fill="#0A0A0A" />
          </g>
        </g>

        {/* rider card, bottom-left */}
        <g transform="translate(30, 210)" filter="url(#soft-shadow)">
          <rect width="112" height="60" rx="18" fill="white" />
          <circle cx="30" cy="30" r="14" fill="#F4F4F5" />
          <path
            d="M23 34 a7 7 0 0 1 14 0"
            stroke="#0A0A0A"
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
          />
          <circle cx="30" cy="24" r="5" fill="#0A0A0A" />
          <text
            x="55"
            y="27"
            fontSize="10"
            fontWeight="700"
            fill="#18181B"
            fontFamily="'Inter', sans-serif"
          >
            Amara
          </text>
          <text
            x="55"
            y="40"
            fontSize="9"
            fill="#71717A"
            fontFamily="'Inter', sans-serif"
          >
            Rider · 4.9
          </text>
        </g>

        {/* eta chip, top-right */}
        <g transform="translate(255, 165)" filter="url(#soft-shadow)">
          <rect width="120" height="44" rx="16" fill="white" />
          <circle cx="24" cy="22" r="10" fill="#16A34A" opacity="0.12" />
          <path
            d="M24 16 v6 l4 4"
            stroke="#16A34A"
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <text
            x="42"
            y="19"
            fontSize="9"
            fill="#71717A"
            fontFamily="'Inter', sans-serif"
          >
            Arriving in
          </text>
          <text
            x="42"
            y="32"
            fontSize="12"
            fontWeight="700"
            fill="#18181B"
            fontFamily="'Inter', sans-serif"
          >
            3 min
          </text>
        </g>
      </svg>

      <style>{`
        @media (prefers-reduced-motion: reduce) {
          .route-car animateMotion { display: none; }
        }
      `}</style>
    </div>
  );
}

export default RouteIllustration;
