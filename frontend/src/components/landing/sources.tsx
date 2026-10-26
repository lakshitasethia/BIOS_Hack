import {
  ClipboardList,
  CloudRain,
  Database,
  Factory,
  Mail,
  Map,
  Navigation,
  Newspaper,
  Radar,
  Satellite,
  Sheet,
  Ship,
  Ticket,
  TrainFront,
  TrendingUp,
  Truck,
  Warehouse,
  Webhook,
  type LucideIcon,
} from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { site } from "@/lib/site";

type Kind = "Public feed" | "Your system";

const SOURCES: { label: string; icon: LucideIcon; kind: Kind }[] = [
  { label: "Weather alerts", icon: CloudRain, kind: "Public feed" },
  { label: "Rain & cyclone radar", icon: Radar, kind: "Public feed" },
  { label: "Traffic & GPS", icon: Navigation, kind: "Public feed" },
  { label: "Port & terminal", icon: Ship, kind: "Public feed" },
  { label: "Rail freight", icon: TrainFront, kind: "Public feed" },
  { label: "Toll plaza data", icon: Ticket, kind: "Public feed" },
  { label: "Supplier portals", icon: Factory, kind: "Your system" },
  { label: "ERP", icon: Database, kind: "Your system" },
  { label: "WMS", icon: Warehouse, kind: "Your system" },
  { label: "TMS", icon: Truck, kind: "Your system" },
  { label: "Fleet telematics", icon: Satellite, kind: "Your system" },
  { label: "Email & EDI", icon: Mail, kind: "Your system" },
  { label: "Maps & routing", icon: Map, kind: "Public feed" },
  { label: "Demand forecasts", icon: TrendingUp, kind: "Your system" },
  { label: "Order book", icon: ClipboardList, kind: "Your system" },
  { label: "Spreadsheets", icon: Sheet, kind: "Your system" },
  { label: "News & advisories", icon: Newspaper, kind: "Public feed" },
  { label: "Webhooks & API", icon: Webhook, kind: "Your system" },
];

export function Sources() {
  return (
    <section data-nav="light" className="bg-paper py-20 text-black md:py-24">
      <div className="mx-auto grid max-w-7xl gap-12 px-5 md:px-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <div className="flex flex-col">
          <p className="label text-black/55">Signal sources</p>
          <h2 className="mt-4 max-w-md text-[clamp(2.25rem,4vw,3.25rem)] font-medium leading-[1.08] tracking-[-0.03em]">
            Connected to the data you already run on
          </h2>
          <p className="mt-5 max-w-md text-[1.0625rem] leading-relaxed text-black/70">
            Public feeds for weather and traffic, your own systems for orders and stock. No rip-and-replace — {site.name} reads
            what you have and turns it into one risk picture.
          </p>
          <ButtonLink href={site.appHref} variant="ghost" className="mt-8 self-start !border-black/30 !text-black hover:!border-black hover:!bg-black/5 lg:mt-auto">
            Open the control tower
          </ButtonLink>
        </div>

        <div className="relative">
          {/* faint rails behind the grid, one lit — the live feed */}
          <div aria-hidden className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-lime" />
          <div aria-hidden className="absolute inset-y-0 left-[16.6%] w-px bg-paper-line/50" />
          <div aria-hidden className="absolute inset-y-0 right-[16.6%] w-px bg-paper-line/50" />

          <ul className="relative grid grid-cols-2 gap-2 sm:grid-cols-3">
            {SOURCES.map(({ label, icon: Icon, kind }) => (
              <li
                key={label}
                className="group relative flex min-h-[5.25rem] cursor-default items-center gap-3.5 overflow-hidden border border-paper-line/60 bg-paper px-4 transition-[transform,background-color,border-color,box-shadow] duration-300 ease-out hover:-translate-y-0.5 hover:border-signal-500/60 hover:bg-white hover:shadow-[0_14px_30px_-16px_rgba(11,42,44,0.35)]"
              >
                <span className="grid size-11 shrink-0 place-items-center rounded-lg border border-black/10 bg-white/70 text-black/65 transition-all duration-300 ease-out group-hover:-rotate-6 group-hover:scale-110 group-hover:border-signal-500 group-hover:bg-signal-500 group-hover:text-white">
                  <Icon size={21} strokeWidth={1.6} aria-hidden />
                </span>
                <span className="flex flex-col gap-0.5">
                  <span className="text-[0.9375rem] font-medium leading-tight">{label}</span>
                  <span className="flex items-center gap-1.5 text-[0.75rem] text-black/45 transition-colors duration-300 group-hover:text-signal-700">
                    <span
                      aria-hidden
                      className={`size-1.5 rounded-full transition-colors duration-300 ${kind === "Public feed" ? "bg-tide-400" : "bg-black/25"} group-hover:bg-signal-500`}
                    />
                    {kind}
                  </span>
                </span>
                <span aria-hidden className="absolute inset-x-0 bottom-0 h-0.5 origin-left scale-x-0 bg-signal-500 transition-transform duration-500 ease-out group-hover:scale-x-100" />
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
