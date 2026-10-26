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
const H = 1478;
const BAR_W = 19;
const BAR_H = 110;

const C = {
  paper: "#f8faf0",
  bar: "#e6e6d1",
  line: "#b5b9a6",
  lime: "color(display-p3 0.8173 1 0.6575)",
  tan: "#e6b360",
  orange: "color(display-p3 1 0.3725 0.0078)",
  node: "#072c2c",
};

// The signal field: bars of mixed height, laid out in one band across the top.
const FIELD: { x: number; y: number }[] = [
  { x: 141, y: 56 },
  { x: 129, y: 99 },
  { x: 181, y: 56 },
  { x: 211, y: 56 },
  { x: 241, y: 56 },
  { x: 172, y: 43 },
  { x: 309, y: 56 },
  { x: 285, y: 46 },
  { x: 297, y: 87 },
  { x: 345, y: 14 },
  { x: 354, y: 56 },
  { x: 381, y: 56 },
  { x: 393, y: 71 },
  { x: 429, y: 15 },
  { x: 461, y: 56 },
  { x: 491, y: 56 },
  { x: 461, y: 87 },
  { x: 521, y: 56 },
  { x: 548, y: 78 },
  { x: 498, y: 1 },
  { x: 581, y: 56 },
  { x: 589, y: 43 },
  { x: 621, y: 36 },
  { x: 644, y: 56 },
  { x: 679, y: 76 },
  { x: 701, y: 56 },
  { x: 690, y: 68 },
  { x: 732, y: 92 },
  { x: 819, y: 36 },
  { x: 781, y: 56 },
  { x: 753, y: 6 },
  { x: 813, y: 68 },
  { x: 841, y: 56 },
  { x: 881, y: 56 },
  { x: 898, y: 13 },
  { x: 945, y: 56 },
  { x: 981, y: 56 },
  { x: 977, y: 46 },
  { x: 1041, y: 56 },
  { x: 1029, y: 69 },
  { x: 1081, y: 56 },
  { x: 1091, y: 46 },
  { x: 1141, y: 36 },
  { x: 1118, y: 63 },
  { x: 1181, y: 66 },
  { x: 1213, y: 15 },
  { x: 1221, y: 56 },
  { x: 1003, y: 94 },
  { x: 1261, y: 56 },
  { x: 1298, y: 56 },
  { x: 937, y: 69 },
  { x: 421, y: 56 },
  { x: 873, y: 85 },
];

// Mark: two posts around the docking slot, then three leaning bars, flush on the section edge.
const MARK_H = 111;
const MARK_TOP = H - MARK_H;
const POSTS = [615, 671];
const ZIGZAG = [0, 30, 60].map((o) => `${700 + o},${H} ${720 + o},${H} ${765 + o},${MARK_TOP} ${745 + o},${MARK_TOP}`);

// Side panels sit beside the mark and ease apart once the orange rider docks.
const PANEL_W = 595;
const PANEL_SLIDE = 80;
const PANEL_EASE = { transition: "transform 900ms cubic-bezier(0.16, 1, 0.3, 1)" } as const;

type Rider = {
  home: number;
  tone: "lime" | "orange";
  lag: number;
  // Scroll-line value at which the rider reaches the end of its path (default: 1:1 with scroll).
  arrive?: number;
  d: (cx: number, cy: number) => string;
};

