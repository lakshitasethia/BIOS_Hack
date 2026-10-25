"use client";

import { useEffect, useRef, useState } from "react";
import { site } from "@/lib/site";

/*
 * Intro aperture — DESIGN.md §7.3.
 * Two paper panels cover the screen. Corner line-art drifts in, the mark grows into the
 * wordmark, then a notch morphs into each panel's inner edge — together they form a
 * tapered slit with the dusk scene glowing through — and finally the panels part.
 * Everything is transform / opacity / clip-path on a single rAF timeline.
 * Plays once per session; skipped entirely for reduced motion (see the pre-paint script in layout).
 */

export const INTRO_OPEN_EVENT = "vectrix:intro-open";
const SEEN_KEY = "vectrix-intro";

declare global {
  interface Window {
    __vectrixIntroOpen?: boolean;
  }
}

// True when the scene is (or will be) visible without waiting for the intro.
export function introIsOpen() {
  return typeof window !== "undefined" && (window.__vectrixIntroOpen || document.documentElement.classList.contains("no-intro"));
}

// Timeline (ms)
const T = {
  artIn: [200, 1100],
  markIn: [450, 950],
  wordIn: [1250, 1800],
  slit: [1950, 2450],
  logoOut: [1950, 2200],
  part: [2550, 3500],
  end: 3560,
} as const;

const SLIT = 0.022; // slit half-depth, as a fraction of viewport height
const NOTCH_L = 12.5; // notch spans 12.5% → 87.5% of the width
const NOTCH_R = 87.5;

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const prog = (t: number, [a, b]: readonly [number, number]) => clamp01((t - a) / (b - a));
const outExpo = (t: number) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t));
const inOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

export function notch(edge: "bottom" | "top", d: number) {
  const L = `${NOTCH_L}%`;
  const R = `${NOTCH_R}%`;
  if (edge === "bottom") {
    return `polygon(0 0, 100% 0, 100% 100%, ${R} 100%, calc(${R} - ${d}px) calc(100% - ${d}px), calc(${L} + ${d}px) calc(100% - ${d}px), ${L} 100%, 0 100%)`;
  }
  return `polygon(0 0, ${L} 0, calc(${L} + ${d}px) ${d}px, calc(${R} - ${d}px) ${d}px, ${R} 0, 100% 0, 100% 100%, 0 100%)`;
}

