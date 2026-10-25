"use client";

import { useEffect, useRef } from "react";
import { ArrowRight } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { Truck, TRUCK_VIEW } from "@/components/landing/truck";
import { Foreground, Skyline, TILE, Yard } from "@/components/landing/scene-layers";
import { INTRO_OPEN_EVENT, introIsOpen } from "@/components/landing/intro";
import { site } from "@/lib/site";
import { FrameSequence, loadManifest } from "@/lib/frames/sequence";

/*
 * Hero — a pinned, scroll-driven sequence (DESIGN.md §7.4).
 *  1. Rest: a lone truck on an empty dusk horizon, perfectly still.
 *  2. Drive: scrolling rolls it forward; the road and the yard build themselves around it
 *     and stream past in parallax layers.
 *  3. Digitise: a scan line sweeps the frame, converting everything it passes into the
 *     cyan wireframe twin.
 * If a footage frame sequence exists (scripts/make-frames.sh) it replaces the drawn world.
 */

const H1 = "See disruptions before they reach your customers.".split(" ");
const H2 = "Every truck, route and warehouse — one live risk picture.".split(" ");

const SCROLL_DISTANCE = 3600; // px of travel across the pinned scroll
const SPEED = { skyline: 0.06, yard: 0.32, road: 1, foreground: 2.1 };
const HORIZON = 0.606; // fraction of viewport height where the wheels meet the road
const TRUCK_VW = 0.82; // truck width as a fraction of the viewport (capped below)
const TRUCK_MAX = 1360;

// Scroll beats (fractions of the pinned scroll)
const BEAT = {
  drive: [0.03, 1],
  skyline: [0.05, 0.2],
  yard: [0.1, 0.27],
  road: [0.08, 0.2],
  foreground: [0.16, 0.3],
  h1In: [0.06, 0.24],
  h1Out: [0.36, 0.44],
  twin: [0.46, 0.64],
  tags: [0.64, 0.72],
  h2In: [0.66, 0.84],
  cta: [0.84, 0.92],
} as const;

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const span = (p: number, [a, b]: readonly [number, number]) => clamp01((p - a) / (b - a));
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

