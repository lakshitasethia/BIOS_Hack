"use client";

import { useEffect, useRef, useState } from "react";

/*
 * "Signal → decision" scroll story — DESIGN.md §7.5.
 * A field of signal bars; a few light up, leave the field and ride their dotted
 * route down the page, oriented along the path, while captions fill in word by word.
 * Riders track the scroll position 1:1 (a horizontal "scroll line" through the
 * viewport), so they glide down with the reader instead of racing ahead.
 * The orange rider — the disruption that matters — docks into the mark at the bottom.
 */

const W = 1440;
const H = 1420;
const BAR_W = 20;
const BAR_H = 110;
const FIELD_TOP = 24;

const C = {
  paper: "#f8faf0",
  bar: "#e6e6d1",
  line: "#b5b9a6",
  lime: "color(display-p3 0.8173 1 0.6575)",
  tan: "#e6b360",
  orange: "color(display-p3 1 0.3725 0.0078)",
  node: "#072c2c",
};

// Deterministic jitter so server and client render the same field.
function seeded(i: number) {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

const FIELD = Array.from({ length: 58 }, (_, i) => ({
  x: Math.round((392 + i * 11.4 + (seeded(i) - 0.5) * 6) * 10) / 10,
  y: FIELD_TOP + Math.round((seeded(i + 99) - 0.35) * 44),
}));

// Mark: two posts around the docking slot, then our zigzag, sitting flush on the section edge.
const MARK_H = 92;
const MARK_TOP = H - MARK_H;
const MARK_X = 621;
const POSTS = [MARK_X, MARK_X + 46];
const SLOT_X = MARK_X + 22;
const ZIG_X = MARK_X + 80;
const ZIGZAG = [
  `${ZIG_X},${H} ${ZIG_X + 20},${H} ${ZIG_X + 54},${MARK_TOP} ${ZIG_X + 34},${MARK_TOP}`,
  `${ZIG_X + 34},${MARK_TOP} ${ZIG_X + 54},${MARK_TOP} ${ZIG_X + 88},${H} ${ZIG_X + 68},${H}`,
  `${ZIG_X + 68},${H} ${ZIG_X + 88},${H} ${ZIG_X + 122},${MARK_TOP} ${ZIG_X + 102},${MARK_TOP}`,
];
// The docked rider stands taller than the posts, its foot just above the edge.
const DOCK = { x: SLOT_X + BAR_W / 2, y: H - 10 - BAR_H / 2 };

// Side panels start beside the mark and slide out into the content edges (clipped there).
const CONTENT = { left: 126, right: W - 126 };
const PANEL_W = 264;
const PANEL_SLIDE = 150;

type Rider = {
  home: number;
  tone: "lime" | "orange";
  lag: number;
  // Scroll-line value at which the rider reaches the end of its path (default: 1:1 with scroll).
  arrive?: number;
  d: (cx: number, cy: number) => string;
};

// Each path starts at its bar's centre, so the rider leaves exactly from its resting place.
// `lag` holds a rider back behind the scroll line so they leave one after another.
const RIDERS: Rider[] = [
  {
    home: 12,
    tone: "lime",
    lag: 0,
    d: (x, y) => `M${x} ${y} L${x} ${y + 90} C${x} 340, 520 370, 520 480 L520 660 C520 720, 470 732, -420 732`,
  },
  {
    home: 19,
    tone: "lime",
    lag: 70,
    d: (x, y) => `M${x} ${y} L${x} ${y + 120} C${x} 330, 905 350, 905 480 L905 660 C905 712, 940 722, ${W + 420} 722`,
  },
  {
    home: 38,
    tone: "lime",
    lag: 140,
    d: (x, y) => `M${x} ${y} L${x} ${y + 100} C${x} 340, 556 360, 556 490 L556 670 C556 726, 520 750, -420 750`,
  },
  {
    home: 47,
    tone: "lime",
    lag: 210,
    d: (x, y) => `M${x} ${y} L${x} ${y + 80} C${x} 310, 940 370, 940 490 L940 670 C940 724, 980 740, ${W + 420} 740`,
  },
  {
    home: 31,
    tone: "orange",
    lag: 120,
    arrive: 1060,
    d: (x, y) =>
      `M${x} ${y} L${x} ${y + 140} C${x} 430, 790 480, 790 640 L790 960 C790 1050, 760 1080, 700 1080 L700 1080 C${DOCK.x} 1080, ${DOCK.x} 1140, ${DOCK.x} 1200 L${DOCK.x} ${DOCK.y}`,
  },
];

const RIDER_HOMES = new Set(RIDERS.map((r) => r.home));

const NODES = [
  [520, 660],
  [556, 670],
  [905, 660],
  [940, 670],
];

const CAPTIONS = [
  { y: 310, text: "Monsoon alerts land on highways carrying your trucks" },
  { y: 480, text: "Port gates jam for hours and quietly delay your orders" },
  { y: 650, text: "Suppliers slip by days before anyone connects the dots" },
  { y: 860, text: "Stock runs out when every fix is already expensive" },
];

// Path sampled into a lookup table. The key advances with vertical travel, and with
// horizontal travel on flat stretches, so motion keeps pace with the scroll everywhere.
type Track = { xs: Float32Array; ys: Float32Array; keys: Float32Array; total: number };
const SAMPLES = 360;

function buildTrack(path: SVGPathElement): Track {
  const len = path.getTotalLength();
  const xs = new Float32Array(SAMPLES + 1);
  const ys = new Float32Array(SAMPLES + 1);
  const keys = new Float32Array(SAMPLES + 1);
  for (let i = 0; i <= SAMPLES; i++) {
    const p = path.getPointAtLength((i / SAMPLES) * len);
    xs[i] = p.x;
    ys[i] = p.y;
    if (i > 0) keys[i] = keys[i - 1] + Math.max(Math.abs(p.y - ys[i - 1]), Math.abs(p.x - xs[i - 1]));
  }
  return { xs, ys, keys, total: keys[SAMPLES] };
}

function sample(track: Track, v: number) {
  const { xs, ys, keys, total } = track;
  const k = Math.min(Math.max(v, 0), total);
  let lo = 0;
  let hi = SAMPLES;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (keys[mid] <= k) lo = mid;
    else hi = mid;
  }
  const span = keys[hi] - keys[lo] || 1;
  const f = (k - keys[lo]) / span;
  const x = xs[lo] + (xs[hi] - xs[lo]) * f;
  const y = ys[lo] + (ys[hi] - ys[lo]) * f;
  const a = Math.max(0, lo - 2);
  const b = Math.min(SAMPLES, hi + 2);
  const angle = k <= 0 ? 0 : (Math.atan2(ys[b] - ys[a], xs[b] - xs[a]) * 180) / Math.PI - 90;
  return { x, y, angle };
}

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

