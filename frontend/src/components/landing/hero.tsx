"use client";

import { useEffect, useRef } from "react";
import { ArrowRight } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { Truck, TRUCK_VIEW } from "@/components/landing/truck";
import { Foreground, Skyline, TILE, Yard } from "@/components/landing/scene-layers";
import { INTRO_OPEN_EVENT, introIsOpen } from "@/components/landing/intro";
import { site } from "@/lib/site";

/*
 * Hero — a pinned driving sequence (DESIGN.md §7.4).
 * The camera tracks a truck cruising through a dusk yard: skyline, yard, road and
 * foreground slide past at different speeds while the wheels turn. Scrolling drives it
 * forward; halfway through, the world flips into its wireframe digital twin.
 */

const H1 = "See disruptions before they reach your customers.".split(" ");
const H2 = "Every truck, route and warehouse — one live risk picture.".split(" ");

const CRUISE = 70; // px/s the world drifts by even before you scroll
const SCROLL_DISTANCE = 3400; // px of travel across the whole pinned scroll
const SPEED = { skyline: 0.06, yard: 0.32, road: 1, foreground: 2.1 };
const HORIZON = 0.606; // fraction of viewport height where the wheels meet the road

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const span = (p: number, a: number, b: number) => clamp01((p - a) / (b - a));
const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