export function Intro() {
  const [done, setDone] = useState(false);
  const topRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const artRefs = useRef<(SVGGElement | null)[]>([]);
  const logoRef = useRef<HTMLDivElement>(null);
  const shiftRef = useRef<HTMLDivElement>(null);
  const markRef = useRef<HTMLSpanElement>(null);
  const wordRef = useRef<HTMLSpanElement>(null);
  const skipRef = useRef<() => void>(() => { });

  useEffect(() => {
    const root = document.documentElement;
    if (root.classList.contains("no-intro")) {
      window.__vectrixIntroOpen = true;
      // Unmounting after the pre-paint skip is a one-time sync with an external flag.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDone(true);
      return;
    }

    history.scrollRestoration = "manual";
    window.scrollTo(0, 0);
    root.style.overflow = "hidden";

    let opened = false;
    let raf = 0;
    const start = performance.now();
    const wordGap = 10;

    const open = () => {
      if (opened) return;
      opened = true;
      window.__vectrixIntroOpen = true;
      window.dispatchEvent(new Event(INTRO_OPEN_EVENT));
    };

    const finish = () => {
      cancelAnimationFrame(raf);
      open();
      root.style.overflow = "";
      try {
        sessionStorage.setItem(SEEN_KEY, "1");
      } catch { }
      setDone(true);
    };
    skipRef.current = finish;

    const frame = (now: number) => {
      const t = now - start;
      const vh = window.innerHeight;

      // corner line-art drifts in from beyond the edges
      const art = outExpo(prog(t, T.artIn));
      artRefs.current.forEach((g, i) => {
        if (!g) return;
        const dx = (i % 2 ? 1 : -1) * 40 * (1 - art);
        const dy = (i < 2 ? -1 : 1) * 28 * (1 - art);
        g.style.transform = `translate(${dx}px, ${dy}px)`;
        g.style.opacity = String(art);
      });

      // mark, then the wordmark slides out beside it
      const mark = outExpo(prog(t, T.markIn));
      const word = outExpo(prog(t, T.wordIn));
      const out = prog(t, T.logoOut);
      if (markRef.current) markRef.current.style.transform = `scale(${0.6 + 0.4 * mark})`;
      if (wordRef.current && shiftRef.current) {
        const w = wordRef.current.offsetWidth + wordGap;
        shiftRef.current.style.transform = `translateX(${(w / 2) * (1 - word)}px)`;
        wordRef.current.style.clipPath = `inset(0 ${100 * (1 - word)}% 0 0)`;
      }
      if (logoRef.current) {
        logoRef.current.style.opacity = String(mark * (1 - out));
        logoRef.current.style.transform = `translate(-50%, -50%) scale(${1 - 0.04 * out})`;
      }

      // the notch opens into a slit, then the panels part
      const slit = outExpo(prog(t, T.slit));
      const part = inOutCubic(prog(t, T.part));
      const depth = slit * SLIT * vh + part * 90;
      const seam = slit * 0.75; // a hairline of the scene shows along the seam
      const travel = part * (vh / 2 + 120);
      if (topRef.current) {
        topRef.current.style.clipPath = notch("bottom", depth);
        topRef.current.style.transform = `translateY(${-seam - travel}px)`;
      }
      if (bottomRef.current) {
        bottomRef.current.style.clipPath = notch("top", depth);
        bottomRef.current.style.transform = `translateY(${seam + travel}px)`;
      }

      if (t >= T.part[0]) open();
      if (t >= T.part[0] + 500) root.style.overflow = "";
      if (t >= T.end) return finish();
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      root.style.overflow = "";
    };
  }, []);

  if (done) return null;

  return (
    <div data-intro className="fixed inset-0 z-[70]" aria-hidden>
      <Panel refEl={topRef} half="top" artRefs={artRefs} />
      <Panel refEl={bottomRef} half="bottom" artRefs={artRefs} />

      <div ref={logoRef} className="absolute left-1/2 top-1/2 text-night-900" style={{ opacity: 0, transform: "translate(-50%, -50%)" }}>
        <div ref={shiftRef} className="flex items-center gap-2.5">
          <span ref={markRef} className="block">
            <svg width="26" height="26" viewBox="0 0 22 22">
              <rect x="1" y="1" width="20" height="20" rx="5" fill="var(--color-night-900)" />
              <path d="M6 15 L10 7 L13 12 L16 7" stroke="var(--color-signal-500)" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          <span ref={wordRef} className="block text-[1.625rem] font-medium tracking-[-0.03em]" style={{ clipPath: "inset(0 100% 0 0)" }}>
            {site.name}
          </span>
        </div>
      </div>

      <button
        onClick={() => skipRef.current()}
        className="label focus-ring absolute bottom-6 right-6 rounded px-2 py-1 text-night-900/60 hover:text-night-900"
        aria-hidden={false}
      >
        Skip intro
      </button>
    </div>
  );
}

// One half of the cover. Each half renders the full-screen line-art, offset so the two read as one drawing.
function Panel({
  refEl,
  half,
  artRefs,
}: {
  refEl: React.RefObject<HTMLDivElement | null>;
  half: "top" | "bottom";
  artRefs: React.RefObject<(SVGGElement | null)[]>;
}) {
  const top = half === "top";
  return (
    <div
      ref={refEl}
      className={`absolute inset-x-0 h-[calc(50vh+1px)] overflow-hidden bg-paper will-change-transform ${top ? "top-0" : "bottom-0"}`}
    >
      <svg
        viewBox="0 0 1440 900"
        preserveAspectRatio="xMidYMid slice"
        className={`absolute inset-x-0 h-screen w-full ${top ? "top-0" : "bottom-0"}`}
        fill="none"
        stroke="rgba(22,35,42,0.16)"
        strokeWidth={1}
      >
        {CORNERS.map((d, i) =>
          (top ? i < 2 : i >= 2) ? (
            <g
              key={i}
              ref={(el) => {
                artRefs.current[i] = el;
              }}
              style={{ opacity: 0 }}
            >
              {d.map((p) => (
                <path key={p} d={p} vectorEffect="non-scaling-stroke" />
              ))}
            </g>
          ) : null,
        )}
      </svg>
    </div>
  );
}

// Rounded, stepped outlines with chamfered notches — one cluster per corner (TL, TR, BL, BR).
const CORNERS = [
  [
    "M-40 150 H70 a28 28 0 0 0 28-28 V96 a28 28 0 0 1 28-28 H420 a28 28 0 0 0 28-28 V-40",
    "M-40 330 L52 422 a26 26 0 0 0 18 8",
  ],
  [
    "M930 -40 V118 a28 28 0 0 0 28 28 H1300 a28 28 0 0 1 28 28 V300 a28 28 0 0 0 28 28 H1480",
  ],
  [
    "M-40 690 H262 a22 22 0 0 1 15.5 37.5 L120 940",
    "M-40 760 H40",
  ],
  [
    "M1480 770 H1210 a28 28 0 0 0 -28 28 V940",
    "M1290 690 H1392 a22 22 0 0 1 15.5 6.5 L1480 770",
  ],
];