export function SignalField() {
  const stageRef = useRef<HTMLDivElement>(null);
  const pathRefs = useRef<(SVGPathElement | null)[]>([]);
  const riderRefs = useRef<(SVGRectElement | null)[]>([]);
  const wordRefs = useRef<(HTMLSpanElement | null)[][]>(CAPTIONS.map(() => []));
  const markGlowRef = useRef<SVGGElement>(null);
  const panelLeftRef = useRef<SVGGElement>(null);
  const panelRightRef = useRef<SVGGElement>(null);
  const [narrow, setNarrow] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const update = () => setNarrow(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    const tracks = pathRefs.current.map((p) => (p ? buildTrack(p) : null));
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let current = 0;
    let target = 0;
    let raf = 0;

    // Scroll line: the stage's y (in viewBox units) currently sitting at 58% of the viewport.
    const measure = () => {
      const el = stageRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      target = ((window.innerHeight * 0.58 - r.top) / r.height) * H;
    };

    const render = (line: number) => {
      let orangeLeft = Infinity;

      RIDERS.forEach((rider, i) => {
        const track = tracks[i];
        const rect = riderRefs.current[i];
        if (!track || !rect) return;
        const start = track.ys[0] + rider.lag;
        const end = rider.arrive ?? start + track.total;
        const v = ((line - start) / (end - start)) * track.total;
        const { x, y, angle } = sample(track, v);
        rect.setAttribute("transform", `translate(${x} ${y}) rotate(${angle})`);
        if (rider.tone === "orange") orangeLeft = track.total - v;
      });

      CAPTIONS.forEach((c, ci) => {
        const words = wordRefs.current[ci];
        const lp = clamp01((line - (c.y - 150)) / 190) * words.length;
        words.forEach((w, wi) => {
          if (w) w.style.opacity = String(0.2 + 0.8 * clamp01(lp - wi));
        });
      });

      // Mark warms to orange as the rider docks; side panels part to make room.
      const dock = clamp01(1 - orangeLeft / 40);
      const part = clamp01(1 - orangeLeft / 360);
      if (markGlowRef.current) markGlowRef.current.style.opacity = String(dock);
      panelLeftRef.current?.setAttribute("transform", `translate(${-PANEL_SLIDE * part} 0)`);
      panelRightRef.current?.setAttribute("transform", `translate(${PANEL_SLIDE * part} 0)`);
    };

    if (reduced) {
      render(H * 2);
      return;
    }

    const tick = () => {
      const diff = target - current;
      current = Math.abs(diff) < 0.1 ? target : current + diff * 0.14;
      render(current);
      raf = requestAnimationFrame(tick);
    };

    measure();
    current = target;
    render(current);
    raf = requestAnimationFrame(tick);
    window.addEventListener("scroll", measure, { passive: true });
    window.addEventListener("resize", measure);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", measure);
      window.removeEventListener("resize", measure);
    };
  }, [narrow]);

  // On phones, crop to the centre of the composition so the bars stay legible.
  const vbX = narrow ? 300 : 0;
  const vbW = narrow ? 840 : W;
  const pct = (x: number) => `${((x - vbX) / vbW) * 100}%`;

  return (
    <section id="how-it-works" data-nav="light" className="relative overflow-hidden" style={{ background: C.paper, color: "#000" }}>
      <div className="relative mx-auto max-w-7xl px-5 pt-24 text-center md:px-8 md:pt-28">
        <h2 className="mx-auto max-w-3xl text-[clamp(2rem,3.6vw,3rem)] font-medium leading-[1.1] tracking-[-0.03em] text-balance">
          Thousands of signals a day. A few will break your week.
        </h2>
      </div>

      <div ref={stageRef} className="relative mx-auto mt-12 w-full max-w-[1440px]" style={{ aspectRatio: `${vbW} / ${H}` }}>
        <svg viewBox={`${vbX} 0 ${vbW} ${H}`} className="absolute inset-0 size-full overflow-visible" aria-hidden>
          {RIDERS.map((r, i) => {
            const b = FIELD[r.home];
            return (
              <path
                key={i}
                ref={(el) => {
                  pathRefs.current[i] = el;
                }}
                d={r.d(b.x + BAR_W / 2, b.y + BAR_H / 2)}
                fill="none"
                stroke={C.line}
                strokeWidth={1}
                strokeDasharray="2 2"
                vectorEffect="non-scaling-stroke"
              />
            );
          })}

          {NODES.map(([x, y], i) => (
            <rect
              key={i}
              x={x - 11}
              y={y - 3}
              width={22}
              height={6}
              rx={3}
              fill={C.paper}
              stroke={C.node}
              strokeWidth={1}
              vectorEffect="non-scaling-stroke"
            />
          ))}

          {FIELD.map((b, i) =>
            RIDER_HOMES.has(i) ? null : (
              <rect
                key={i}
                x={b.x}
                y={b.y}
                width={BAR_W}
                height={BAR_H}
                fill={C.bar}
                stroke={C.line}
                strokeOpacity={0.55}
                strokeWidth={1}
                vectorEffect="non-scaling-stroke"
              />
            ),
          )}

          <defs>
            <clipPath id="signal-content">
              <rect x={CONTENT.left} y={0} width={CONTENT.right - CONTENT.left} height={H} />
            </clipPath>
          </defs>
          <g clipPath="url(#signal-content)">
            <g ref={panelLeftRef}>
              <TruckPanel x={MARK_X - 120 - PANEL_W} />
            </g>
            <g ref={panelRightRef}>
              <TruckPanel x={ZIG_X + 122 + 120} mirrored />
            </g>
          </g>

          <Mark fill={C.tan} />
          <g ref={markGlowRef} style={{ opacity: 0 }}>
            <Mark fill={C.orange} />
          </g>

          {RIDERS.map((r, i) => {
            const b = FIELD[r.home];
            return (
              <rect
                key={i}
                ref={(el) => {
                  riderRefs.current[i] = el;
                }}
                x={-BAR_W / 2}
                y={-BAR_H / 2}
                width={BAR_W}
                height={BAR_H}
                transform={`translate(${b.x + BAR_W / 2} ${b.y + BAR_H / 2})`}
                style={{ fill: r.tone === "orange" ? C.orange : C.lime }}
                stroke={r.tone === "orange" ? "none" : C.line}
                strokeOpacity={0.6}
                strokeWidth={1}
                vectorEffect="non-scaling-stroke"
              />
            );
          })}
        </svg>

        {CAPTIONS.map((c, ci) => (
          <p
            key={ci}
            className="absolute w-[min(17rem,70%)] -translate-x-1/2 -translate-y-1/2 text-center text-base font-medium leading-snug md:text-lg"
            style={{ left: pct(720), top: `${(c.y / H) * 100}%` }}
          >
            {c.text.split(" ").map((word, wi) => (
              <span
                key={wi}
                ref={(el) => {
                  wordRefs.current[ci][wi] = el;
                }}
                style={{ opacity: 0.2 }}
              >
                {word}{" "}
              </span>
            ))}
          </p>
        ))}
      </div>
    </section>
  );
}

