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
} from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { site } from "@/lib/site";

const SOURCES = [
  { label: "Weather alerts", icon: CloudRain },
  { label: "Rain & cyclone radar", icon: Radar },
  { label: "Traffic & GPS", icon: Navigation },
  { label: "Port & terminal", icon: Ship },
  { label: "Rail freight", icon: TrainFront },
  { label: "Toll plaza data", icon: Ticket },
  { label: "Supplier portals", icon: Factory },
  { label: "ERP", icon: Database },
  { label: "WMS", icon: Warehouse },
  { label: "TMS", icon: Truck },
  { label: "Fleet telematics", icon: Satellite },
  { label: "Email & EDI", icon: Mail },
  { label: "Maps & routing", icon: Map },
  { label: "Demand forecasts", icon: TrendingUp },
  { label: "Order book", icon: ClipboardList },
  { label: "Spreadsheets", icon: Sheet },
  { label: "News & advisories", icon: Newspaper },
  { label: "Webhooks & API", icon: Webhook },
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
            {SOURCES.map(({ label, icon: Icon }) => (
              <li
                key={label}
                className="flex h-20 items-center gap-3 border border-paper-line/60 bg-paper px-4 text-[0.9375rem] font-medium transition-colors hover:bg-white"
              >
                <Icon size={18} strokeWidth={1.5} className="shrink-0 text-black/60" aria-hidden />
                {label}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