// Routes: dotted lanes that leave the field, cross over one another in the gap between the
// first two captions, and run out to the edges. The captions sit in the middle column and
// every crossing happens in the open space between them. Each path starts at the foot of its
// bar and the rider follows it head first, so it leaves exactly from its resting place.
// `lag` holds a rider back behind the scroll line so they leave one after another.
const RIDERS: Rider[] = [
  {
    home: 51,
    tone: "lime",
    lag: 0,
    d: () => "M430 166V259.611C430 302.154 456.917 340.039 497.09 354.04L896.91 493.383C937.083 507.384 964 545.27 964 587.813V741C964 776.07 992.43 804.5 1027.5 804.5H1440",
  },
  {
    home: 50,
    tone: "lime",
    lag: 70,
    d: () => "M946.5 179V273.897C946.5 315.809 920.364 353.274 881.029 367.746L541.471 492.677C502.136 507.149 476 544.614 476 586.526V691V767.5C476 822.728 431.228 867.5 376 867.5H0",
  },
  {
    home: 47,
    tone: "orange",
    lag: 40,
    arrive: H - 20,
    d: () =>
      "M1013 206V315.552C1013 326.771 1011.11 337.909 1007.42 348.502L907.084 635.998C903.388 646.591 901.5 657.729 901.5 668.948V1109.5C901.5 1164.73 856.728 1209.5 801.5 1209.5H753.5C698.272 1209.5 653.5 1254.27 653.5 1309.5V1367",
  },
  {
    home: 52,
    tone: "lime",
    lag: 140,
    d: () => "M882 195V288.411C882 306.881 887.115 324.99 896.779 340.731L1021.22 543.427C1030.88 559.168 1036 577.277 1036 595.747V791.735C1036 829.713 1066.79 860.5 1104.76 860.5H1440",
  },
  {
    home: 18,
    tone: "lime",
    lag: 210,
    d: () => "M557 188V288.567C557 306.939 551.939 324.956 542.372 340.64L418.628 543.518C409.061 559.203 404 577.219 404 595.591V691.735V810C404 865.228 359.228 910 304 910H0",
  },
];

const RIDER_HOMES = new Set(RIDERS.map((r) => r.home));

// Pill-shaped gates on the four side lanes (centre x, centre y).
const NODES = [
  [476, 695.5],
  [404, 695.5],
  [964, 694.5],
  [1036, 694.5],
];

// Caption column, in viewBox units (centred on x = 720): 310 wide, one gap between each.
const CAPTION_W = 310;

