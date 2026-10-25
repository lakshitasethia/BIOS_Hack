"use client";

import { useEffect, useRef } from "react";

/*
 * Types text in on mount: each character flashes neon green, then settles to its final
 * colour (the same effect as the landing page's step copy, but driven by time).
 * Wrap emphasised runs in **double asterisks** to render them bold.
 */

const NEON = [95, 209, 58];
const TRAIL = 14;
const DEFAULT_INK = [11, 42, 44];

export function NeonText({ text, ink = DEFAULT_INK, cps = 70, delay = 250, className = "" }: { text: string; ink?: number[]; cps?: number; delay?: number; className?: string }) {
  const refs = useRef<(HTMLSpanElement | null)[]>([]);
  const parts = text.split("**").flatMap((run, i) => Array.from(run).map((ch) => ({ ch, bold: i % 2 === 1 })));

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const inkCss = `rgb(${ink.join(",")})`;
    let raf = 0;
    const start = performance.now() + delay;
    const frame = (now: number) => {
      const n = reduced ? Infinity : ((now - start) / 1000) * cps;
      refs.current.forEach((el, i) => {
        if (!el) return;
        const d = n - i;
        if (d <= 0) {
          el.style.color = "transparent";
          el.style.textShadow = "";
        } else if (d >= TRAIL) {
          el.style.color = inkCss;
          el.style.textShadow = "";
        } else {
          const t = d / TRAIL;
          el.style.color = `rgb(${NEON.map((v, k) => Math.round(v + (ink[k] - v) * t)).join(",")})`;
          el.style.textShadow = `0 0 ${12 * (1 - t)}px rgba(95,209,58,${0.5 * (1 - t)})`;
        }
      });
      if (n < refs.current.length + TRAIL) raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [cps, delay, ink]);

  return (
    <span className={className} aria-label={text.replaceAll("**", "")}>
      {parts.map((p, i) => (
        <span
          key={i}
          aria-hidden
          ref={(el) => {
            refs.current[i] = el;
          }}
          className={p.bold ? "font-semibold" : undefined}
          style={{ color: "transparent" }}
        >
          {p.ch}
        </span>
      ))}
    </span>
  );
}
