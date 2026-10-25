"use client";

import { useEffect, useRef, useState } from "react";

/*
 * "Signal → decision" scroll story — DESIGN.md §7.5.
 * A field of signal bars; a few light up, leave the field and ride their dotted
 * route down the page (oriented along the path) while captions fill in word by word.
 * The orange one — the disruption that matters — lands in a single recommendation.
 * Progress is tied to scroll and eased with a lerp so the motion trails the wheel.
 */

const W = 1440;
const H = 1320;
const BAR_W = 20;
const BAR_H = 110;
const FIELD_TOP = 24;

// Deterministic jitter so server and client render the same field.
function seeded(i: number) {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

const FIELD = Array.from({ length: 58 }, (_, i) => ({
  x: Math.round((392 + i * 11.4 + (seeded(i) - 0.5) * 6) * 10) / 10,
  y: FIELD_TOP + Math.round((seeded(i + 99) - 0.35) * 44),
}));

type Rider = { home: number; tone: "tide" | "signal"; window: [number, number]; d: (cx: number, cy: number) => string };

// Each rider starts at its bar's centre, so t=0 is exactly its resting place.
const RIDERS: Rider[] = [
  {
    home: 12,
    tone: "tide",
    window: [0.04, 0.42],
    d: (x, y) => `M${x} ${y} L${x} ${y + 90} C${x} 330, 520 360, 520 470 L520 640 C520 700, 470 712, -160 712`,
  },
  {
    home: 19,
    tone: "tide",
    window: [0.1, 0.48],
    d: (x, y) => `M${x} ${y} L${x} ${y + 120} C${x} 320, 900 340, 905 470 L905 640 C905 690, 940 700, ${W + 160} 700`,
  },
  {
    home: 38,
    tone: "tide",
    window: [0.16, 0.54],
    d: (x, y) => `M${x} ${y} L${x} ${y + 100} C${x} 330, 560 350, 556 480 L556 650 C556 706, 520 730, -160 730`,
  },
  {
    home: 47,
    tone: "tide",
    window: [0.22, 0.6],
    d: (x, y) => `M${x} ${y} L${x} ${y + 80} C${x} 300, 940 360, 940 480 L940 650 C940 704, 980 720, ${W + 160} 720`,
  },
  {
    home: 31,
    tone: "signal",
    window: [0.3, 0.86],
    d: (x, y) => `M${x} ${y} L${x} ${y + 140} C${x} 420, 780 470, 780 620 L780 920 C780 990, 720 990, 720 1040 L720 1060`,
  },
];

const RIDER_HOMES = new Set(RIDERS.map((r) => r.home));

const NODES = [
  [520, 640],
  [556, 650],
  [905, 640],
  [940, 650],
];

const CAPTIONS = [
  { y: 300, text: "Monsoon alerts land on highways carrying your trucks", window: [0.06, 0.24] },
  { y: 470, text: "Port gates jam for hours and quietly delay your orders", window: [0.24, 0.42] },
  { y: 640, text: "Suppliers slip by days before anyone connects the dots", window: [0.42, 0.6] },
  { y: 830, text: "Stock runs out when every fix is already expensive", window: [0.6, 0.78] },
] as const;

const CARD_Y = 1118;

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const local = (p: number, [a, b]: readonly [number, number]) => clamp01((p - a) / (b - a));
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

export function SignalField() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const pathRefs = useRef<(SVGPathElement | null)[]>([]);
  const riderRefs = useRef<(SVGRectElement | null)[]>([]);
  const wordRefs = useRef<(HTMLSpanElement | null)[][]>(CAPTIONS.map(() => []));
  const cardRef = useRef<HTMLDivElement>(null);
  const [narrow, setNarrow] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const update = () => setNarrow(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let current = 0;
    let target = 0;
    let raf = 0;

    const measure = () => {
      const el = sectionRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight;
      // 0 when the field's top reaches 75% of the viewport, 1 when its bottom reaches 85%.
      target = clamp01((vh * 0.75 - r.top) / (r.height - vh * 0.1));
    };

    const render = (p: number) => {
      RIDERS.forEach((rider, i) => {
        const path = pathRefs.current[i];
        const rect = riderRefs.current[i];
        if (!path || !rect) return;
        const t = easeInOut(local(p, rider.window));
        const len = path.getTotalLength();
        const at = path.getPointAtLength(t * len);
        const ahead = path.getPointAtLength(Math.min(len, t * len + 2));
        const behind = path.getPointAtLength(Math.max(0, t * len - 2));
        const angle = t === 0 ? 0 : (Math.atan2(ahead.y - behind.y, ahead.x - behind.x) * 180) / Math.PI - 90;
        rect.setAttribute("transform", `translate(${at.x} ${at.y}) rotate(${angle})`);
        // Lights up just before it leaves the field.
        rect.style.fillOpacity = String(0.08 + 0.92 * clamp01((p - (rider.window[0] - 0.04)) / 0.04));
      });

      CAPTIONS.forEach((c, ci) => {
        const words = wordRefs.current[ci];
        const lp = local(p, c.window) * words.length;
        words.forEach((w, wi) => {
          if (w) w.style.opacity = String(0.22 + 0.78 * clamp01(lp - wi));
        });
      });

      const card = cardRef.current;
      if (card) {
        const c = clamp01((p - 0.84) / 0.08);
        card.style.opacity = String(c);
        card.style.transform = `translate(-50%, ${(1 - c) * 16}px)`;
      }
    };

    if (reduced) {
      render(1);
      return;
    }

    const tick = () => {
      current += (target - current) * 0.09;
      if (Math.abs(target - current) < 0.0005) current = target;
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
  }, []);

  // On phones, crop to the centre of the composition so the bars stay legible.
  const vbX = narrow ? 300 : 0;
  const vbW = narrow ? 840 : W;
  const pct = (x: number) => `${((x - vbX) / vbW) * 100}%`;

  return (
    <section id="how-it-works" className="relative overflow-hidden bg-night-950">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(60% 40% at 50% 45%, rgba(7,80,86,0.28), transparent 70%), linear-gradient(to bottom, var(--color-night-950), var(--color-night-900) 55%, var(--color-night-950))",
        }}
      />

      <div className="relative mx-auto max-w-7xl px-5 pt-24 text-center md:px-8 md:pt-28">
        <p className="label text-text-subtle">The problem</p>
        <h2 className="mx-auto mt-4 max-w-3xl text-[clamp(2rem,3.8vw,3.25rem)] font-normal leading-[1.08] tracking-[-0.03em] text-balance">
          Thousands of signals a day. <span className="text-text-muted">A few will break your week.</span>
        </h2>
      </div>

      <div ref={sectionRef} className="relative mx-auto mt-10 w-full max-w-[1440px]" style={{ aspectRatio: `${vbW} / ${H}` }}>
        <svg
          viewBox={`${vbX} 0 ${vbW} ${H}`}
          className="absolute inset-0 size-full"
          style={{ maskImage: "linear-gradient(to right, transparent, #000 14%, #000 86%, transparent)" }}
          aria-hidden
        >
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
                stroke="rgba(228,238,240,0.22)"
                strokeWidth={1}
                strokeDasharray="2 3"
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
              fill="var(--color-night-950)"
              stroke="rgba(228,238,240,0.55)"
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
                fill="rgba(228,238,240,0.05)"
                stroke="rgba(228,238,240,0.2)"
                strokeWidth={1}
                vectorEffect="non-scaling-stroke"
              />
            ),
          )}

          {RIDERS.map((r, i) => {
            const b = FIELD[r.home];
            const color = r.tone === "signal" ? "var(--color-signal-500)" : "var(--color-tide-300)";
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
                fill={color}
                fillOpacity={0.08}
                stroke={color}
                strokeWidth={1}
                vectorEffect="non-scaling-stroke"
              />
            );
          })}
        </svg>

        {CAPTIONS.map((c, ci) => (
          <p
            key={ci}
            className="absolute w-[min(17rem,70%)] -translate-x-1/2 -translate-y-1/2 text-center text-[0.9375rem] font-medium leading-snug md:text-base"
            style={{ left: pct(720), top: `${(c.y / H) * 100}%` }}
          >
            {c.text.split(" ").map((word, wi) => (
              <span
                key={wi}
                ref={(el) => {
                  wordRefs.current[ci][wi] = el;
                }}
                style={{ opacity: 0.22 }}
                className="transition-none"
              >
                {word}{" "}
              </span>
            ))}
          </p>
        ))}

        <div
          ref={cardRef}
          className="absolute w-[min(22rem,88%)] rounded-xl border border-accent/45 bg-night-900/90 p-4 text-left shadow-[0_0_32px_-8px_rgba(255,91,4,0.45)] backdrop-blur"
          style={{ left: pct(720), top: `${(CARD_Y / H) * 100}%`, opacity: 0, transform: "translate(-50%, 16px)" }}
        >
          <p className="label text-accent">One clear decision</p>
          <p className="mt-2 text-[1.0625rem] font-medium">Reroute SHP-1042 via NH-52</p>
          <p className="mt-1 font-mono text-[0.8125rem] text-text-muted">+2h 10m · saves ₹6.2L · ready to approve</p>
        </div>
      </div>
    </section>
  );
}