function Mark({ fill }: { fill: string }) {
  return (
    <g style={{ fill }}>
      {POSTS.map((x) => (
        <rect key={x} x={x} y={MARK_TOP} width={18} height={MARK_H} />
      ))}
      {ZIGZAG.map((pts) => (
        <polygon key={pts} points={pts} />
      ))}
    </g>
  );
}

// Top-down wireframe of a truck (cab + trailer + axles) on a flat panel, flush with the edge.
function TruckPanel({ x, mirrored = false }: { x: number; mirrored?: boolean }) {
  const top = H - MARK_H;
  const cy = top + MARK_H / 2;
  const cabX = mirrored ? x + PANEL_W - 70 : x + 30;
  const trailerX = mirrored ? x + 22 : x + 82;
  return (
    <g stroke={C.line} strokeWidth={1} fill="none" vectorEffect="non-scaling-stroke">
      <rect x={x} y={top} width={PANEL_W} height={MARK_H} fill={C.bar} stroke="none" />
      <rect x={cabX} y={cy - 18} width={40} height={36} />
      <rect x={trailerX} y={cy - 18} width={160} height={36} />
      {[cabX + 8, trailerX + 30, trailerX + 110].map((ax) => (
        <g key={ax}>
          <line x1={ax} y1={cy - 26} x2={ax + 24} y2={cy - 26} strokeWidth={2} />
          <line x1={ax} y1={cy + 26} x2={ax + 24} y2={cy + 26} strokeWidth={2} />
        </g>
      ))}
      <line x1={cabX + 16} y1={cy} x2={cabX + 24} y2={cy} />
      <line x1={trailerX + 76} y1={cy} x2={trailerX + 84} y2={cy} />
      <rect x={mirrored ? x + PANEL_W - 14 : x + 10} y={cy - 18} width={4} height={36} />
    </g>
  );
}
