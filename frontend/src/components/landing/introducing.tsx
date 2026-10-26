"use client";

import { useCallback, useEffect, useRef } from "react";
import { Check, CloudRain, Factory, Navigation, PackageX, Ship, type LucideIcon } from "lucide-react";
import { site } from "@/lib/site";
import { YardStill, sampleShots } from "@/components/landing/yard-still";
import type { Shot } from "@/components/landing/yard-scene";

/*
 * "Introducing Vectrix" — sticky feature scroller.
 * Left: four steps; the one in focus types itself in character by character as you scroll,
 * the rest fade back. Right: a sticky, notched media frame showing an aerial view of the
 * network, with a card that shows exactly what the focused step describes. Everything is
 * driven by one continuous scroll value, so cards, progress and camera move together.
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
  { dist: 8, cam: [16, 30, 25], look: [3, 0, -2], fov: 40, convert: 0, radius: 12, night: 0.1, routes: 0, dissolve: 0 },
  { dist: 8, cam: [11, 26, 17], look: [-1, 1, 0], fov: 38, convert: 0.62, radius: 11, night: 0.18, routes: 0, dissolve: 1 },
  { dist: 8, cam: [28, 52, 27], look: [26, 0, 2], fov: 44, convert: 0, radius: 12, night: 0.14, routes: 1, dissolve: 0 },
  { dist: 8, cam: [31, 34, 31], look: [24, 0, 3], fov: 40, convert: 0.5, radius: 15, night: 0.32, routes: 1, dissolve: 0.6 },
];

// The "neon" type-on: characters flash green as they appear, then settle to ink.
const NEON = [95, 209, 58];
const INK_RGB = [11, 42, 44];
const TRAIL = 16;

const NAMES = ["Detect", "Assess", "Recommend", "Approve"];

const SIGNALS: { icon: LucideIcon; k: string; v: string }[] = [
  { icon: CloudRain, k: "IMD red alert", v: "Khandala ghat · 210 mm" },
  { icon: Navigation, k: "Traffic", v: "NH-48 slowing · 38 km/h" },
  { icon: Ship, k: "Port queue", v: "JNPT gate · 14 h" },
  { icon: Factory, k: "Supplier ETA", v: "Chennai · +4 days" },
  { icon: PackageX, k: "Stock level", v: "Gurugram DC · 2.1 days" },
];

const OPTIONS = [
  { k: "A", t: "Detour via NH-48", d: "+1h 40m · ₹0.4L", best: true },
  { k: "B", t: "Hold at Bhiwandi hub", d: "+5h · ₹0.9L", best: false },
  { k: "C", t: "Switch to rail from Pune", d: "+9h · ₹1.6L", best: false },
];

const LOG = ["Approved by ops · 14:20 IST", "Route and ETA updated · 21:40", "Stock plan re-balanced", "Decision logged for this corridor"];

const CARD = "rounded-xl border border-white/12 bg-[#08161a]/80 p-5 text-white shadow-[0_24px_60px_-24px_rgba(0,0,0,0.7)] backdrop-blur-md";
const CAP = "font-mono text-[0.6875rem] uppercase tracking-[0.12em] text-white/55";

function StepCard({ i }: { i: number }) {
  if (i === 0)
    return (
      <>
        <p className={`${CAP} flex items-center gap-2`}>
          <span className="size-1.5 rounded-full bg-cyan" /> Live signals
        </p>
        <ul className="mt-3 divide-y divide-white/10">
          {SIGNALS.map(({ icon: Icon, k, v }) => (
            <li key={k} className="flex items-center gap-3 py-2">
              <Icon size={16} strokeWidth={1.6} className="shrink-0 text-cyan" aria-hidden />
              <span className="text-[0.8125rem] text-white/60">{k}</span>
              <span className="ml-auto text-[0.8125rem] text-white/90">{v}</span>
            </li>
          ))}
        </ul>
        <p className="mt-3 flex items-center gap-2 rounded-md bg-signal-500/15 px-3 py-2 text-[0.8125rem] font-medium text-signal-400">
          <span className="size-1.5 rotate-45 bg-signal-500" /> 6 trucks on the corridor flagged
        </p>
      </>
    );
  if (i === 1)
    return (
      <>
        <p className={`${CAP} flex items-center justify-between`}>
          <span>Impact assessed</span>
          <span className="text-signal-400">Risk 78 · At risk</span>
        </p>
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
          <div className="h-full w-[78%] rounded-full bg-signal-500" />
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2">
          {[
            ["6", "shipments"],
            ["+7h", "delay"],
            ["₹18.4L", "at stake"],
          ].map(([n, l]) => (
            <div key={l} className="rounded-lg bg-white/[0.06] px-3 py-3">
              <p className="text-[1.375rem] font-medium leading-none tracking-[-0.02em]">{n}</p>
              <p className="mt-1.5 text-[0.75rem] text-white/55">{l}</p>
            </div>
          ))}
        </div>
        <p className="mt-3 text-[0.8125rem] text-white/60">Matched to 6 shipments, 14 SKUs and 3 customers.</p>
      </>
    );
  if (i === 2)
    return (
      <>
        <p className={CAP}>Ranked responses</p>
        <ul className="mt-3 flex flex-col gap-2">
          {OPTIONS.map((o) => (
            <li
              key={o.k}
              className={`flex items-center gap-3 rounded-lg border px-3 py-2.5 ${o.best ? "border-signal-500/60 bg-signal-500/10" : "border-white/10"}`}
            >
              <span className={`grid size-6 shrink-0 place-items-center rounded text-[0.75rem] font-medium ${o.best ? "bg-signal-500 text-night-900" : "bg-white/10"}`}>{o.k}</span>
              <span className="text-[0.8125rem]">
                {o.t}
                {o.best && <span className="ml-2 text-[0.6875rem] text-signal-400">Recommended</span>}
              </span>
              <span className="ml-auto whitespace-nowrap text-[0.75rem] text-white/60">{o.d}</span>
            </li>
          ))}
        </ul>
      </>
    );
  return (
    <>
      <p className={`${CAP} flex items-center gap-2`}>
        <span className="size-1.5 rounded-full bg-lime" /> On track · ETA 21:40
      </p>
      <ul className="mt-3 flex flex-col gap-2.5">
        {LOG.map((l) => (
          <li key={l} className="flex items-center gap-3 text-[0.8125rem] text-white/85">
            <span className="grid size-5 shrink-0 place-items-center rounded-full bg-lime text-night-900">
              <Check size={12} strokeWidth={3} aria-hidden />
            </span>
            {l}
          </li>
        ))}
      </ul>
    </>
  );
}

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

export function Introducing() {
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);
  const charRefs = useRef<(HTMLSpanElement | null)[][]>(STEPS.map(() => []));
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const fillRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const nameRefs = useRef<(HTMLSpanElement | null)[]>([]);
  // continuous position through the steps (0 … 3, whole numbers = that step centred), read by the 3D panel every frame
  const flowRef = useRef(0);
  const getShot = useCallback((): Shot => {
    const t = flowRef.current;
    const shot = sampleShots(SHOTS, t);
    // mid-step the world digitises, then settles back to real as the camera moves on
    const f = t - Math.floor(t);
    const pulse = Math.sin(Math.PI * Math.min(1, Math.max(0, (f - 0.15) / 0.7)));
    // the pulse lays glowing wireframe over the real scene rather than eating it away
    return { ...shot, convert: Math.min(1, shot.convert + pulse * 0.32), radius: shot.radius + pulse * 14 };
  }, []);

  useEffect(() => {
    let raf = 0;
    const tick = () => {
      const vh = window.innerHeight;
      let flow = 0;
      itemRefs.current.forEach((el, i) => {
        if (!el) return;
        const r = el.getBoundingClientRect();
        // how far this step's centre has travelled past the middle of the screen
        const through = clamp01((vh * 0.5 - (r.top + r.height / 2)) / r.height + 0.5);
        if (through > 0) flow = i + through;
        // the step nearest the middle of the screen is in focus; the others recede smoothly
        const off = Math.abs(r.top + r.height / 2 - vh * 0.5) / r.height;
        el.style.opacity = String(0.25 + 0.75 * (1 - clamp01((off - 0.12) / 0.55)));
        // typing progress: starts as the step enters the lower part of the screen, done a little before it is centred
        const p = clamp01((vh * 0.85 - r.top) / (vh * 0.4));
        const chars = charRefs.current[i];
        const n = p * (chars.length + TRAIL);
        chars.forEach((c, ci) => {
          if (!c) return;
          const d = n - ci;
          if (d <= 0) {
            c.style.color = "";
            c.style.textShadow = "";
          } else if (d >= TRAIL) {
            c.style.color = INK;
            c.style.textShadow = "";
          } else {
            const t = d / TRAIL;
            const rgb = NEON.map((v, k) => Math.round(v + (INK_RGB[k] - v) * t));
            c.style.color = `rgb(${rgb.join(",")})`;
            c.style.textShadow = `0 0 ${14 * (1 - t)}px rgba(95,209,58,${0.55 * (1 - t)})`;
          }
        });
      });
      const t = Math.min(STEPS.length - 1, Math.max(0, flow - 0.5));
      flowRef.current = t;

      // cards, progress segments and step names all follow the same value as the camera
      STEPS.forEach((_, i) => {
        const d = t - i;
        const w = clamp01((0.56 - Math.abs(d)) / 0.14);
        const card = cardRefs.current[i];
        if (card) {
          card.style.opacity = String(w);
          card.style.transform = `translateY(${(-d * 28).toFixed(1)}px)`;
          card.style.filter = w < 1 ? `blur(${((1 - w) * 6).toFixed(1)}px)` : "";
          card.style.visibility = w > 0.01 ? "visible" : "hidden";
        }
        const fill = fillRefs.current[i];
        if (fill) fill.style.transform = `scaleX(${clamp01(t - i + 0.5)})`;
        const name = nameRefs.current[i];
        if (name) name.style.opacity = String(0.4 + 0.6 * clamp01((0.7 - Math.abs(d)) / 0.4));
      });
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

      <div className="mx-auto mt-16 grid max-w-[1440px] gap-10 px-5 md:mt-24 md:px-8 lg:max-w-none lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] lg:gap-14 lg:pl-[max(2rem,calc((100vw-80rem)/2+2rem))] lg:pr-0">
        <div>
          {STEPS.map((s, i) => (
            <div
              key={s.title}
              ref={(el) => {
                itemRefs.current[i] = el;
              }}
              className="relative flex min-h-[46vh] flex-col justify-center py-10 will-change-[opacity] lg:min-h-[78vh]"
            >
              <span className="absolute -left-1 top-1/2 font-mono text-[0.6875rem] text-black/35 lg:-left-8">0{i + 1}</span>
              <h3 className="text-[clamp(1.75rem,2.7vw,2.75rem)] font-semibold leading-[1.08] tracking-[-0.03em]" style={{ color: INK }}>
                {s.title}
              </h3>
              <p className="mt-7 max-w-2xl text-[clamp(1.35rem,2.1vw,2.1rem)] leading-[1.28] tracking-[-0.02em]" style={{ color: "rgba(11,42,44,0.16)" }}>
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
            className="sticky top-[7vh] h-[86vh] overflow-hidden rounded-l-xl"
            style={{
              clipPath:
                "polygon(18px 0, 100% 0, 100% 100%, 18px 100%, 18px 82%, 0 calc(82% - 18px), 0 calc(16% + 18px), 18px 16%)",
            }}
          >
            <YardStill shots={SHOTS} index={0} getShot={getShot} />
            <div aria-hidden className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_top,rgba(5,9,10,0.6),transparent_55%),linear-gradient(to_bottom,rgba(5,9,10,0.5),transparent_22%)]" />

            {/* progress: fills as you move through the four steps */}
            <div className="absolute inset-x-10 top-7 flex gap-2" aria-hidden>
              {NAMES.map((n, i) => (
                <div key={n} className="flex-1">
                  <span
                    ref={(el) => {
                      nameRefs.current[i] = el;
                    }}
                    className="block font-mono text-[0.6875rem] uppercase tracking-[0.12em] text-white"
                  >
                    {n}
                  </span>
                  <div className="mt-2 h-[2px] overflow-hidden rounded-full bg-white/20">
                    <span
                      ref={(el) => {
                        fillRefs.current[i] = el;
                      }}
                      className="block h-full origin-left bg-signal-500"
                      style={{ transform: "scaleX(0)" }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {STEPS.map((_, i) => (
              <div
                key={i}
                ref={(el) => {
                  cardRefs.current[i] = el;
                }}
                className={`absolute bottom-9 left-10 w-[min(25rem,calc(100%-5rem))] will-change-[transform,opacity] ${CARD}`}
                style={{ opacity: i === 0 ? 1 : 0 }}
              >
                <StepCard i={i} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
