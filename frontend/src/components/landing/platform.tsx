"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";

const FEATURES = [
  {
    title: "Detect every disruption",
    body: "Weather alerts, traffic, port queues, supplier ETAs and stock levels stream into one live view of your network.",
    tag: ["Signal", "IMD red alert · Khandala ghat"],
  },
  {
    title: "Assess the real impact",
    body: "Each signal is matched to the shipments, SKUs and customers it touches, then scored for delay, cost and risk.",
    tag: ["Risk 78 · At risk", "6 shipments · ₹18.4L at stake"],
  },
  {
    title: "Recommend the best response",
    body: "Ranked reroutes, stock transfers and supplier switches, each with the time, cost and risk trade-off spelled out.",
    tag: ["Option A · Recommended", "Reroute via old NH-48 · +1h 40m"],
  },
  {
    title: "Approve and track in one click",
    body: "Your team stays in control. Approve an action and watch the route, ETA and stock plan update live.",
    tag: ["Approved · 14:20 IST", "New ETA 21:40 · on track"],
  },
];

const CYCLE_MS = 6000;

export function Platform() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const id = setTimeout(() => setActive((a) => (a + 1) % FEATURES.length), CYCLE_MS);
    return () => clearTimeout(id);
  }, [active, paused]);

  return (
    <section id="platform" className="bg-black py-20 text-white md:py-24">
      <div className="mx-auto grid max-w-7xl gap-12 px-5 md:px-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:gap-10">
        <div className="flex flex-col">
          <p className="label text-white/70">Platform</p>
          <h2 className="mt-4 max-w-lg text-[clamp(2.25rem,4vw,3.25rem)] font-medium leading-[1.08] tracking-[-0.03em]">
            One control tower from first signal to final decision
          </h2>

          <ul className="mt-12 flex flex-col gap-1 lg:mt-auto" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
            {FEATURES.map((f, i) => {
              const on = i === active;
              return (
                <li key={f.title}>
                  <button
                    onClick={() => setActive(i)}
                    aria-expanded={on}
                    className={`focus-ring relative w-full rounded-sm border-l py-3 pl-4 text-left transition-colors ${
                      on ? "border-cyan" : "border-transparent"
                    }`}
                  >
                    <span className={`block text-[1.0625rem] font-medium ${on ? "text-white" : "text-white/55 hover:text-white/80"}`}>
                      {f.title}
                    </span>
                    <AnimatePresence initial={false}>
                      {on && (
                        <motion.span
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                          className="block overflow-hidden"
                        >
                          <span className="block max-w-md pt-2 text-[0.9375rem] leading-relaxed text-white/75">{f.body}</span>
                        </motion.span>
                      )}
                    </AnimatePresence>
                    {on && !paused && (
                      <motion.span
                        key={active}
                        aria-hidden
                        className="absolute -left-px top-0 w-px origin-top bg-white"
                        initial={{ height: 0 }}
                        animate={{ height: "100%" }}
                        transition={{ duration: CYCLE_MS / 1000, ease: "linear" }}
                      />
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="relative">
          <IsoYard active={active} />
          <AnimatePresence mode="wait">
            <motion.div
              key={active}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3 }}
              className="absolute left-[6%] top-[8%] rounded-md border border-cyan/40 bg-black/80 px-3.5 py-2.5 backdrop-blur"
            >
              <p className="label text-cyan">{FEATURES[active].tag[0]}</p>
              <p className="mt-1 font-mono text-[0.8125rem] text-white/85">{FEATURES[active].tag[1]}</p>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}

/* ---------- Isometric wireframe yard: containers, truck, pallets, a route ---------- */

const COS = Math.cos(Math.PI / 6);
const SIN = Math.sin(Math.PI / 6);
const OX = 330;
const OY = 150;
const iso = (x: number, y: number, z = 0): [number, number] => [OX + (x - y) * COS, OY + (x + y) * SIN - z];
const pt = (p: [number, number]) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`;

type Box = { x: number; y: number; z?: number; w: number; d: number; h: number; ribs?: number };

function BoxWire({ x, y, z = 0, w, d, h, ribs = 0, strong }: Box & { strong?: boolean }) {
  const A = iso(x, y, z + h);
  const B = iso(x + w, y, z + h);
  const Cc = iso(x + w, y + d, z + h);
  const D = iso(x, y + d, z + h);
  const E = iso(x + w, y, z);
  const F = iso(x + w, y + d, z);
  const G = iso(x, y + d, z);
  const ribLines = Array.from({ length: ribs }, (_, i) => {
    const t = ((i + 1) / (ribs + 1)) * w;
    return [iso(x + t, y + d, z + h), iso(x + t, y + d, z), iso(x + t, y, z + h)] as const;
  });
  return (
    <g stroke={strong ? "var(--color-cyan)" : "rgba(127,212,217,0.55)"} strokeWidth={strong ? 1.1 : 0.8} fill="#000">
      <polygon points={[A, B, Cc, D].map(pt).join(" ")} />
      <polygon points={[B, E, F, Cc].map(pt).join(" ")} />
      <polygon points={[D, Cc, F, G].map(pt).join(" ")} />
      {ribLines.map(([top, bottom, back], i) => (
        <g key={i} strokeOpacity={0.5}>
          <line x1={top[0]} y1={top[1]} x2={bottom[0]} y2={bottom[1]} />
          <line x1={top[0]} y1={top[1]} x2={back[0]} y2={back[1]} />
        </g>
      ))}
    </g>
  );
}

function Pad({ x, y, w, d }: { x: number; y: number; w: number; d: number }) {
  return (
    <polygon
      points={[iso(x, y), iso(x + w, y), iso(x + w, y + d), iso(x, y + d)].map(pt).join(" ")}
      fill="none"
      stroke="rgba(127,212,217,0.3)"
      strokeWidth={0.8}
    />
  );
}

function IsoYard({ active }: { active: number }) {
  const route = [iso(-40, 330), iso(120, 330), iso(120, 250), iso(330, 250), iso(330, 60)];
  return (
    <svg viewBox="110 40 500 360" className="h-auto w-full" role="img" aria-label="Wireframe of a logistics yard with containers, a truck and a highlighted route">
      <Pad x={0} y={0} w={300} d={220} />
      <Pad x={-60} y={240} w={420} d={120} />

      {/* route the system is watching */}
      <polyline
        points={route.map(pt).join(" ")}
        fill="none"
        stroke={active === 0 ? "rgba(127,212,217,0.35)" : active >= 2 ? "var(--color-signal-500)" : "var(--color-cyan)"}
        strokeWidth={1.4}
        strokeDasharray="3 4"
        style={{ transition: "stroke 400ms" }}
      />

      <BoxWire x={20} y={20} w={220} d={70} h={70} ribs={18} strong={active === 1} />
      <BoxWire x={20} y={110} w={150} d={60} h={56} ribs={12} />
      <BoxWire x={190} y={120} w={60} d={45} h={60} ribs={0} strong={active === 3} />
      <BoxWire x={250} y={130} w={40} d={40} h={44} ribs={0} />
      {/* pallets */}
      {[0, 1, 2].map((i) => (
        <BoxWire key={i} x={-40 - i * 34} y={60 + i * 10} w={28} d={28} h={36 + (i % 2) * 18} ribs={3} />
      ))}
      {/* truck on the road: trailer + cab */}
      <BoxWire x={150} y={262} w={170} d={46} h={52} ribs={14} strong={active === 2} />
      <BoxWire x={326} y={266} w={36} d={38} h={44} />

      {/* sensor nodes */}
      {[iso(-40, 330), iso(330, 60), iso(120, 250)].map(([cx, cy], i) => (
        <rect key={i} x={cx - 3} y={cy - 3} width={6} height={6} fill="var(--color-cyan)" transform={`rotate(45 ${cx} ${cy})`} />
      ))}
    </svg>
  );
}
