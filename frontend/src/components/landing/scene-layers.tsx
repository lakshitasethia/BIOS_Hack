// Seamless parallax tiles for the hero's dusk yard. Each tile is 4:1 (1600×400),
// drawn bottom-aligned to the horizon and repeated three times so it can wrap forever.

export const TILE = { w: 1600, h: 400 };

function Repeat({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`flex h-full w-max ${className}`}>
      {[0, 1, 2].map((i) => (
        <svg key={i} viewBox={`0 0 ${TILE.w} ${TILE.h}`} className="block h-full w-auto" style={{ aspectRatio: "4 / 1" }} aria-hidden>
          {children}
        </svg>
      ))}
    </div>
  );
}

// Far: hills and the industrial edge of town, softened by haze.
export function Skyline() {
  return (
    <Repeat>
      <g fill="rgba(74,46,40,0.5)">
        <path d="M0 400 V332 Q200 300 400 320 T800 308 T1200 324 T1600 332 V400 Z" />
        <rect x="170" y="250" width="34" height="150" />
        <rect x="210" y="270" width="34" height="130" />
        <circle cx="187" cy="250" r="17" />
        <circle cx="227" cy="270" r="17" />
        <rect x="500" y="170" width="8" height="230" />
        <rect x="610" y="170" width="8" height="230" />
        <rect x="470" y="160" width="220" height="12" />
        <path d="M470 166 L420 214 L426 218 L478 172 Z" />
        <rect x="790" y="300" width="270" height="100" />
        <path d="M790 300 L835 276 L835 300 L880 276 L880 300 L925 276 L925 300 L970 276 L970 300 L1015 276 L1015 300 L1060 276 L1060 300 Z" />
        <rect x="1236" y="260" width="6" height="140" />
        <rect x="1284" y="260" width="6" height="140" />
        <ellipse cx="1263" cy="250" rx="42" ry="22" />
        <rect x="1410" y="196" width="18" height="204" />
        <rect x="1440" y="240" width="12" height="160" />
      </g>
    </Repeat>
  );
}

// Mid: the yard — container stacks, a warehouse with lit dock doors, light poles.
export function Yard() {
  const container = (x: number, y: number, w: number, tone: string, k: number) => (
    <g key={`${x}-${y}`}>
      <rect x={x} y={y} width={w} height="52" fill={tone} stroke="#3a281d" strokeOpacity="0.5" />
      {Array.from({ length: Math.floor(w / 14) }, (_, i) => (
        <line key={i} x1={x + 7 + i * 14} y1={y + 4} x2={x + 7 + i * 14} y2={y + 48} stroke="#000" strokeOpacity={0.25 + (k % 2) * 0.1} />
      ))}
    </g>
  );
  return (
    <Repeat>
      <g>
        {container(40, 348, 190, "#1d1410", 0)}
        {container(40, 296, 190, "#24180f", 1)}
        {container(70, 244, 160, "#1a120d", 0)}
        {container(236, 348, 150, "#20160f", 1)}
        <rect x="430" y="228" width="440" height="172" fill="#160f0b" />
        <path d="M430 228 L650 206 L870 228 Z" fill="#1b130e" />
        {[470, 560, 650, 740].map((x) => (
          <g key={x}>
            <rect x={x} y="318" width="62" height="58" fill="#ffb469" opacity="0.85" />
            <rect x={x} y="318" width="62" height="6" fill="#fff0d8" opacity="0.6" />
          </g>
        ))}
        <rect x="430" y="380" width="440" height="20" fill="#0d0907" />
        {container(980, 348, 190, "#1c130e", 0)}
        {container(1010, 296, 160, "#24180f", 1)}
        {container(1176, 348, 120, "#1a120d", 1)}
        {container(1330, 348, 170, "#1f150f", 0)}
        {[330, 930, 1530].map((x) => (
          <g key={x}>
            <circle cx={x + 18} cy="138" r="46" fill="#ffcf8f" opacity="0.18" />
            <rect x={x} y="136" width="4" height="264" fill="#120c09" />
            <rect x={x} y="132" width="26" height="6" rx="2" fill="#1a120d" />
            <rect x={x + 14} y="136" width="10" height="3" fill="#fff0d0" />
          </g>
        ))}
      </g>
    </Repeat>
  );
}

// Near: blurred shrubs and fence posts racing past at the bottom of the frame.
export function Foreground() {
  return (
    <Repeat>
      <g fill="#020101">
        <ellipse cx="180" cy="420" rx="200" ry="150" />
        {/* the same shrub, one tile over — keeps the wrap seamless */}
        <ellipse cx="1780" cy="420" rx="200" ry="150" />
        <ellipse cx="420" cy="440" rx="150" ry="120" />
        <ellipse cx="900" cy="430" rx="230" ry="140" />
        <ellipse cx="1320" cy="440" rx="190" ry="130" />
        {[620, 700, 780, 1080, 1160].map((x) => (
          <rect key={x} x={x} y="250" width="10" height="150" />
        ))}
        <rect x="610" y="270" width="190" height="4" />
        <rect x="1070" y="270" width="100" height="4" />
      </g>
    </Repeat>
  );
}
