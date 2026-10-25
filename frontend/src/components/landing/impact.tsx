"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowRight, CloudRain, Factory, PackageX, TrafficCone, type LucideIcon } from "lucide-react";

/*
 * Live operations band — the system at work, laid out on a hairline grid. One alert at a
 * time rises through the feed with the action that resolved it, next to a live counter and
 * today's protected value. Sits directly under the docking mark.
 */

type Alert = { icon: LucideIcon; time: string; type: string; title: string; outcome: string };

const ALERTS: Alert[] = [
  { icon: CloudRain, time: "14:20", type: "Weather", title: "Landslide risk on the Khandala ghat", outcome: "Rerouted 4 trucks via old NH-48" },
  { icon: TrafficCone, time: "14:08", type: "Traffic", title: "14-hour backlog at the JNPT gate", outcome: "Rebooked 8 pickups to the 02:00 slot" },
  { icon: PackageX, time: "13:52", type: "Stock", title: "Gurugram DC down to 2.1 days of cover", outcome: "Transferred 600 units from Jaipur" },
  { icon: Factory, time: "13:41", type: "Supplier", title: "Chennai component supplier slips 4 days", outcome: "Expedited the Pune backup supplier" },
  { icon: CloudRain, time: "13:30", type: "Weather", title: "Cyclone watch over Visakhapatnam port", outcome: "Held 3 departures until 18:00" },
  { icon: TrafficCone, time: "12:44", type: "Traffic", title: "Berth congestion at Mundra port", outcome: "Moved 6 containers to rail" },
];

const BARS = [32, 48, 41, 60, 52, 70, 58, 77, 66, 84, 72, 92];

function Cross({ className }: { className: string }) {
  return (
    <span aria-hidden className={`absolute size-[9px] ${className}`}>
      <span className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-white/35" />
      <span className="absolute left-0 top-1/2 h-px w-full -translate-y-1/2 bg-white/35" />
    </span>
  );
}

export function Impact() {
  const [i, setI] = useState(0);
  const [count, setCount] = useState(1284);

  useEffect(() => {
    const feed = setInterval(() => setI((v) => (v + 1) % ALERTS.length), 3400);
    const tick = setInterval(() => setCount((c) => c + 1 + Math.floor(Math.random() * 3)), 2600);
    return () => {
      clearInterval(feed);
      clearInterval(tick);
    };
  }, []);

  const a = ALERTS[i];

  return (
    <section id="impact" aria-label="Live operations" className="relative bg-[#081a1b] text-white">
      <div className="relative mx-auto grid max-w-7xl border-x border-white/[0.08] md:grid-cols-4">
        <Cross className="-left-[5px] -top-[5px]" />
        <Cross className="-right-[5px] -top-[5px]" />
        <Cross className="-bottom-[5px] -left-[5px]" />
        <Cross className="-bottom-[5px] -right-[5px]" />

        {/* live feed */}
        <div className="relative flex min-h-[260px] flex-col border-b border-white/[0.08] p-7 md:col-span-2 md:border-b-0 md:border-r">
          <p className="label flex items-center gap-2.5 text-white/60">
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-lime opacity-60" />
              <span className="relative inline-flex size-2 rounded-full bg-lime" />
            </span>
            Live · alert feed
          </p>
          <div className="relative mt-auto h-[132px] overflow-hidden">
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.div
                key={i}
                initial={{ y: 40, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -40, opacity: 0 }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="absolute inset-x-0 bottom-0"
              >
                <p className="flex items-center gap-3 font-mono text-[0.8125rem] text-white/50">
                  <a.icon size={15} strokeWidth={1.6} className="text-white/70" aria-hidden />
                  <span className="tabular-nums">{a.time} IST</span>
                  <span className="label rounded border border-white/15 px-2 py-0.5 text-white/70">{a.type}</span>
                </p>
                <p className="mt-3 text-[clamp(1.4rem,2.2vw,1.9rem)] font-medium leading-tight tracking-[-0.02em]">{a.title}</p>
                <p className="mt-2 flex items-center gap-2 text-[1.0625rem] text-lime">
                  <ArrowRight size={16} aria-hidden /> {a.outcome}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>
          <div className="mt-5 flex gap-1.5" aria-hidden>
            {ALERTS.map((_, k) => (
              <span key={k} className={`h-[3px] flex-1 rounded-full transition-colors duration-500 ${k === i ? "bg-lime" : "bg-white/12"}`} />
            ))}
          </div>
        </div>

        {/* live counter */}
        <div className="relative flex min-h-[220px] flex-col justify-between border-b border-white/[0.08] p-7 md:border-b-0 md:border-r">
          <p className="label text-white/60">Shipments monitored</p>
          <div>
            <p className="text-[clamp(2.75rem,4.4vw,4rem)] font-medium leading-none tracking-[-0.04em] tabular-nums">
              {count.toLocaleString("en-IN")}
            </p>
            <p className="mt-3 text-[0.9375rem] text-white/60">across 214 lanes, right now</p>
          </div>
        </div>

        {/* value protected */}
        <div className="relative flex min-h-[220px] flex-col justify-between p-7">
          <p className="label text-white/60">Penalties avoided today</p>
          <div>
            <div className="mb-5 flex h-14 items-end gap-1.5" aria-hidden>
              {BARS.map((h, k) => (
                <span key={k} className={`flex-1 rounded-sm ${k === BARS.length - 1 ? "bg-lime" : "bg-tide-400/50"}`} style={{ height: `${h}%` }} />
              ))}
            </div>
            <p className="text-[clamp(2.75rem,4.4vw,4rem)] font-medium leading-none tracking-[-0.04em]">₹1.2Cr</p>
            <p className="mt-3 text-[0.9375rem] text-white/60">38 actions approved · 47s avg alert</p>
          </div>
        </div>
      </div>
    </section>
  );
}
