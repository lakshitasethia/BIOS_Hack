"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowRight } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { Hero as Hero2D } from "@/components/landing/hero";
import { INTRO_OPEN_EVENT, introIsOpen } from "@/components/landing/intro";
import { site } from "@/lib/site";

/*
 * Hero — pinned 3D sequence (see yard-scene.ts for the camera and conversion timeline).
 * Copy arrives in three beats over the scene; the word currently being "typed" glows lime.
 * Falls back to the 2D hero when WebGL is unavailable.
 */

const BEATS = [
  { words: "See disruptions before they reach your customers.".split(" "), in: [0.04, 0.16], out: [0.22, 0.27] },
  { words: "Vectrix turns every truck, route and warehouse".split(" "), in: [0.4, 0.52], out: [0.6, 0.66] },
  { words: "into one live risk picture.".split(" "), in: [0.89, 0.96], out: [2, 2] },
] as const;

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const span = (p: number, [a, b]: readonly [number, number]) => clamp01((p - a) / (b - a));

export function Hero() {
  const [fallback, setFallback] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const beatRefs = useRef<(HTMLParagraphElement | null)[]>([]);
  const wordRefs = useRef<(HTMLSpanElement | null)[][]>(BEATS.map(() => []));
  const ctaRef = useRef<HTMLDivElement>(null);
  const cueRef = useRef<HTMLDivElement>(null);
  const blurRef = useRef<HTMLDivElement>(null);

  // Settle in from slightly closer as the intro parts.
  useEffect(() => {
    const el = stageRef.current;
    if (!el || introIsOpen()) return;
    el.style.transform = "scale(1.08)";
    const play = () => {
      el.style.transform = "";
      el.animate([{ transform: "scale(1.08)" }, { transform: "scale(1)" }], { duration: 2000, easing: "cubic-bezier(0.16, 1, 0.3, 1)" });
    };
    window.addEventListener(INTRO_OPEN_EVENT, play, { once: true });
    return () => window.removeEventListener(INTRO_OPEN_EVENT, play);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const section = sectionRef.current;
    if (!canvas || !section) return;

    let scene: import("./yard-scene").YardScene | null = null;
    let raf = 0;
    let visible = true;
    let disposed = false;

    const progress = () => {
      const r = section.getBoundingClientRect();
      return clamp01(-r.top / (r.height - window.innerHeight));
    };

    const copy = (p: number) => {
      BEATS.forEach((beat, bi) => {
        const words = wordRefs.current[bi];
        const t = span(p, beat.in) * words.length;
        const out = span(p, beat.out);
        const el = beatRefs.current[bi];
        if (el) el.style.visibility = t <= 0 || out >= 1 ? "hidden" : "visible";
        words.forEach((w, wi) => {
          if (!w) return;
          const k = clamp01(t - wi);
          w.style.opacity = String(k * (1 - out));
          w.style.transform = `translateY(${(1 - k) * 0.18 - out * 0.25}em)`;
          // the word being typed right now glows lime, then settles to white
          w.style.color = k > 0 && k < 1 ? "var(--color-lime)" : "";
        });
      });
      const cta = span(p, [0.96, 0.995]);
      if (ctaRef.current) {
        ctaRef.current.style.opacity = String(cta);
        ctaRef.current.style.transform = `translateY(${(1 - cta) * 14}px)`;
        ctaRef.current.style.pointerEvents = cta > 0.5 ? "auto" : "none";
      }
      if (cueRef.current) cueRef.current.style.opacity = String(1 - span(p, [0, 0.04]));
      // foreground motion blur: builds as the truck pulls away, eases off once the camera cranes up
      if (blurRef.current) blurRef.current.style.opacity = String(span(p, [0, 0.03]) * (1 - span(p, [0.14, 0.28])));
    };

    const size = () => scene?.resize(canvas.clientWidth, canvas.clientHeight);

    const loop = (time: number) => {
      if (!scene || disposed) return;
      const p = progress();
      scene.setProgress(p);
      scene.render(time);
      copy(p);
      raf = visible ? requestAnimationFrame(loop) : 0;
    };

    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (visible && !raf) raf = requestAnimationFrame(loop);
    });

    import("./yard-scene")
      .then(({ YardScene }) => {
        if (disposed) return;
        try {
          scene = new YardScene(canvas);
        } catch {
          setFallback(true);
          return;
        }
        size();
        io.observe(section);
        raf = requestAnimationFrame(loop);
      })
      .catch(() => setFallback(true));

    window.addEventListener("resize", size);
    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      io.disconnect();
      window.removeEventListener("resize", size);
      scene?.dispose();
    };
  }, []);

  if (fallback) return <Hero2D />;

  return (
    <section ref={sectionRef} data-nav="light" className="relative h-[640vh] bg-paper" aria-label="Introduction">
      <div className="sticky top-0 h-[100svh] overflow-hidden rounded-b-[28px] bg-[#05090a]">
        <div ref={stageRef} className="absolute inset-0 will-change-transform">
          <canvas ref={canvasRef} aria-hidden className="block size-full" />
        </div>

        <div
          ref={blurRef}
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-[34%] backdrop-blur-[7px]"
          style={{ opacity: 0, maskImage: "linear-gradient(to top, #000 55%, transparent)", WebkitMaskImage: "linear-gradient(to top, #000 55%, transparent)" }}
        />

        <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(80%_60%_at_50%_70%,transparent_40%,rgba(0,0,0,0.35))]" />

        <div className="pointer-events-none absolute inset-x-0 bottom-[16vh] mx-auto max-w-6xl px-5 text-center md:px-8">
          <div className="grid place-items-center">
            {BEATS.map((beat, bi) => {
              const Tag = bi === 0 ? "h1" : "p";
              return (
                <Tag
                  key={bi}
                  ref={(el: HTMLParagraphElement | null) => {
                    beatRefs.current[bi] = el;
                  }}
                  aria-hidden={bi > 0 || undefined}
                  className="col-start-1 row-start-1 max-w-5xl text-[clamp(2.5rem,6.6vw,6rem)] font-normal leading-[1.02] tracking-[-0.04em] text-white [text-shadow:0_2px_30px_rgba(0,0,0,0.35)]"
                  style={{ visibility: "hidden" }}
                >
                  {beat.words.map((w, wi) => (
                    <span
                      key={wi}
                      ref={(el) => {
                        wordRefs.current[bi][wi] = el;
                      }}
                      className="inline-block will-change-transform"
                      style={{ opacity: 0 }}
                    >
                      {w}
                      {wi < beat.words.length - 1 ? " " : ""}
                    </span>
                  ))}
                </Tag>
              );
            })}
          </div>
        </div>

        <div ref={ctaRef} className="absolute inset-x-0 bottom-[7vh] flex flex-wrap justify-center gap-3 px-5" style={{ opacity: 0 }}>
          <ButtonLink href={site.appHref} size="lg">
            Open control tower <ArrowRight size={16} />
          </ButtonLink>
          <ButtonLink href="#how-it-works" size="lg" variant="ghost" className="!border-white/30 !text-white hover:!bg-white/10">
            See how it works
          </ButtonLink>
        </div>

        <div ref={cueRef} className="label absolute right-[8vw] top-[38%] text-black/60">
          Scroll to explore
        </div>
      </div>
    </section>
  );
}
