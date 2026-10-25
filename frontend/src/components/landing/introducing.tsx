"use client";

import { useEffect, useRef, useState } from "react";
import { site } from "@/lib/site";
import { YardStill } from "@/components/landing/yard-still";
import type { Shot } from "@/components/landing/yard-scene";

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

// One shot per step, relative to the truck — the camera flies between them.
const SHOTS: Shot[] = [
  { dist: 8, cam: [3, 42, 10], look: [3, 0, 0], fov: 42, convert: 0, radius: 12, night: 0.05, routes: 0 },
  { dist: 8, cam: [11, 27, 18], look: [-1, 1, 0], fov: 38, convert: 0.62, radius: 11, night: 0.15, routes: 0 },
  { dist: 8, cam: [28, 54, 27], look: [26, 0, 2], fov: 44, convert: 0, radius: 12, night: 0.12, routes: 1 },
  { dist: 8, cam: [31, 36, 31], look: [24, 0, 3], fov: 40, convert: 0.5, radius: 15, night: 0.32, routes: 1 },
];

const HUD = [
  { k: "Signal · IMD red alert", v: "Khandala ghat · 210 mm forecast", tone: "#7fd4d9" },
  { k: "Risk 78 · At risk", v: "6 shipments · +7h · ₹18.4L at stake", tone: "#ff8a4c" },
  { k: "Option A · Recommended", v: "Detour via old NH-48 · +1h 40m", tone: "#7fd4d9" },
  { k: "Approved · 14:20 IST", v: "ETA 21:40 · on track", tone: "#c4ff9d" },
];
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
            <YardStill shots={SHOTS} index={active} />
            <div aria-hidden className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_top,rgba(5,9,10,0.55),transparent_45%)]" />
            {HUD.map((h, i) => (
              <div
                key={i}
                className="absolute bottom-8 left-10 transition-[opacity,transform] duration-700"
                style={{ opacity: i === active ? 1 : 0, transform: `translateY(${i === active ? 0 : 10}px)` }}
              >
                <p className="flex items-center gap-2 font-mono text-[0.75rem] uppercase tracking-[0.12em]" style={{ color: h.tone }}>
                  <span className="size-1.5 rotate-45" style={{ background: h.tone }} />
                  {h.k}
                </p>
                <p className="mt-1.5 font-mono text-[0.8125rem] text-white/85">{h.v}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
