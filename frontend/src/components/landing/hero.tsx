"use client";

import { useEffect, useRef } from "react";
import { ArrowRight, CloudLightning, Route } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { Truck } from "@/components/landing/truck";
import { site } from "@/lib/site";
import { INTRO_OPEN_EVENT, introIsOpen } from "@/components/landing/intro";

/*
 * Hero — a pinned dusk scene (DESIGN.md §7.4). The intro reveals it; scrolling then
 * pushes the camera toward the cab while the headline fills in word by word, and the
 * product proof (copy, CTAs, live alert) arrives before the section releases.
 */

const HEADLINE = "See disruptions before they reach your customers.";
const WORDS = HEADLINE.split(" ");

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const span = (p: number, a: number, b: number) => clamp01((p - a) / (b - a));
const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

export function Hero() {
  const sectionRef = useRef<HTMLElement>(null);
  const sceneRef = useRef<HTMLDivElement>(null);
  const truckRef = useRef<HTMLDivElement>(null);
  const shadeRef = useRef<HTMLDivElement>(null);
  const wordRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const proofRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const cueRef = useRef<HTMLDivElement>(null);
  const entranceRef = useRef<HTMLDivElement>(null);

  // Entrance: as the intro parts, the camera settles and the truck rolls the last few metres.
  useEffect(() => {
    const el = entranceRef.current;
    if (!el || introIsOpen()) return; // no intro this visit — show the settled frame
    el.style.transform = "scale(1.07) translateX(-2.5%)";
    const play = () => {
      el.style.transform = "";
      el.animate(
        [
          { transform: "scale(1.07) translateX(-2.5%)", filter: "brightness(0.85)" },
          { transform: "scale(1) translateX(0)", filter: "brightness(1)" },
        ],
        { duration: 1900, easing: "cubic-bezier(0.16, 1, 0.3, 1)" },
      );
    };
    window.addEventListener(INTRO_OPEN_EVENT, play, { once: true });
    return () => window.removeEventListener(INTRO_OPEN_EVENT, play);
  }, []);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let current = 0;
    let target = 0;
    let last = performance.now();
    let raf = 0;

    const measure = () => {
      const el = sectionRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      target = clamp01(-r.top / (r.height - window.innerHeight));
    };

    const render = (p: number) => {
      const push = easeInOut(span(p, 0.05, 0.85));
      if (sceneRef.current) sceneRef.current.style.transform = `scale(${1 + push * 0.22})`;
      if (truckRef.current) truckRef.current.style.transform = `translateX(${push * 7}vw)`;
      if (shadeRef.current) shadeRef.current.style.opacity = String(0.15 + span(p, 0.08, 0.5) * 0.55);
      const words = span(p, 0.12, 0.5) * WORDS.length;
      wordRefs.current.forEach((w, i) => {
        if (!w) return;
        const t = clamp01(words - i);
        w.style.opacity = String(t);
        w.style.transform = `translateY(${(1 - t) * 0.18}em)`;
      });
      const proof = span(p, 0.5, 0.68);
      if (proofRef.current) {
        proofRef.current.style.opacity = String(proof);
        proofRef.current.style.transform = `translateY(${(1 - proof) * 16}px)`;
        proofRef.current.style.pointerEvents = proof > 0.5 ? "auto" : "none";
      }
      const card = span(p, 0.58, 0.78);
      if (cardRef.current) {
        cardRef.current.style.opacity = String(card);
        cardRef.current.style.transform = `translateY(${(1 - card) * 28}px)`;
      }
      if (cueRef.current) cueRef.current.style.opacity = String(1 - span(p, 0, 0.06));
    };

    if (reduced) {
      render(1);
      return;
    }

    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const diff = target - current;
      current = Math.abs(diff) < 0.0004 ? target : current + diff * (1 - Math.exp(-dt * 10));
      render(current);
      raf = requestAnimationFrame(tick);
    };

    measure();
    current = target;
    render(current);
    raf = requestAnimationFrame(tick);
    window.addEventListener("scroll", measure, { passive: true });
    window.addEventListener("resize", measure);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", measure);
      window.removeEventListener("resize", measure);
    };
  }, []);

  return (
    <section ref={sectionRef} data-nav="light" className="relative h-[260vh] bg-paper" aria-label="Introduction">
      <div className="sticky top-0 h-[100svh] overflow-hidden rounded-b-[28px] bg-[#0b0908]">
        <div ref={entranceRef} className="absolute inset-0 will-change-transform">
          <div ref={sceneRef} className="absolute inset-0 origin-[64%_60%] will-change-transform">
            {/* sky → horizon → ground */}
            <div
              aria-hidden
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(to bottom, #b8b2bc 0%, #d4c4c4 26%, #e8c4a2 44%, #f1ab68 55%, #d8803f 59%, #2a1610 60.2%, #0d0a09 61%, #070605 100%)",
              }}
            />
            <div
              aria-hidden
              className="absolute inset-0"
              style={{ background: "radial-gradient(60% 22% at 55% 59%, rgba(255,170,100,0.55), transparent 70%)" }}
            />

            {/* truck sits on the horizon; its headlight throws a beam across the ground */}
            <div ref={truckRef} className="absolute inset-0 will-change-transform">
              <div className="absolute left-1/2 top-[60.6%] w-[min(80vw,1320px)] -translate-x-1/2 -translate-y-full">
                <div
                  aria-hidden
                  className="absolute -bottom-[6%] left-[-4%] h-[16%] w-[108%] rounded-[50%] bg-black/70 blur-xl"
                />
                <Truck className="relative block h-auto w-full" />
                <div
                  aria-hidden
                  className="absolute left-[97%] top-[65%] h-[70%] w-[60vw] -translate-y-1/2 mix-blend-screen"
                  style={{ background: "radial-gradient(closest-side at 0% 50%, rgba(255,232,196,0.75), rgba(255,200,140,0.2) 45%, transparent 100%)" }}
                />
                <div
                  aria-hidden
                  className="absolute left-[92%] top-full h-[38%] w-[50vw] mix-blend-screen"
                  style={{ background: "radial-gradient(closest-side at 10% 0%, rgba(255,214,160,0.35), transparent 100%)" }}
                />
              </div>
            </div>
          </div>
        </div>

        <div ref={shadeRef} aria-hidden className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/70" style={{ opacity: 0.15 }} />

        <div className="relative mx-auto flex h-full max-w-7xl flex-col items-center justify-center px-5 text-center md:px-8">
          <h1 className="max-w-4xl text-[clamp(2.5rem,6.4vw,5.5rem)] font-normal leading-[1.02] tracking-[-0.04em] text-white">
            {WORDS.map((w, i) => (
              <span
                key={i}
                ref={(el) => {
                  wordRefs.current[i] = el;
                }}
                className="inline-block will-change-transform"
                style={{ opacity: 0 }}
              >
                {w}
                {i < WORDS.length - 1 ? " " : ""}
              </span>
            ))}
          </h1>

          <div ref={proofRef} className="mt-7 flex flex-col items-center" style={{ opacity: 0 }}>
            <p className="max-w-xl text-lg leading-relaxed text-white/80">
              {site.name} watches traffic, weather, suppliers and stock across your network, flags what will break, and
              recommends the best route or action — ready for your team to approve.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <ButtonLink href={site.appHref} size="lg">
                Open control tower <ArrowRight size={16} />
              </ButtonLink>
              <ButtonLink href="#how-it-works" size="lg" variant="ghost" className="!border-white/30 !text-white hover:!bg-white/10">
                See how it works
              </ButtonLink>
            </div>
          </div>
        </div>

        <div ref={cardRef} className="absolute bottom-8 right-8 hidden w-[360px] xl:block" style={{ opacity: 0 }}>
          <AlertPreview />
        </div>

        <div ref={cueRef} className="label absolute bottom-7 left-1/2 -translate-x-1/2 text-white/70">
          Scroll
        </div>
      </div>
    </section>
  );
}

function AlertPreview() {
  return (
    <aside
      aria-label="Example disruption alert"
      className="rounded-2xl border border-white/10 bg-night-900/70 p-5 text-text shadow-[0_0_0_1px_rgba(255,91,4,0.25),0_24px_60px_-20px_rgba(0,0,0,0.6)] backdrop-blur-xl"
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
          ["Avg delay", "+7h"],
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
    </aside>
  );
}