const CAPTIONS = [
  { y: 339, text: "Monsoon alerts land on highways carrying your trucks" },
  { y: 594, text: "Port gates jam for hours and quietly delay your orders" },
  { y: 861, text: "Suppliers slip by days before anyone connects the dots" },
  { y: 1128, text: "Stock runs out when every fix is already expensive" },
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
  const a = Math.max(0, lo - 5);
  const b = Math.min(SAMPLES, hi + 5);
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
    let last = performance.now();
    let wasDocked = false;

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
          if (w) w.style.opacity = String(0.22 + 0.78 * clamp01(lp - wi));
        });
      });

      // Once the rider docks, the mark warms to orange and the panels ease apart (timed, not scrubbed).
      const docked = orangeLeft < 14;
      if (docked !== wasDocked) {
        wasDocked = docked;
        if (markGlowRef.current) markGlowRef.current.style.opacity = docked ? "1" : "0";
        if (panelLeftRef.current) panelLeftRef.current.style.transform = `translateX(${docked ? -PANEL_SLIDE : 0}px)`;
        if (panelRightRef.current) panelRightRef.current.style.transform = `translateX(${docked ? PANEL_SLIDE : 0}px)`;
      }
    };

    if (reduced) {
      render(H * 2);
      return;
    }

    const tick = (now: number) => {
      // Frame-rate independent easing toward the scroll position.
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const diff = target - current;
      current = Math.abs(diff) < 0.1 ? target : current + diff * (1 - Math.exp(-dt * 9));
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

      <div
        ref={stageRef}
        className="relative mx-auto mt-12 w-full max-w-[1440px]"
        style={{ aspectRatio: `${vbW} / ${H}`, containerType: "inline-size" }}
      >
        <svg viewBox={`${vbX} 0 ${vbW} ${H}`} className="absolute inset-0 size-full overflow-visible" aria-hidden>
          {RIDERS.map((r, i) => {
            const b = FIELD[r.home];
            return (
              <path
                key={i}
                ref={(el) => {
                  pathRefs.current[i] = el;
                }}
                d={r.d(b.x + BAR_W / 2, b.y + BAR_H)}
                fill="none"
                stroke={C.line}
                strokeWidth={1}
                strokeDasharray="2 2"
                vectorEffect="non-scaling-stroke"
              />
            );
          })}

          {NODES.map(([x, y], i) => (
            <g key={i} stroke={C.node} strokeWidth={1} vectorEffect="non-scaling-stroke">
              <rect x={x - 20} y={y - 3.5} width={40} height={7} rx={3.5} fill={C.paper} vectorEffect="non-scaling-stroke" />
              <line x1={x - 20} y1={y - 2} x2={x - 20} y2={y + 2} vectorEffect="non-scaling-stroke" />
              <line x1={x + 20} y1={y - 2} x2={x + 20} y2={y + 2} vectorEffect="non-scaling-stroke" />
              <line x1={x - 9} y1={y} x2={x + 9} y2={y} strokeOpacity={0.55} vectorEffect="non-scaling-stroke" />
            </g>
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
              <rect x={0} y={0} width={W} height={H} />
            </clipPath>
          </defs>
          <g clipPath="url(#signal-content)">
            <g ref={panelLeftRef} style={PANEL_EASE}>
              <TruckPanel x={0} mirrored />
            </g>
            <g ref={panelRightRef} style={PANEL_EASE}>
              <TruckPanel x={W - PANEL_W} />
            </g>
          </g>

          <Mark fill={C.tan} />
          <g ref={markGlowRef} style={{ opacity: 0, transition: "opacity 600ms cubic-bezier(0.16, 1, 0.3, 1)" }}>
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
                y={-BAR_H}
                width={BAR_W}
                height={BAR_H}
                transform={`translate(${b.x + BAR_W / 2} ${b.y + BAR_H})`}
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
            className="absolute -translate-x-1/2 -translate-y-1/2 text-center font-medium text-[#4b5148]"
            style={{
              left: pct(720),
              top: `${(c.y / H) * 100}%`,
              // the column scales with the stage so lines never reach the text, at any width
              width: narrow ? "68%" : `${(CAPTION_W / vbW) * 100}%`,
              fontSize: narrow ? "1rem" : "clamp(0.8125rem, 1.25cqw, 1.1875rem)",
              lineHeight: 1.4,
              letterSpacing: "-0.005em",
              textShadow: "0 0 10px #f8faf0, 0 0 18px #f8faf0",
            }}
          >
            {c.text.split(" ").map((word, wi) => (
              <span
                key={wi}
                ref={(el) => {
                  wordRefs.current[ci][wi] = el;
                }}
                style={{ opacity: 0.22 }}
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
        <rect key={x} x={x} y={MARK_TOP} width={20} height={MARK_H} />
      ))}
      {ZIGZAG.map((pts) => (
        <polygon key={pts} points={pts} />
      ))}
    </g>
  );
}

// Side-on strip of a truck and the traffic queued behind it, on a flat panel flush with the
// edge. Drawn for the right-hand side; the left panel is its mirror image.
const QUEUE: [number, number][] = [
  [328, 4],
  [353, 8],
  [382, 15],
  [418, 11],
  [456, 8],
  [490, 12],
  [522, 6],
  [553, 10],
  [577, 5],
];

function TruckPanel({ x, mirrored = false }: { x: number; mirrored?: boolean }) {
  const cy = MARK_TOP + MARK_H / 2;
  const top = cy - 20;
  // vehicle: body, centre tick, and a rail above and below
  const vehicle = (vx: number, w: number, rail: number) => (
    <g key={vx}>
      <rect x={x + vx} y={top} width={w} height={40} />
      <line x1={x + vx + w / 2 - 2.5} y1={cy} x2={x + vx + w / 2 + 2.5} y2={cy} />
      {w >= 6 && (
        <>
          <line x1={x + vx + (w - rail) / 2} y1={cy - 24} x2={x + vx + (w + rail) / 2} y2={cy - 24} strokeWidth={2} />
          <line x1={x + vx + (w - rail) / 2} y1={cy + 23} x2={x + vx + (w + rail) / 2} y2={cy + 23} strokeWidth={2} />
        </>
      )}
    </g>
  );
  return (
    <g
      transform={mirrored ? `translate(${2 * x + PANEL_W} 0) scale(-1 1)` : undefined}
      stroke={C.line}
      strokeWidth={1}
      fill="none"
      vectorEffect="non-scaling-stroke"
    >
      <rect x={x} y={MARK_TOP} width={PANEL_W} height={MARK_H} fill={C.bar} stroke="none" />
      {vehicle(25, 215, 108)}
      {vehicle(260, 47, 24)}
      {QUEUE.map(([vx, w]) => vehicle(vx, w, Math.max(2, w - 4)))}
    </g>
  );
}
