"use client";

import { useEffect, useRef, useState } from "react";
import { site } from "@/lib/site";

/*
 * "Introducing Vectrix" — sticky feature scroller.
 * Left: four steps; the active one types itself in character by character as you scroll,
 * the rest stay faded. Right: a sticky, notched media frame showing an aerial view of
 * the network with a digital-twin overlay that changes with each step.
 */

const STEPS = [
  {
    title: "Detect every disruption",
    body: "Weather alerts, traffic, port queues, supplier ETAs and stock levels stream into one live view — the moment a monsoon alert lands on a corridor, every truck on it is flagged.",
  },
  {
    title: "Assess the real impact",
    body: "Each signal is matched to the shipments, SKUs and customers it touches, then scored for delay, cost and risk — so you see 6 trucks, 7 hours and ₹18.4L at stake, not just a weather map.",
  },
  {
    title: "Recommend the best response",
    body: "Ranked reroutes, holds, stock transfers and supplier switches, each with the time, cost and risk trade-off spelled out — like rerouting via old NH-48 for +1h 40m.",
  },
  {
    title: "Approve and track in one click",
    body: "Your team stays in control. Approve an action and the route, ETA and stock plan update live, with every decision logged for the next time the same corridor floods.",
  },
];

const INK = "#0b2a2c";
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

