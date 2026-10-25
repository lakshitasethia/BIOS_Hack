import { CloudRain, Factory, PackageX, TrafficCone, type LucideIcon } from "lucide-react";

/*
 * Live alert ticker — the system at work. Two rows of disruptions stream past in opposite
 * directions, each with the action that resolved it. Sits right under the docking mark.
 */

type Alert = { icon: LucideIcon; time: string; type: string; title: string; outcome: string; tone: "cyan" | "lime" | "signal" };

const ROW_A: Alert[] = [
  { icon: CloudRain, time: "14:20", type: "Weather", title: "Landslide risk · Khandala ghat", outcome: "Rerouted 4", tone: "cyan" },
  { icon: TrafficCone, time: "14:08", type: "Traffic", title: "JNPT gate backlog · 14h", outcome: "Rebooked 8", tone: "lime" },
  { icon: PackageX, time: "13:52", type: "Stock", title: "Gurugram DC · 2.1 days cover", outcome: "Transferred 600", tone: "lime" },
  { icon: Factory, time: "13:41", type: "Supplier", title: "Chennai supplier · +4 days", outcome: "Expedited backup", tone: "cyan" },
  { icon: CloudRain, time: "13:30", type: "Weather", title: "Cyclone watch · Visakhapatnam port", outcome: "Held 3", tone: "signal" },
  { icon: TrafficCone, time: "13:12", type: "Traffic", title: "NH-44 closure · Panipat toll", outcome: "Rerouted 2", tone: "cyan" },
];

const ROW_B: Alert[] = [
  { icon: PackageX, time: "12:58", type: "Stock", title: "Bhiwandi WH · SKU below safety", outcome: "Re-promised 12", tone: "lime" },
  { icon: TrafficCone, time: "12:44", type: "Traffic", title: "Mundra port · berth congestion", outcome: "Moved to rail", tone: "cyan" },
  { icon: CloudRain, time: "12:31", type: "Weather", title: "Dense fog · Yamuna Expressway", outcome: "Delayed departures", tone: "signal" },
  { icon: Factory, time: "12:17", type: "Supplier", title: "Pune casting plant · strike", outcome: "Switched supplier", tone: "lime" },
  { icon: TrafficCone, time: "12:03", type: "Traffic", title: "Bengaluru ORR · 2h jam", outcome: "Rerouted 5", tone: "cyan" },
  { icon: PackageX, time: "11:46", type: "Stock", title: "Kolkata DC · demand +22%", outcome: "Transferred 340", tone: "lime" },
];

const TONE = { cyan: "text-cyan border-cyan/35 bg-cyan/10", lime: "text-lime border-lime/35 bg-lime/10", signal: "text-signal-400 border-signal-400/40 bg-signal-500/10" };

function Row({ items, reverse = false }: { items: Alert[]; reverse?: boolean }) {
  return (
    <div className="flex w-max gap-3 pr-3 hover:[animation-play-state:paused]" style={{ animation: `ticker 60s linear infinite ${reverse ? "reverse" : ""}` }}>
      {[...items, ...items].map((a, i) => (
        <div key={i} className="flex shrink-0 items-center gap-3 rounded-full border border-white/10 bg-white/[0.04] py-2 pl-3 pr-2" aria-hidden={i >= items.length || undefined}>
          <a.icon size={15} strokeWidth={1.6} className="text-white/60" aria-hidden />
          <span className="font-mono text-[0.75rem] tabular-nums text-white/45">{a.time}</span>
          <span className="label text-white/50">{a.type}</span>
          <span className="text-[0.9375rem] text-white/90">{a.title}</span>
          <span className={`label rounded-full border px-2.5 py-1 ${TONE[a.tone]}`}>{a.outcome}</span>
        </div>
      ))}
    </div>
  );
}

export function Impact() {
  return (
    <section id="impact" aria-label="Live disruptions" className="relative overflow-hidden bg-deep py-10 text-white">
      <div className="mx-auto mb-7 flex max-w-7xl items-center justify-between gap-6 px-5 md:px-8">
        <p className="label flex items-center gap-2.5 text-white/70">
          <span className="relative flex size-2">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-lime opacity-60" />
            <span className="relative inline-flex size-2 rounded-full bg-lime" />
          </span>
          Live · disruptions caught today
        </p>
        <p className="hidden font-mono text-[0.8125rem] text-white/55 sm:block">
          <span className="text-white">142</span> signals · <span className="text-white">38</span> actions approved ·{" "}
          <span className="text-white">₹1.2Cr</span> protected
        </p>
      </div>
      <div className="flex flex-col gap-3 [mask-image:linear-gradient(to_right,transparent,#000_8%,#000_92%,transparent)]">
        <Row items={ROW_A} />
        <Row items={ROW_B} reverse />
      </div>
    </section>
  );
}
