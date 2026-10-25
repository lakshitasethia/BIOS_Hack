"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { YardStill } from "@/components/landing/yard-still";
import type { Shot } from "@/components/landing/yard-scene";

// Routes: a high aerial over the detour. Actions: down onto the warehouse docks.
const SHOTS: Shot[] = [
  { dist: 8, cam: [26, 46, 30], look: [26, 0, 2], fov: 40, convert: 0, radius: 12, night: 0.08, routes: 1 },
  { dist: 8, cam: [44, 26, 8], look: [42, 0, -24], fov: 44, convert: 0, radius: 12, night: 0.3, routes: 0 },
];

const RESPONSES = [
  {
    title: "Better routes",
    body: "When traffic or weather hits a corridor, every affected shipment gets ranked alternatives — a different highway, a hub to hold at, or a switch to rail — with the extra hours and rupees shown upfront.",
    points: ["Traffic & port congestion", "Weather & road closures", "Reroute, hold or switch mode"],
    tag: "Detour via old NH-48 · +1h 40m",
  },
  {
    title: "Better actions",
    body: "When a supplier slips or stock runs low, the platform finds the cheapest fix before customers feel it — transfer stock between warehouses, expedite a backup supplier, or re-promise the order.",
    points: ["Supplier delays", "Inventory shortages", "Transfer, expedite or re-promise"],
    tag: "Dock 4 · transfer 600 units to Gurugram DC",
  },
];

export function Responses() {
  const [open, setOpen] = useState(0);
  return (
    <section data-nav="light" className="bg-paper py-20 text-black md:py-24">
      <div className="mx-auto max-w-7xl px-5 md:px-8">
        <p className="label text-black/55">Responses</p>
        <h2 className="mt-4 max-w-2xl text-[clamp(2.25rem,4vw,3.25rem)] font-medium leading-[1.08] tracking-[-0.03em]">
          Two kinds of fixes, one place to decide
        </h2>

        <div className="mt-12 grid overflow-hidden border border-black/10 md:grid-cols-2">
          <div className="flex flex-col">
            {RESPONSES.map((r, i) => {
              const on = i === open;
              return (
                <div key={r.title} className={`flex flex-col ${on ? "flex-1" : ""}`}>
                  <button
                    onClick={() => setOpen(i)}
                    aria-expanded={on}
                    className={`focus-ring flex w-full items-center justify-between px-6 py-5 text-left transition-colors ${
                      on ? "border-l-2 border-tide-500 bg-paper" : "border-l-2 border-transparent bg-paper-bar hover:bg-[#dedec6]"
                    } ${i > 0 ? "border-t border-t-black/10" : ""}`}
                  >
                    <span className="text-lg font-medium">{r.title}</span>
                    <span className="font-mono text-sm text-black/55">0{i + 1}</span>
                  </button>
                  <AnimatePresence initial={false}>
                    {on && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                        className="overflow-hidden border-l-2 border-tide-500"
                      >
                        <div className="px-6 pb-8 pt-2">
                          <p className="max-w-md text-[1.0625rem] leading-relaxed text-black/75">{r.body}</p>
                          <ul className="mt-6 flex flex-col gap-2.5">
                            {r.points.map((p) => (
                              <li key={p} className="flex items-center gap-3 text-[0.9375rem]">
                                <span className="size-1.5 bg-signal-500" aria-hidden />
                                {p}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>

          <div className="relative min-h-80 overflow-hidden border-t border-black/10 md:border-l md:border-t-0">
            <YardStill shots={SHOTS} index={open} className="absolute inset-0" />
            <div aria-hidden className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_top,rgba(5,9,10,0.5),transparent_40%)]" />
            <p className="absolute bottom-5 left-6 flex items-center gap-2 font-mono text-[0.75rem] uppercase tracking-[0.12em] text-cyan">
              <span className="size-1.5 rotate-45 bg-cyan" />
              {RESPONSES[open].tag}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