export function Introducing() {
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);
  const charRefs = useRef<(HTMLSpanElement | null)[][]>(STEPS.map(() => []));
  const [active, setActive] = useState(0);

  useEffect(() => {
    let raf = 0;
    let current = -1;
    const tick = () => {
      const vh = window.innerHeight;
      let next = 0;
      itemRefs.current.forEach((el, i) => {
        if (!el) return;
        const r = el.getBoundingClientRect();
        if (r.top < vh * 0.55) next = i;
        // typing progress: starts as the step enters the lower third, done by mid-screen
        const p = clamp01((vh * 0.8 - r.top) / (vh * 0.45));
        const chars = charRefs.current[i];
        const n = Math.floor(p * chars.length);
        chars.forEach((c, ci) => {
          if (c) c.style.color = ci < n ? INK : "";
        });
      });
      if (next !== current) {
        current = next;
        setActive(next);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <section id="platform" data-nav="light" className="bg-paper pb-24 pt-24 md:pt-28" style={{ color: INK }}>
      <div className="mx-auto max-w-3xl px-5 text-center md:px-8">
        <p className="text-sm text-black/45">Why {site.name}</p>
        <h2 className="mt-3 text-[clamp(2.4rem,5vw,4.25rem)] font-medium leading-[1.02] tracking-[-0.04em]">
          Introducing the {site.name} risk control tower
        </h2>
        <p className="mx-auto mt-6 max-w-xl text-[1.0625rem] leading-relaxed text-black/70">
          {site.name} turns scattered signals into decisions: it watches every corridor, supplier and warehouse, predicts
          what will break and tells your team exactly what to do about it.
        </p>
      </div>

      <div className="mx-auto mt-16 grid max-w-[1440px] gap-10 px-5 md:mt-24 md:px-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-16 lg:pl-[max(2rem,calc((100vw-80rem)/2+2rem))] lg:pr-0">
        <div>
          {STEPS.map((s, i) => (
            <div
              key={s.title}
              ref={(el) => {
                itemRefs.current[i] = el;
              }}
              className="relative flex min-h-[40vh] flex-col justify-center py-8 lg:min-h-[56vh]"
            >
              <span className="absolute -left-1 top-1/2 font-mono text-[0.6875rem] text-black/35 lg:-left-8">0{i + 1}</span>
              <h3
                className="text-[1.375rem] font-medium tracking-[-0.02em] transition-colors duration-500"
                style={{ color: i === active ? INK : "rgba(11,42,44,0.2)" }}
              >
                {s.title}
              </h3>
              <p className="mt-6 max-w-xl text-[clamp(1.25rem,1.9vw,1.625rem)] leading-[1.32] tracking-[-0.015em]" style={{ color: "rgba(11,42,44,0.18)" }}>
                {Array.from(s.body).map((ch, ci) => (
                  <span
                    key={ci}
                    ref={(el) => {
                      charRefs.current[i][ci] = el;
                    }}
                  >
                    {ch}
                  </span>
                ))}
              </p>
            </div>
          ))}
        </div>

        <div className="hidden lg:block">
          <div
            className="sticky top-[14vh] h-[72vh] overflow-hidden rounded-r-none"
            style={{
              clipPath:
                "polygon(18px 0, 100% 0, 100% 100%, 18px 100%, 18px 82%, 0 calc(82% - 18px), 0 calc(16% + 18px), 18px 16%)",
            }}
          >
            {STEPS.map((_, i) => (
              <div
                key={i}
                className="absolute inset-0 transition-[opacity,transform] duration-700 ease-out"
                style={{ opacity: i === active ? 1 : 0, transform: `scale(${i === active ? 1 : 1.04})` }}
              >
                <AerialTwin step={i} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------- aerial digital-twin panels (top-down, 600×720) ---------- */

function TruckTop({ x, y, wire = false, tone = "#e8e2d8" }: { x: number; y: number; wire?: boolean; tone?: string }) {
  const s = wire
    ? { fill: "rgba(255,255,255,0.06)", stroke: "rgba(255,255,255,0.9)", strokeWidth: 1.4 }
    : { fill: tone, stroke: "rgba(0,0,0,0.25)", strokeWidth: 1 };
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect x={-118} y={-18} width={190} height={36} rx={3} {...s} />
      {wire && Array.from({ length: 9 }, (_, i) => <line key={i} x1={-100 + i * 20} y1={-18} x2={-100 + i * 20} y2={18} stroke="rgba(255,255,255,0.45)" />)}
      <rect x={78} y={-16} width={40} height={32} rx={6} {...s} />
      {wire && <rect x={92} y={-12} width={20} height={24} rx={3} fill="none" stroke="rgba(255,255,255,0.6)" />}
    </g>
  );
}

function Label({ x, y, k, v, tone = "#ff8a4c" }: { x: number; y: number; k: string; v: string; tone?: string }) {
  return (
    <g transform={`translate(${x} ${y})`} fontFamily="var(--font-geist-mono), monospace" fontSize="12" letterSpacing="1.2">
      <rect x={-6} y={-6} width={6} height={6} fill={tone} transform="rotate(45 -3 -3)" />
      <text x={8} y={0} fill={tone}>
        {k}
      </text>
      <text x={8} y={16} fill="rgba(255,255,255,0.8)">
        {v}
      </text>
    </g>
  );
}

function AerialTwin({ step }: { step: number }) {
  return (
    <svg viewBox="0 0 600 720" preserveAspectRatio="xMidYMid slice" className="size-full" aria-hidden>
      <defs>
        <linearGradient id="ground" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#9a6b4a" />
          <stop offset="1" stopColor="#7a5238" />
        </linearGradient>
        <radialGradient id="storm" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#7fd4d9" stopOpacity="0.45" />
          <stop offset="0.6" stopColor="#7fd4d9" stopOpacity="0.12" />
          <stop offset="1" stopColor="#7fd4d9" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="risk" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#ff5b04" stopOpacity="0.4" />
          <stop offset="1" stopColor="#ff5b04" stopOpacity="0" />
        </radialGradient>
        <pattern id="dots" width="22" height="22" patternUnits="userSpaceOnUse">
          <circle cx="2" cy="2" r="1.1" fill="rgba(255,255,255,0.35)" />
        </pattern>
        <filter id="soft"><feGaussianBlur stdDeviation="14" /></filter>
      </defs>

      {/* ground, building shadow, planter, the road */}
      <rect width="600" height="720" fill="url(#ground)" />
      <path d="M140 0 H600 V250 L420 300 L230 300 Z" fill="#3c2416" opacity="0.55" filter="url(#soft)" />
      <rect x="452" y="0" width="34" height="250" fill="#4f5b2c" opacity="0.8" />
      <rect x="0" y="520" width="600" height="110" fill="#5e3f2b" opacity="0.55" />
      <line x1="0" y1="575" x2="600" y2="575" stroke="rgba(255,240,220,0.45)" strokeWidth="2" strokeDasharray="22 26" />
      <line x1="405" y1="0" x2="405" y2="520" stroke="rgba(255,255,255,0.55)" strokeWidth="2" />
      <rect width="600" height="720" fill="url(#dots)" opacity="0.5" />

      {step === 0 && (
        <g>
          <circle cx="250" cy="420" r="230" fill="url(#storm)" />
          <g stroke="rgba(127,212,217,0.55)" strokeWidth="1.2">
            {Array.from({ length: 16 }, (_, i) => (
              <line key={i} x1={80 + i * 28} y1={260 + (i % 3) * 18} x2={70 + i * 28} y2={300 + (i % 3) * 18} />
            ))}
          </g>
          <TruckTop x={300} y={575} wire />
          <Label x={70} y={470} k="SIGNAL · IMD RED ALERT" v="Khandala ghat · 210 mm" tone="#7fd4d9" />
        </g>
      )}

      {step === 1 && (
        <g>
          <circle cx="330" cy="575" r="170" fill="url(#risk)" />
          <circle cx="330" cy="575" r="110" fill="none" stroke="rgba(255,138,76,0.7)" strokeDasharray="4 6" />
          <circle cx="330" cy="575" r="160" fill="none" stroke="rgba(255,138,76,0.35)" strokeDasharray="4 6" />
          <TruckTop x={330} y={575} wire />
          {[
            [140, 470],
            [480, 470],
            [520, 660],
            [120, 668],
          ].map(([x, y], i) => (
            <rect key={i} x={x - 5} y={y - 5} width={10} height={10} fill="#ff8a4c" transform={`rotate(45 ${x} ${y})`} />
          ))}
          <Label x={60} y={420} k="RISK 78 · AT RISK" v="6 shipments · ₹18.4L" />
        </g>
      )}

      {step === 2 && (
        <g>
          <path d="M-10 575 H600" stroke="#ff5b04" strokeWidth="4" strokeDasharray="10 10" opacity="0.85" />
          <path d="M-10 575 C120 575, 150 380, 300 380 S470 575, 610 575" stroke="#7fd4d9" strokeWidth="4" fill="none" />
          <circle cx="300" cy="380" r="7" fill="#7fd4d9" />
          <TruckTop x={190} y={575} wire />
          <Label x={330} y={340} k="OPTION A · RECOMMENDED" v="Old NH-48 · +1h 40m" tone="#7fd4d9" />
          <Label x={360} y={640} k="CURRENT ROUTE" v="Expressway · blocked" />
        </g>
      )}

      {step === 3 && (
        <g>
          <path d="M-10 575 C120 575, 150 380, 300 380 S470 575, 610 575" stroke="#7fd4d9" strokeWidth="4" fill="none" />
          <TruckTop x={330} y={392} wire />
          <g transform="translate(470 250)">
            <circle r="26" fill="rgba(127,212,217,0.18)" stroke="#7fd4d9" />
            <path d="M-10 0 L-3 8 L11 -8" stroke="#7fd4d9" strokeWidth="3" fill="none" strokeLinecap="round" />
          </g>
          <Label x={70} y={300} k="APPROVED · 14:20 IST" v="ETA 21:40 · on track" tone="#7fd4d9" />
        </g>
      )}
    </svg>
  );
}
