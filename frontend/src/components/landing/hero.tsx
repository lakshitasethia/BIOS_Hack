"use client";

import { motion } from "motion/react";
import { ArrowRight, CloudLightning, Route } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { site } from "@/lib/site";

const ease = [0.16, 1, 0.3, 1] as const;

const signals = ["Weather alerts", "Traffic feeds", "Port congestion", "Supplier ETAs", "Warehouse stock"];

export function Hero() {
  return (
    <section className="relative isolate overflow-hidden">
      {/* Placeholder art — replace /images/hero-highway.* with the final photo (16:9, dusk highway) */}
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-cover bg-center"
        style={{ backgroundImage: "url(/images/hero-highway.svg)" }}
      />
      <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-r from-night-950/85 via-night-950/25 to-transparent" />
      <div aria-hidden className="absolute inset-x-0 bottom-0 -z-10 h-1/2 bg-gradient-to-t from-night-950 via-night-950/50 to-transparent" />

      <div className="mx-auto grid min-h-[640px] max-w-7xl items-end gap-10 px-5 pb-16 pt-32 md:px-8 lg:h-[100svh] lg:max-h-[880px] lg:grid-cols-[1fr_380px] lg:pb-20">
        <div className="max-w-2xl">
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease }}
            className="label mb-5 flex items-center gap-2.5 text-text-muted"
          >
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-accent opacity-60" />
              <span className="relative inline-flex size-2 rounded-full bg-accent" />
            </span>
            {site.tagline}
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1, ease }}
            className="text-[clamp(2.5rem,5.6vw,4.75rem)] font-normal leading-[1.02] tracking-[-0.035em] text-balance"
          >
            See disruptions <span className="text-text-muted">before they reach your customers.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease }}
            className="mt-6 max-w-xl text-lg leading-relaxed text-text-muted"
          >
            {site.name} watches traffic, weather, suppliers and stock across your network, flags what will
            break, and recommends the best route or action — ready for your team to approve.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3, ease }}
            className="mt-8 flex flex-wrap gap-3"
          >
            <ButtonLink href={site.appHref} size="lg">
              Open control tower <ArrowRight size={16} />
            </ButtonLink>
            <ButtonLink href="#how-it-works" size="lg" variant="ghost">
              See how it works
            </ButtonLink>
          </motion.div>
        </div>

        <AlertPreview />
      </div>

      <div className="border-y border-border bg-night-950/70 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-5 md:flex-row md:items-center md:gap-10 md:px-8">
          <p className="shrink-0 text-sm text-text-subtle">Watching the signals that move your freight</p>
          <ul className="flex flex-wrap gap-x-8 gap-y-2">
            {signals.map((s) => (
              <li key={s} className="label text-text-muted">
                {s}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

function AlertPreview() {
  return (
    <motion.aside
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.9, delay: 0.6, ease }}
      aria-label="Example disruption alert"
      className="hidden w-full rounded-2xl border border-white/10 bg-night-900/60 p-5 shadow-[0_0_0_1px_rgba(255,91,4,0.25),0_24px_60px_-20px_rgba(0,0,0,0.6)] backdrop-blur-xl lg:block"
    >
      <div className="flex items-center justify-between">
        <span className="label flex items-center gap-2 text-text-muted">
          <CloudLightning size={14} className="text-accent" /> Weather
        </span>
        <span className="label rounded bg-accent/15 px-2 py-1 text-accent">● At risk</span>
      </div>

      <p className="mt-4 text-[1.0625rem] font-medium leading-snug">Landslide risk on Mumbai – Pune Expressway</p>
      <p className="mt-1 font-mono text-[0.8125rem] text-text-subtle">Detected 4m ago · IMD red alert, Khandala</p>

      <dl className="mt-5 grid grid-cols-3 gap-px overflow-hidden rounded-lg border border-border bg-border">
        {[
          ["Shipments", "6"],
          ["Avg delay", "+9h"],
          ["At stake", "₹18.4L"],
        ].map(([k, v]) => (
          <div key={k} className="bg-night-900/90 px-3 py-2.5">
            <dt className="text-xs text-text-subtle">{k}</dt>
            <dd className="mt-0.5 font-mono text-[0.9375rem] tabular-nums">{v}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-4 rounded-lg border border-accent/40 bg-accent/[0.07] p-3.5">
        <p className="label text-accent">Recommended</p>
        <p className="mt-1.5 flex items-center gap-2 text-[0.9375rem]">
          <Route size={15} className="text-tide-300" /> Reroute 4 trucks via old NH-48
        </p>
        <p className="mt-1 font-mono text-[0.8125rem] text-text-muted">+1h 40m · saves ₹6.2L in penalties</p>
      </div>
    </motion.aside>
  );
}
