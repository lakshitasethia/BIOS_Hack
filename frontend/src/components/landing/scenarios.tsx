"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, CloudRain, Factory, PackageX, TrafficCone, type LucideIcon } from "lucide-react";

type Scenario = {
  type: string;
  icon: LucideIcon;
  title: string;
  place: string;
  signal: string;
  impact: string;
  action: string;
};

const SCENARIOS: Scenario[] = [
  {
    type: "Weather",
    icon: CloudRain,
    title: "A monsoon landslide shuts the Khandala ghat",
    place: "Mumbai – Pune Expressway",
    signal: "IMD red alert · 210 mm rain forecast",
    impact: "9 shipments · +7h · ₹14.2L at stake",
    action: "Reroute 6 via old NH-48, hold 3 at Bhiwandi",
  },
  {
    type: "Traffic",
    icon: TrafficCone,
    title: "Container trucks queue for 14 hours at the port gate",
    place: "JNPT, Navi Mumbai",
    signal: "Gate dwell time 3× normal",
    impact: "22 containers · ₹31L demurrage risk",
    action: "Rebook 8 pickups to the 02:00 slot, move 6 by rail",
  },
  {
    type: "Supplier",
    icon: Factory,
    title: "A component supplier slips four days",
    place: "Sriperumbudur, Chennai",
    signal: "Supplier ETA moved from 12 to 16 Nov",
    impact: "3 SKUs · 1,240 units · ₹42L of orders",
    action: "Expedite 40% of volume from the Pune backup supplier",
  },
  {
    type: "Inventory",
    icon: PackageX,
    title: "A fast-moving SKU drops below safety stock",
    place: "Gurugram distribution centre",
    signal: "2.1 days of cover left · demand +18%",
    impact: "36 store orders at risk this week",
    action: "Transfer 600 units from Jaipur DC, arrives in 9h",
  },
];

// Aligns the first card with the page container (max-w-7xl + its padding).
const GUTTER = "max(1.25rem, calc((100vw - 80rem) / 2 + 2rem))";

export function Scenarios() {
  const trackRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);
  const [edges, setEdges] = useState({ start: true, end: false });

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    const onScroll = () => {
      const max = el.scrollWidth - el.clientWidth;
      const p = max > 0 ? el.scrollLeft / max : 0;
      setProgress(p);
      setEdges({ start: el.scrollLeft < 4, end: el.scrollLeft > max - 4 });
    };
    onScroll();
    el.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      el.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  const scrollByCard = (dir: 1 | -1) => {
    const el = trackRef.current;
    const card = el?.querySelector<HTMLElement>("[data-card]");
    if (!el || !card) return;
    el.scrollBy({ left: dir * (card.offsetWidth + 24), behavior: "smooth" });
  };

  return (
    <section id="scenarios" data-nav="light" className="bg-paper pb-16 pt-4 text-black md:pb-20">
      <div className="mx-auto max-w-7xl px-5 md:px-8">
        <div className="flex items-end justify-between gap-6">
          <div>
            <p className="label text-black/55">Scenarios</p>
            <h2 className="mt-4 text-[clamp(2.25rem,4vw,3.25rem)] font-medium leading-[1.08] tracking-[-0.03em]">
              Built for the weeks that break plans
            </h2>
          </div>
          <div className="hidden gap-2 sm:flex">
            {([-1, 1] as const).map((dir) => (
              <button
                key={dir}
                onClick={() => scrollByCard(dir)}
                disabled={dir === -1 ? edges.start : edges.end}
                aria-label={dir === -1 ? "Previous scenario" : "Next scenario"}
                className="focus-ring grid size-10 place-items-center border border-black/20 transition-colors hover:border-black disabled:opacity-35 disabled:hover:border-black/20"
              >
                {dir === -1 ? <ArrowLeft size={18} /> : <ArrowRight size={18} />}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div
        ref={trackRef}
        className="mt-10 flex snap-x snap-mandatory gap-6 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        style={{ paddingInline: GUTTER, scrollPaddingInline: GUTTER }}
      >
        {SCENARIOS.map((s) => (
          <article
            key={s.title}
            data-card
            className="grid w-[min(36rem,86vw)] shrink-0 snap-start grid-cols-[minmax(0,0.8fr)_minmax(0,1fr)] gap-6 border-l-2 border-tide-500 pl-5"
          >
            <div className="relative flex aspect-[4/5] flex-col justify-between bg-paper-bar p-4">
              <span className="label text-black/60">{s.type}</span>
              <s.icon size={56} strokeWidth={1} className="self-center text-black/70" aria-hidden />
              <span className="font-mono text-xs text-black/60">{s.place}</span>
              <span className="absolute right-3 top-3 size-2 bg-signal-500" aria-hidden />
            </div>
            <div className="flex flex-col py-1">
              <h3 className="text-[1.1875rem] font-medium leading-snug">{s.title}</h3>
              <dl className="mt-auto flex flex-col gap-3 pt-6">
                {[
                  ["Signal", s.signal],
                  ["Impact", s.impact],
                  ["Action", s.action],
                ].map(([k, v]) => (
                  <div key={k}>
                    <dt className={`label ${k === "Action" ? "text-signal-700" : "text-black/50"}`}>{k}</dt>
                    <dd className="mt-1 text-[0.9375rem] leading-snug text-black/80">{v}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </article>
        ))}
        <div className="w-px shrink-0" aria-hidden />
      </div>

      <div className="mx-auto mt-10 max-w-7xl px-5 md:px-8" aria-hidden>
        <div className="relative h-5">
          <div className="absolute inset-0 bg-[repeating-linear-gradient(to_right,rgba(0,0,0,0.28)_0_1px,transparent_1px_12px)] [mask-image:linear-gradient(to_bottom,#000_50%,transparent_50%)]" />
          <div
            className="absolute top-0 h-full w-0.5 bg-tide-500 transition-[left] duration-150"
            style={{ left: `calc(${progress * 100}% - 1px)` }}
          />
        </div>
      </div>
    </section>
  );
}