export function Hero() {
  const sectionRef = useRef<HTMLElement>(null);
  const entranceRef = useRef<HTMLDivElement>(null);
  const cameraRef = useRef<HTMLDivElement>(null);
  const skyRef = useRef<HTMLDivElement>(null);
  const skylineRef = useRef<HTMLDivElement>(null);
  const yardRef = useRef<HTMLDivElement>(null);
  const roadRef = useRef<HTMLDivElement>(null);
  const fgRef = useRef<HTMLDivElement>(null);
  const truckRef = useRef<HTMLDivElement>(null);
  const solidRef = useRef<HTMLDivElement>(null);
  const wireRef = useRef<HTMLDivElement>(null);
  const beamRef = useRef<HTMLDivElement>(null);
  const twinRef = useRef<HTMLDivElement>(null);
  const tagsRef = useRef<HTMLDivElement>(null);
  const shadeRef = useRef<HTMLDivElement>(null);
  const h1Refs = useRef<(HTMLSpanElement | null)[]>([]);
  const h2Refs = useRef<(HTMLSpanElement | null)[]>([]);
  const h1Ref = useRef<HTMLHeadingElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const cueRef = useRef<HTMLDivElement>(null);

  // As the intro parts, the camera settles in from slightly closer.
  useEffect(() => {
    const el = entranceRef.current;
    if (!el || introIsOpen()) return;
    el.style.transform = "scale(1.08)";
    const play = () => {
      el.style.transform = "";
      el.animate([{ transform: "scale(1.08)" }, { transform: "scale(1)" }], {
        duration: 2000,
        easing: "cubic-bezier(0.16, 1, 0.3, 1)",
      });
    };
    window.addEventListener(INTRO_OPEN_EVENT, play, { once: true });
    return () => window.removeEventListener(INTRO_OPEN_EVENT, play);
  }, []);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let p = 0;
    let target = 0;
    let cruise = 0;
    let last = performance.now();
    let raf = 0;
    let tile = { skyline: 1, yard: 1, fg: 1 };
    let wheelPx = 1;
    const wheels: SVGGElement[] = [];

    const measure = () => {
      const el = sectionRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      target = clamp01(-r.top / (r.height - window.innerHeight));
    };
    const layout = () => {
      const ratio = TILE.w / TILE.h;
      tile = {
        skyline: (skylineRef.current?.offsetHeight ?? 1) * ratio,
        yard: (yardRef.current?.offsetHeight ?? 1) * ratio,
        fg: (fgRef.current?.offsetHeight ?? 1) * ratio,
      };
      wheelPx = ((truckRef.current?.offsetWidth ?? 1) / TRUCK_VIEW.w) * TRUCK_VIEW.wheelR;
      wheels.length = 0;
      truckRef.current?.querySelectorAll<SVGGElement>("[data-wheel]").forEach((w) => wheels.push(w));
      measure();
    };

    const render = (now: number) => {
      const d = cruise + p * SCROLL_DISTANCE;
      const slide = (el: HTMLDivElement | null, speed: number, w: number) => {
        if (el) el.style.transform = `translate3d(${-((d * speed) % w)}px,0,0)`;
      };
      slide(skylineRef.current, SPEED.skyline, tile.skyline);
      slide(yardRef.current, SPEED.yard, tile.yard);
      slide(fgRef.current, SPEED.foreground, tile.fg);
      if (roadRef.current) roadRef.current.style.backgroundPositionX = `${-d * SPEED.road}px, 0px`;

      const angle = ((d / wheelPx) * 180) / Math.PI;
      wheels.forEach((w) => {
        w.setAttribute("transform", `rotate(${angle % 360} ${w.dataset.wheel} ${TRUCK_VIEW.wheelY})`);
      });

      // The camera eases toward the cab; the truck pulls slightly ahead and rides the road.
      const push = easeInOut(span(p, 0.04, 0.9));
      if (cameraRef.current) cameraRef.current.style.transform = `scale(${1 + push * 0.14})`;
      const bob = Math.sin(now / 110) * 0.5 + Math.sin(now / 47) * 0.25;
      if (truckRef.current) truckRef.current.style.transform = `translate3d(calc(-50% + ${push * 5}vw), calc(-100% + ${bob}px), 0)`;

      const twin = span(p, 0.48, 0.62);
      if (solidRef.current) solidRef.current.style.opacity = String(1 - twin);
      if (beamRef.current) beamRef.current.style.opacity = String(1 - twin);
      if (wireRef.current) wireRef.current.style.opacity = String(twin);
      if (twinRef.current) twinRef.current.style.opacity = String(twin);
      if (skyRef.current) skyRef.current.style.opacity = String(1 - twin * 0.94);
      if (tagsRef.current) {
        const t = span(p, 0.6, 0.7);
        tagsRef.current.style.opacity = String(t);
        tagsRef.current.style.transform = `translateY(${(1 - t) * 10}px)`;
      }

      const a = span(p, 0.03, 0.24);
      const aOut = span(p, 0.34, 0.44);
      h1Refs.current.forEach((w, i) => {
        if (!w) return;
        const t = clamp01(a * H1.length - i);
        w.style.opacity = String(t * (1 - aOut));
        w.style.transform = `translateY(${(1 - t) * 0.2 - aOut * 0.3}em)`;
      });
      const b = span(p, 0.6, 0.8);
      h2Refs.current.forEach((w, i) => {
        if (!w) return;
        const t = clamp01(b * H2.length - i);
        w.style.opacity = String(t);
        w.style.transform = `translateY(${(1 - t) * 0.2}em)`;
      });
      if (h1Ref.current) h1Ref.current.style.visibility = aOut >= 1 ? "hidden" : "visible";
      if (shadeRef.current) shadeRef.current.style.opacity = String(span(p, 0.02, 0.2) * (1 - twin));
      const cta = span(p, 0.8, 0.9);
      if (ctaRef.current) {
        ctaRef.current.style.opacity = String(cta);
        ctaRef.current.style.transform = `translateY(${(1 - cta) * 14}px)`;
        ctaRef.current.style.pointerEvents = cta > 0.5 ? "auto" : "none";
      }
      if (cueRef.current) cueRef.current.style.opacity = String(1 - span(p, 0, 0.04));
    };

    layout();
    p = target;

    if (reduced) {
      const still = () => {
        measure();
        p = target;
        render(0);
      };
      still();
      window.addEventListener("scroll", still, { passive: true });
      return () => window.removeEventListener("scroll", still);
    }

    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      cruise += CRUISE * dt;
      const diff = target - p;
      p = Math.abs(diff) < 0.0003 ? target : p + diff * (1 - Math.exp(-dt * 8));
      render(now);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    window.addEventListener("scroll", measure, { passive: true });
    window.addEventListener("resize", layout);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", measure);
      window.removeEventListener("resize", layout);
    };
  }, []);

  return (
    <section ref={sectionRef} data-nav="light" className="relative h-[380vh] bg-paper" aria-label="Introduction">
      <div className="sticky top-0 h-[100svh] overflow-hidden rounded-b-[28px] bg-[#05090a]">
        <div ref={entranceRef} className="absolute inset-0 will-change-transform">
          <div ref={cameraRef} className="absolute inset-0 origin-[66%_58%] will-change-transform">
            {/* ---------- the real world ---------- */}
            <div ref={skyRef} className="absolute inset-0">
              <div
                aria-hidden
                className="absolute inset-0"
                style={{
                  background:
                    "linear-gradient(to bottom, #b3adb8 0%, #d1c1c1 24%, #e6c2a0 42%, #f0aa69 53%, #d97f40 58.5%, #2a1610 60.6%, #0d0a09 62%, #070605 100%)",
                }}
              />
              <div
                aria-hidden
                className="absolute inset-0"
                style={{ background: "radial-gradient(55% 20% at 56% 58%, rgba(255,170,100,0.6), transparent 70%)" }}
              />
              <div className="absolute inset-x-0 h-[20vh] overflow-hidden" style={{ bottom: `${(1 - HORIZON) * 100}%` }}>
                <div ref={skylineRef} className="h-full will-change-transform">
                  <Skyline />
                </div>
              </div>
              <div className="absolute inset-x-0 h-[30vh] overflow-hidden" style={{ bottom: `${(1 - HORIZON) * 100}%` }}>
                <div ref={yardRef} className="h-full will-change-transform">
                  <Yard />
                </div>
              </div>
              {/* road: a dark band with sliding lane marks */}
              <div
                ref={roadRef}
                aria-hidden
                className="absolute inset-x-0 h-[5vh] border-t border-[#ffb47a]/25"
                style={{
                  top: `${HORIZON * 100}%`,
                  backgroundImage:
                    "repeating-linear-gradient(to right, rgba(255,214,170,0.32) 0 70px, transparent 70px 170px), linear-gradient(#171210, #0b0908)",
                  backgroundSize: "170px 2px, 100% 100%",
                  backgroundPosition: "0 72%, 0 0",
                  backgroundRepeat: "repeat-x, no-repeat",
                }}
              />
            </div>

            {/* ---------- the digital twin ---------- */}
            <div ref={twinRef} aria-hidden className="absolute inset-0" style={{ opacity: 0 }}>
              <div
                className="absolute inset-x-0 bottom-0"
                style={{
                  top: `${HORIZON * 100}%`,
                  backgroundImage: "radial-gradient(rgba(127,212,217,0.5) 1px, transparent 1.5px)",
                  backgroundSize: "26px 18px",
                  maskImage: "linear-gradient(to bottom, #000, transparent 85%)",
                }}
              />
              <div className="absolute inset-x-0 h-px bg-cyan/60" style={{ top: `${HORIZON * 100}%` }} />
              <div
                className="absolute inset-x-0 top-0"
                style={{
                  bottom: `${(1 - HORIZON) * 100}%`,
                  backgroundImage: "radial-gradient(rgba(127,212,217,0.22) 1px, transparent 1.5px)",
                  backgroundSize: "34px 34px",
                  maskImage: "linear-gradient(to top, #000, transparent 70%)",
                }}
              />
            </div>

            {/* ---------- the truck (both versions share one transform) ---------- */}
            <div
              ref={truckRef}
              className="absolute left-1/2 w-[min(82vw,1360px)] will-change-transform"
              style={{ top: `${HORIZON * 100 + 0.4}%`, transform: "translate3d(-50%, -100%, 0)" }}
            >
              <div ref={solidRef} className="relative">
                <div aria-hidden className="absolute -bottom-[5%] left-[-4%] h-[14%] w-[108%] rounded-[50%] bg-black/70 blur-xl" />
                <Truck className="relative block h-auto w-full" />
              </div>
              <div ref={wireRef} className="absolute inset-0" style={{ opacity: 0 }}>
                <Truck variant="wire" className="block h-auto w-full drop-shadow-[0_0_6px_rgba(127,212,217,0.55)]" />
              </div>
              <div
                ref={beamRef}
                aria-hidden
                className="absolute left-[97%] top-[65%] h-[70%] w-[60vw] -translate-y-1/2 mix-blend-screen"
                style={{ background: "radial-gradient(closest-side at 0% 50%, rgba(255,232,196,0.75), rgba(255,200,140,0.2) 45%, transparent 100%)" }}
              />
              <div ref={tagsRef} className="absolute inset-0" style={{ opacity: 0 }}>
                <Tag className="left-[4%] top-[-16%]" k="SHP-1042" v="Mumbai → Pune" />
                <Tag className="left-[44%] top-[-16%]" k="ETA" v="21:40 IST · on time" />
                <Tag className="right-[2%] top-[-16%]" k="Risk 12" v="Clear" />
              </div>
            </div>

            {/* foreground rushes past */}
            <div aria-hidden className="absolute inset-x-0 bottom-0 h-[24vh] overflow-hidden blur-[5px]">
              <div ref={fgRef} className="h-full will-change-transform">
                <Foreground />
              </div>
            </div>
          </div>
        </div>

        <div
          ref={shadeRef}
          aria-hidden
          className="absolute inset-0"
          style={{ opacity: 0, background: "radial-gradient(70% 55% at 50% 42%, rgba(0,0,0,0.55), rgba(0,0,0,0.15) 70%)" }}
        />

        <div className="relative mx-auto flex h-full max-w-7xl flex-col items-center justify-center px-5 text-center md:px-8">
          <div className="relative grid place-items-center">
            <h1 ref={h1Ref} className="col-start-1 row-start-1 max-w-4xl text-[clamp(2.5rem,6.4vw,5.5rem)] font-normal leading-[1.02] tracking-[-0.04em] text-white">
              {H1.map((w, i) => (
                <span key={i} ref={(el) => { h1Refs.current[i] = el; }} className="inline-block will-change-transform" style={{ opacity: 0 }}>
                  {w}
                  {i < H1.length - 1 ? " " : ""}
                </span>
              ))}
            </h1>
            <p aria-hidden className="col-start-1 row-start-1 max-w-4xl text-[clamp(2.25rem,5.6vw,4.75rem)] font-normal leading-[1.04] tracking-[-0.04em] text-white">
              {H2.map((w, i) => (
                <span key={i} ref={(el) => { h2Refs.current[i] = el; }} className="inline-block will-change-transform" style={{ opacity: 0 }}>
                  {w}
                  {i < H2.length - 1 ? " " : ""}
                </span>
              ))}
            </p>
          </div>

          <div ref={ctaRef} className="mt-9 flex flex-wrap justify-center gap-3" style={{ opacity: 0 }}>
            <ButtonLink href={site.appHref} size="lg">
              Open control tower <ArrowRight size={16} />
            </ButtonLink>
            <ButtonLink href="#how-it-works" size="lg" variant="ghost" className="!border-white/30 !text-white hover:!bg-white/10">
              See how it works
            </ButtonLink>
          </div>
        </div>

        <div ref={cueRef} className="label absolute bottom-7 left-1/2 -translate-x-1/2 text-white/75">
          Scroll
        </div>
      </div>
    </section>
  );
}

function Tag({ k, v, className }: { k: string; v: string; className: string }) {
  return (
    <div className={`absolute flex items-center gap-2 font-mono text-[0.75rem] uppercase tracking-[0.1em] ${className}`}>
      <span className="size-1.5 rotate-45 bg-cyan" />
      <span className="text-cyan">{k}</span>
      <span className="text-white/70">{v}</span>
    </div>
  );
}
