// Side profile of a cab-over tractor with a container trailer — the hero's subject.
// "solid": backlit near-silhouette with warm rim light. "wire": the digital-twin outline.
// Wheels carry data-wheel={cx} so the scene can spin them in place.

export const TRUCK_VIEW = { w: 980, h: 262, wheelR: 27, wheelY: 234 };
const WHEELS = [90, 148, 206, 772, 830, 912];
// Rounded so server and client markup match exactly.
const round2 = (v: number) => Math.round(v * 100) / 100;

type Variant = "solid" | "wire";

export function Truck({ className = "", variant = "solid" }: { className?: string; variant?: Variant }) {
  const wire = variant === "wire";
  const id = (n: string) => `truck-${variant}-${n}`;
  const W = "var(--color-cyan)";
  const body = wire ? { fill: "rgba(127,212,217,0.04)", stroke: W, strokeWidth: 1.2 } : { fill: `url(#${id("body")})` };
  const cab = wire ? { fill: "rgba(127,212,217,0.05)", stroke: W, strokeWidth: 1.2 } : { fill: `url(#${id("cab")})` };
  const glass = wire ? { fill: "rgba(127,212,217,0.12)", stroke: W, strokeWidth: 1 } : { fill: `url(#${id("glass")})` };
  const dark = wire ? { fill: "none", stroke: W, strokeWidth: 1, strokeOpacity: 0.7 } : { fill: "#0c0806" };

  return (
    <svg viewBox={`0 0 ${TRUCK_VIEW.w} ${TRUCK_VIEW.h}`} className={className} aria-hidden>
      {!wire && (
        <defs>
          <linearGradient id={id("body")} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#3a2a20" />
            <stop offset="0.35" stopColor="#241912" />
            <stop offset="1" stopColor="#0c0806" />
          </linearGradient>
          <linearGradient id={id("cab")} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#1a120d" />
            <stop offset="0.7" stopColor="#2c2018" />
            <stop offset="1" stopColor="#5a4130" />
          </linearGradient>
          <linearGradient id={id("glass")} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#6b5446" />
            <stop offset="0.5" stopColor="#2a1f19" />
            <stop offset="1" stopColor="#120c09" />
          </linearGradient>
          <linearGradient id={id("rim")} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#ffb47a" stopOpacity="0.15" />
            <stop offset="0.6" stopColor="#ffc08a" stopOpacity="0.55" />
            <stop offset="1" stopColor="#ffd6a8" stopOpacity="0.9" />
          </linearGradient>
          <radialGradient id={id("lamp")} cx="0.5" cy="0.5" r="0.5">
            <stop offset="0" stopColor="#fffaf0" />
            <stop offset="0.45" stopColor="#ffe2b8" stopOpacity="0.9" />
            <stop offset="1" stopColor="#ffb070" stopOpacity="0" />
          </radialGradient>
        </defs>
      )}

      {/* trailer */}
      <rect x="18" y="36" width="780" height="168" rx="3" {...body} />
      <g stroke={wire ? W : "#ffffff"} strokeOpacity={wire ? 0.35 : 0.035} strokeWidth={wire ? 0.8 : 2}>
        {Array.from({ length: 19 }, (_, i) => (
          <line key={i} x1={58 + i * 39} y1="44" x2={58 + i * 39} y2="198" />
        ))}
      </g>
      {!wire && (
        <>
          <line x1="18" y1="37" x2="798" y2="37" stroke={`url(#${id("rim")})`} strokeWidth="2" />
          <line x1="18" y1="200" x2="798" y2="200" stroke="#000" strokeOpacity="0.5" strokeWidth="3" />
          {[60, 300, 560, 780].map((x) => (
            <rect key={x} x={x} y="34" width="6" height="3" fill="#ffd2a0" opacity="0.7" />
          ))}
        </>
      )}
      {/* chassis, landing gear, rear bumper */}
      <rect x="40" y="204" width="740" height="10" {...dark} />
      <rect x="470" y="204" width="7" height="34" {...dark} />
      <rect x="490" y="204" width="7" height="34" {...dark} />
      <rect x="22" y="214" width="40" height="8" {...dark} />

      {/* cab-over tractor: aero roof fairing flows into the cab, raked windscreen */}
      <path d="M796 208 V100 C796 74 810 56 838 46 C862 38 900 35 930 39 C947 41 955 55 957 72 L967 150 V208 Z" {...cab} />
      {!wire && (
        <path d="M838 46 C862 38 900 35 930 39 C947 41 955 55 957 72" stroke={`url(#${id("rim")})`} strokeWidth="1.8" fill="none" />
      )}
      <path d="M921 58 C939 58 948 64 950 76 L958 142 H918 Z" {...glass} />
      <path d="M848 74 H900 Q906 74 906 80 V116 Q906 122 900 122 H848 Q842 122 842 116 V80 Q842 74 848 74 Z" {...glass} />
      <path d="M836 128 V200 M912 128 V200" stroke={wire ? W : "#000"} strokeOpacity={wire ? 0.6 : 0.45} strokeWidth="1.5" />
      <rect x="806" y="150" width="22" height="46" rx="3" {...dark} />
      <rect x="940" y="186" width="32" height="24" rx="3" {...dark} />
      <rect x="958" y="166" width="12" height="11" rx="2" fill={wire ? W : "#fff4e0"} />
      {!wire && <circle cx="964" cy="171" r="22" fill={`url(#${id("lamp")})`} />}
      {!wire && <rect x="944" y="168" width="8" height="4" rx="1" fill="#ff9a4a" opacity="0.8" />}

      {/* wheels — spokes make the rotation readable */}
      {WHEELS.map((cx) => (
        <g key={cx} data-wheel={cx}>
          <circle cx={cx} cy={TRUCK_VIEW.wheelY} r={TRUCK_VIEW.wheelR} fill={wire ? "rgba(127,212,217,0.06)" : "#050403"} stroke={wire ? W : "none"} strokeWidth={1.2} />
          <circle cx={cx} cy={TRUCK_VIEW.wheelY} r="15" fill={wire ? "none" : "#1a130e"} stroke={wire ? W : "#2e231b"} strokeWidth={1} />
          {[0, 72, 144, 216, 288].map((a) => (
            <line
              key={a}
              x1={cx}
              y1={TRUCK_VIEW.wheelY}
              x2={round2(cx + 13 * Math.cos((a * Math.PI) / 180))}
              y2={round2(TRUCK_VIEW.wheelY + 13 * Math.sin((a * Math.PI) / 180))}
              stroke={wire ? W : "#3a2c22"}
              strokeWidth="2"
              strokeLinecap="round"
            />
          ))}
          <circle cx={cx} cy={TRUCK_VIEW.wheelY} r="4" fill={wire ? W : "#4a382b"} />
        </g>
      ))}
    </svg>
  );
}