export function Hero() {
  const sectionRef = useRef<HTMLElement>(null);
  const entranceRef = useRef<HTMLDivElement>(null);
  const cameraRef = useRef<HTMLDivElement>(null);
  const solidWorldRef = useRef<HTMLDivElement>(null);
  const wireWorldRef = useRef<HTMLDivElement>(null);
  const skylineWrapRef = useRef<HTMLDivElement>(null);
  const yardWrapRef = useRef<HTMLDivElement>(null);
  const fgWrapRef = useRef<HTMLDivElement>(null);
  // Horizontally sliding tiles, one per layer (wire twins slide in sync with their solid layer).
  const skylineSlide = useRef<HTMLDivElement>(null);
  const skylineWireSlide = useRef<HTMLDivElement>(null);
  const yardSlide = useRef<HTMLDivElement>(null);
  const yardWireSlide = useRef<HTMLDivElement>(null);
  const fgSlide = useRef<HTMLDivElement>(null);
  const roadMarksRef = useRef<HTMLDivElement>(null);
  const wireMarksRef = useRef<HTMLDivElement>(null);
  const truckRef = useRef<HTMLDivElement>(null);
  const solidTruckRef = useRef<HTMLDivElement>(null);
  const wireTruckRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const scanRef = useRef<HTMLDivElement>(null);
  const tagsRef = useRef<HTMLDivElement>(null);
  const shadeRef = useRef<HTMLDivElement>(null);
  const h1Ref = useRef<HTMLHeadingElement>(null);
  const h1Refs = useRef<(HTMLSpanElement | null)[]>([]);
  const h2Refs = useRef<(HTMLSpanElement | null)[]>([]);
  const ctaRef = useRef<HTMLDivElement>(null);
  const cueRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const seqRef = useRef<FrameSequence | null>(null);
  const footageRef = useRef(false);

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

  // Optional footage: replaces the drawn world once its first frame is ready.
  useEffect(() => {
    let cancelled = false;
    loadManifest().then((manifest) => {
      const canvas = canvasRef.current;
      if (!manifest || !canvas || cancelled) return;
      const mobile = window.matchMedia("(max-width: 767px)").matches;
      const seq = new FrameSequence(canvas, manifest, mobile ? "mobile" : "desktop");
      seq.onFirstFrame = () => {
        footageRef.current = true;
        canvas.style.opacity = "1";
      };
      seqRef.current = seq;
    });
    const onResize = () => seqRef.current?.resize();
    window.addEventListener("resize", onResize);
    return () => {
      cancelled = true;
      window.removeEventListener("resize", onResize);
      seqRef.current?.destroy();
      seqRef.current = null;
    };
  }, []);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let p = 0;
    let target = 0;
    let prevD = 0;
    let speed = 0;
    let last = performance.now();
    let raf = 0;
    let vw = window.innerWidth;
    let tile = { skyline: 1, yard: 1, fg: 1 };
    let truckW = 1;
    const wheels: SVGGElement[] = [];
    const slides = { skyline: skylineSlide, skylineWire: skylineWireSlide, yard: yardSlide, yardWire: yardWireSlide, fg: fgSlide };

    const measure = () => {
      const el = sectionRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      target = clamp01(-r.top / (r.height - window.innerHeight));
    };
    const layout = () => {
      vw = window.innerWidth;
      const ratio = TILE.w / TILE.h;
      tile = {
        skyline: (slides.skyline.current?.offsetHeight ?? 1) * ratio,
        yard: (slides.yard.current?.offsetHeight ?? 1) * ratio,
        fg: (slides.fg.current?.offsetHeight ?? 1) * ratio,
      };
      truckW = Math.min(vw * TRUCK_VW, TRUCK_MAX);
      wheels.length = 0;
      solidTruckRef.current?.querySelectorAll<SVGGElement>("[data-wheel]").forEach((w) => wheels.push(w));
      wireTruckRef.current?.querySelectorAll<SVGGElement>("[data-wheel]").forEach((w) => wheels.push(w));
      measure();
    };

    const rise = (el: HTMLDivElement | null, t: number) => {
      if (!el) return;
      const e = easeOut(t);
      el.style.opacity = String(e);
      el.style.transform = `translate3d(0, ${(1 - e) * 35}%, 0)`;
    };

    const render = (now: number, dt: number) => {
      const footage = footageRef.current;
      if (footage) seqRef.current?.setProgress(p);

      // ---- drive: distance travelled drives parallax and wheel spin
      const d = span(p, BEAT.drive) * SCROLL_DISTANCE;
      speed += ((dt > 0 ? Math.abs(d - prevD) / dt : 0) - speed) * Math.min(1, dt * 6);
      prevD = d;
      const slide = (key: keyof typeof slides, factor: number, w: number) => {
        const el = slides[key].current;
        if (el) el.style.transform = `translate3d(${-((d * factor) % w)}px,0,0)`;
      };
      slide("skyline", SPEED.skyline, tile.skyline);
      slide("skylineWire", SPEED.skyline, tile.skyline);
      slide("yard", SPEED.yard, tile.yard);
      slide("yardWire", SPEED.yard, tile.yard);
      slide("fg", SPEED.foreground, tile.fg);
      const marks = `${-d * SPEED.road}px 0`;
      if (roadMarksRef.current) roadMarksRef.current.style.backgroundPosition = marks;
      if (wireMarksRef.current) wireMarksRef.current.style.backgroundPosition = marks;

      const wheelPx = (truckW / TRUCK_VIEW.w) * TRUCK_VIEW.wheelR;
      const angle = (((d / wheelPx) * 180) / Math.PI) % 360;
      wheels.forEach((w) => w.setAttribute("transform", `rotate(${angle} ${w.dataset.wheel} ${TRUCK_VIEW.wheelY})`));

      // ---- the road and yard build themselves as the truck starts rolling
      rise(skylineWrapRef.current, span(p, BEAT.skyline));
      rise(yardWrapRef.current, span(p, BEAT.yard));
      if (roadMarksRef.current) roadMarksRef.current.style.opacity = String(span(p, BEAT.road));
      const twin = easeInOut(span(p, BEAT.twin));
      if (fgWrapRef.current) fgWrapRef.current.style.opacity = String(easeOut(span(p, BEAT.foreground)) * (1 - twin));

      // ---- camera eases toward the cab; the truck pulls ahead and rides the road
      const push = easeInOut(span(p, [0.04, 0.95]));
      if (cameraRef.current) cameraRef.current.style.transform = `scale(${1 + push * 0.12})`;
      const offset = (-0.04 + push * 0.1) * vw;
      const bob = Math.min(1, speed / 900) * (Math.sin(now / 90) * 0.7 + Math.sin(now / 41) * 0.35);
      if (truckRef.current) truckRef.current.style.transform = `translate3d(calc(-50% + ${offset}px), calc(-100% + ${bob}px), 0)`;

      // ---- digitise: a scan line sweeps left → right, converting what it passes
      const scanX = twin * vw;
      const truckLeft = vw / 2 - truckW / 2 + offset;
      const cut = Math.min(truckW, Math.max(0, scanX - truckLeft));
      if (solidWorldRef.current) solidWorldRef.current.style.clipPath = `inset(0 0 0 ${scanX}px)`;
      if (wireWorldRef.current) wireWorldRef.current.style.clipPath = `inset(0 ${vw - scanX}px 0 0)`;
      if (solidTruckRef.current) solidTruckRef.current.style.clipPath = `inset(-20% -10% -20% ${cut}px)`;
      if (wireTruckRef.current) wireTruckRef.current.style.clipPath = `inset(-20% ${truckW - cut}px -20% -10%)`;
      if (glowRef.current) glowRef.current.style.opacity = String(1 - twin);
      if (scanRef.current) {
        scanRef.current.style.transform = `translate3d(${scanX}px,0,0)`;
        scanRef.current.style.opacity = String(twin > 0 && twin < 1 ? Math.pow(Math.sin(Math.PI * twin), 0.35) : 0);
      }
      if (canvasRef.current && footage) {
        canvasRef.current.style.filter = twin ? `grayscale(${twin}) brightness(${1 - twin * 0.55})` : "";
      }
      if (tagsRef.current) {
        const t = span(p, BEAT.tags);
        tagsRef.current.style.opacity = String(footage ? 0 : t);
        tagsRef.current.style.transform = `translateY(${(1 - t) * 10}px)`;
      }

      // ---- copy
      const a = span(p, BEAT.h1In);
      const aOut = span(p, BEAT.h1Out);
      h1Refs.current.forEach((w, i) => {
        if (!w) return;
        const t = clamp01(a * H1.length - i);
        w.style.opacity = String(t * (1 - aOut));
        w.style.transform = `translateY(${(1 - t) * 0.2 - aOut * 0.3}em)`;
      });
      if (h1Ref.current) h1Ref.current.style.visibility = aOut >= 1 ? "hidden" : "visible";
      const b = span(p, BEAT.h2In);
      h2Refs.current.forEach((w, i) => {
        if (!w) return;
        const t = clamp01(b * H2.length - i);
        w.style.opacity = String(t);
        w.style.transform = `translateY(${(1 - t) * 0.2}em)`;
      });
      if (shadeRef.current) shadeRef.current.style.opacity = String(span(p, [0.03, 0.18]) * (1 - twin));
      const cta = span(p, BEAT.cta);
      if (ctaRef.current) {
        ctaRef.current.style.opacity = String(cta);
        ctaRef.current.style.transform = `translateY(${(1 - cta) * 14}px)`;
        ctaRef.current.style.pointerEvents = cta > 0.5 ? "auto" : "none";
      }
      if (cueRef.current) cueRef.current.style.opacity = String(1 - span(p, [0, 0.04]));
    };

    layout();
    p = target;
    prevD = span(p, BEAT.drive) * SCROLL_DISTANCE;

    if (reduced) {
      const still = () => {
        measure();
        p = target;
        render(0, 0);
      };
      still();
      window.addEventListener("scroll", still, { passive: true });
      window.addEventListener("resize", layout);
      return () => {
        window.removeEventListener("scroll", still);
        window.removeEventListener("resize", layout);
      };
    }

    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const diff = target - p;
      p = Math.abs(diff) < 0.0002 ? target : p + diff * (1 - Math.exp(-dt * 12));
      render(now, dt);
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

  const horizonTop = `${HORIZON * 100}%`;
  const horizonBottom = `${(1 - HORIZON) * 100}%`;

  return (
    <section ref={sectionRef} data-nav="light" className="relative h-[400vh] bg-paper" aria-label="Introduction">
      <div className="sticky top-0 h-[100svh] overflow-hidden rounded-b-[28px] bg-[#05090a]">
        <div ref={entranceRef} className="absolute inset-0 will-change-transform">
          <div ref={cameraRef} className="absolute inset-0 origin-[66%_58%] will-change-transform">
            {/* ---------- the real world ---------- */}
            <div ref={solidWorldRef} className="absolute inset-0">
              <div
                aria-hidden
                className="absolute inset-0"
                style={{
                  background:
                    "linear-gradient(to bottom, #b3adb8 0%, #d1c1c1 24%, #e6c2a0 42%, #f0aa69 53%, #d97f40 58.5%, #2a1610 60.6%, #0d0a09 62%, #070605 100%)",
                }}
              />
              <div aria-hidden className="absolute inset-0" style={{ background: "radial-gradient(55% 20% at 56% 58%, rgba(255,170,100,0.6), transparent 70%)" }} />
              <div ref={skylineWrapRef} className="absolute inset-x-0 h-[20vh] overflow-hidden" style={{ bottom: horizonBottom, opacity: 0 }}>
                <div ref={skylineSlide} className="h-full will-change-transform">
                  <Skyline />
                </div>
              </div>
              <div ref={yardWrapRef} className="absolute inset-x-0 h-[30vh] overflow-hidden" style={{ bottom: horizonBottom, opacity: 0 }}>
                <div ref={yardSlide} className="h-full will-change-transform">
                  <Yard />
                </div>
              </div>
              <div aria-hidden className="absolute inset-x-0 h-[5vh] border-t border-[#ffb47a]/25" style={{ top: horizonTop, background: "linear-gradient(#171210, #0b0908)" }} />
              <div
                ref={roadMarksRef}
                aria-hidden
                className="absolute inset-x-0 h-[2px]"
                style={{
                  top: `calc(${horizonTop} + 3.6vh)`,
                  opacity: 0,
                  backgroundImage: "repeating-linear-gradient(to right, rgba(255,214,170,0.35) 0 70px, transparent 70px 170px)",
                }}
              />
            </div>

            {/* ---------- the digital twin ---------- */}
            <div ref={wireWorldRef} aria-hidden className="absolute inset-0 bg-[#05090a]" style={{ clipPath: "inset(0 100% 0 0)" }}>
              <div
                className="absolute inset-x-0 bottom-0"
                style={{
                  top: horizonTop,
                  backgroundImage: "radial-gradient(rgba(127,212,217,0.5) 1px, transparent 1.5px)",
                  backgroundSize: "26px 18px",
                  maskImage: "linear-gradient(to bottom, #000, transparent 85%)",
                }}
              />
              <div
                className="absolute inset-x-0 top-0"
                style={{
                  bottom: horizonBottom,
                  backgroundImage: "radial-gradient(rgba(127,212,217,0.2) 1px, transparent 1.5px)",
                  backgroundSize: "34px 34px",
                  maskImage: "linear-gradient(to top, #000, transparent 75%)",
                }}
              />
              <div className="absolute inset-x-0 h-[20vh] overflow-hidden" style={{ bottom: horizonBottom }}>
                <div ref={skylineWireSlide} className="h-full opacity-60 will-change-transform">
                  <Skyline wire />
                </div>
              </div>
              <div className="absolute inset-x-0 h-[30vh] overflow-hidden" style={{ bottom: horizonBottom }}>
                <div ref={yardWireSlide} className="h-full will-change-transform">
                  <Yard wire />
                </div>
              </div>
              <div className="absolute inset-x-0 h-px bg-cyan/70" style={{ top: horizonTop }} />
              <div
                ref={wireMarksRef}
                className="absolute inset-x-0 h-px"
                style={{
                  top: `calc(${horizonTop} + 3.6vh)`,
                  backgroundImage: "repeating-linear-gradient(to right, rgba(127,212,217,0.8) 0 70px, transparent 70px 170px)",
                }}
              />
            </div>

            {/* ---------- the truck: solid and wire versions share one transform ---------- */}
            <div
              ref={truckRef}
              className="absolute left-1/2 w-[min(82vw,1360px)] will-change-transform"
              style={{ top: `calc(${horizonTop} + 0.4vh)`, transform: "translate3d(calc(-50% - 4vw), -100%, 0)" }}
            >
              <div ref={glowRef} aria-hidden>
                <div className="absolute -bottom-[5%] left-[-4%] h-[14%] w-[108%] rounded-[50%] bg-black/70 blur-xl" />
                {/* headlight: a beam at lamp height and a warm pool across the ground */}
                <div
                  className="absolute left-[97%] top-[65%] h-[70%] w-[60vw] -translate-y-1/2 mix-blend-screen"
                  style={{ background: "radial-gradient(closest-side at 0% 50%, rgba(255,232,196,0.7), rgba(255,200,140,0.18) 45%, transparent 100%)" }}
                />
                <div
                  className="absolute left-[84%] top-full h-[150%] w-[55vw] mix-blend-screen"
                  style={{ background: "radial-gradient(closest-side at 20% 0%, rgba(255,214,160,0.32), rgba(255,190,130,0.08) 60%, transparent 100%)" }}
                />
              </div>
              <div ref={solidTruckRef} className="relative">
                <Truck className="block h-auto w-full" />
              </div>
              <div ref={wireTruckRef} className="absolute inset-x-0 top-0" style={{ clipPath: "inset(-20% 100% -20% -10%)" }}>
                <Truck variant="wire" className="block h-auto w-full drop-shadow-[0_0_6px_rgba(127,212,217,0.55)]" />
              </div>
              <div ref={tagsRef} className="absolute inset-0" style={{ opacity: 0 }}>
                <Tag className="left-[4%] top-[110%]" k="SHP-1042" v="Mumbai → Pune" />
                <Tag className="left-[42%] top-[110%]" k="ETA" v="21:40 IST · on time" />
                <Tag className="right-[2%] top-[110%]" k="Risk 12" v="Clear" />
              </div>
            </div>

            {/* foreground rushes past once the truck is moving */}
            <div ref={fgWrapRef} aria-hidden className="absolute inset-x-0 bottom-0 h-[24vh] overflow-hidden blur-[5px]" style={{ opacity: 0 }}>
              <div ref={fgSlide} className="h-full will-change-transform">
                <Foreground />
              </div>
            </div>

            {/* the scan line */}
            <div
              ref={scanRef}
              aria-hidden
              className="absolute inset-y-0 left-0 w-[2px] bg-cyan shadow-[0_0_18px_4px_rgba(127,212,217,0.65)]"
              style={{ opacity: 0 }}
            />
          </div>

          <canvas ref={canvasRef} aria-hidden className="absolute inset-0 size-full opacity-0 transition-opacity duration-700" />
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

          <div ref={ctaRef} className="absolute inset-x-0 bottom-[14vh] flex flex-wrap justify-center gap-3 px-5" style={{ opacity: 0 }}>
            <ButtonLink href={site.appHref} size="lg">
              Open control tower <ArrowRight size={16} />
            </ButtonLink>
            <ButtonLink href="#how-it-works" size="lg" variant="ghost" className="!border-white/30 !text-white hover:!bg-white/10">
              See how it works
            </ButtonLink>
          </div>
        </div>

        <div ref={cueRef} className="label absolute bottom-7 left-1/2 -translate-x-1/2 text-white/75">
          Scroll to explore
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
