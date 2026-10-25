// Backlit side profile of a cab-over tractor with a container trailer — the hero's subject.
// Drawn as a near-silhouette: dark body, warm rim light along the top edges, headlight on.

const WHEELS = [90, 148, 206, 772, 830, 912];

export function Truck({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 980 262" className={className} aria-hidden>
      <defs>
        <linearGradient id="truck-body" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3a2a20" />
          <stop offset="0.35" stopColor="#241912" />
          <stop offset="1" stopColor="#0c0806" />
        </linearGradient>
        <linearGradient id="truck-cab" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#1a120d" />
          <stop offset="0.7" stopColor="#2c2018" />
          <stop offset="1" stopColor="#5a4130" />
        </linearGradient>
        <linearGradient id="truck-glass" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#6b5446" />
          <stop offset="0.5" stopColor="#2a1f19" />
          <stop offset="1" stopColor="#120c09" />
        </linearGradient>
        <linearGradient id="truck-rim" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#ffb47a" stopOpacity="0.15" />
          <stop offset="0.6" stopColor="#ffc08a" stopOpacity="0.55" />
          <stop offset="1" stopColor="#ffd6a8" stopOpacity="0.9" />
        </linearGradient>
        <radialGradient id="truck-lamp" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#fffaf0" />
          <stop offset="0.45" stopColor="#ffe2b8" stopOpacity="0.9" />
          <stop offset="1" stopColor="#ffb070" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* trailer */}
      <rect x="18" y="36" width="780" height="168" rx="3" fill="url(#truck-body)" />
      <g stroke="#ffffff" strokeOpacity="0.035" strokeWidth="2">
        {Array.from({ length: 19 }, (_, i) => (
          <line key={i} x1={58 + i * 39} y1="44" x2={58 + i * 39} y2="198" />
        ))}
      </g>
      <line x1="18" y1="37" x2="798" y2="37" stroke="url(#truck-rim)" strokeWidth="2" />
      <line x1="18" y1="200" x2="798" y2="200" stroke="#000" strokeOpacity="0.5" strokeWidth="3" />
      {[60, 300, 560, 780].map((x) => (
        <rect key={x} x={x} y="34" width="6" height="3" fill="#ffd2a0" opacity="0.7" />
      ))}
      {/* chassis, landing gear, rear bumper */}
      <rect x="40" y="204" width="740" height="10" fill="#0a0705" />
      <rect x="470" y="204" width="7" height="34" fill="#0d0907" />
      <rect x="490" y="204" width="7" height="34" fill="#0d0907" />
      <rect x="22" y="214" width="40" height="8" fill="#0a0705" />

      {/* cab-over tractor: aero roof fairing flows into the cab, raked windscreen */}
      <path
        d="M796 208 V100 C796 74 810 56 838 46 C862 38 900 35 930 39 C947 41 955 55 957 72 L967 150 V208 Z"
        fill="url(#truck-cab)"
      />
      <path d="M838 46 C862 38 900 35 930 39 C947 41 955 55 957 72" stroke="url(#truck-rim)" strokeWidth="1.8" fill="none" />
      <path d="M921 58 C939 58 948 64 950 76 L958 142 H918 Z" fill="url(#truck-glass)" />
      <path d="M848 74 H900 Q906 74 906 80 V116 Q906 122 900 122 H848 Q842 122 842 116 V80 Q842 74 848 74 Z" fill="url(#truck-glass)" />
      <path d="M836 128 V200 M912 128 V200" stroke="#000" strokeOpacity="0.45" strokeWidth="1.5" />
      <rect x="806" y="150" width="22" height="46" rx="3" fill="#120c09" />
      <rect x="844" y="186" width="58" height="10" rx="2" fill="#0e0907" />
      <rect x="940" y="186" width="32" height="24" rx="3" fill="#100b08" />
      <path d="M940 186 H972" stroke="#ffcf9e" strokeOpacity="0.35" />
      <rect x="958" y="166" width="12" height="11" rx="2" fill="#fff4e0" />
      <circle cx="964" cy="171" r="22" fill="url(#truck-lamp)" />
      <rect x="944" y="168" width="8" height="4" rx="1" fill="#ff9a4a" opacity="0.8" />

      {/* wheels */}
      {WHEELS.map((cx) => (
        <g key={cx}>
          <circle cx={cx} cy="234" r="27" fill="#050403" />
          <circle cx={cx} cy="234" r="15" fill="#15100c" />
          <circle cx={cx} cy="234" r="5" fill="#2a1f18" />
        </g>
      ))}
    </svg>
  );
}
