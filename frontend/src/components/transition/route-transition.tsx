"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, type ComponentProps, type MouseEvent } from "react";
import { notch } from "@/components/landing/intro";

/*
 * Page transitions in the intro's visual language: two paper panels close over the page,
 * the route changes behind them, then a notched slit opens onto the new page and the
 * panels part. Mounted once in the root layout so it survives navigation.
 */

const NAVIGATE = "vectrix:navigate";
const COVER_MS = 520;
const SLIT_MS = 320;
const PART_MS = 760;

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const inOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const outExpo = (t: number) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t));

export function navigateWithTransition(href: string) {
  window.dispatchEvent(new CustomEvent(NAVIGATE, { detail: href }));
}

// A next/link that plays the page transition for in-app routes.
export function TransitionLink({ href, onClick, ...props }: ComponentProps<typeof Link>) {
  const target = typeof href === "string" ? href : href.pathname ?? "/";
  const handle = (e: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(e);
    if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    if (!target.startsWith("/") || target === window.location.pathname) return;
    e.preventDefault();
    navigateWithTransition(target);
  };
  return <Link href={href} onClick={handle} {...props} />;
}

export function RouteTransition() {
  const router = useRouter();
  const pathname = usePathname();
  const rootRef = useRef<HTMLDivElement>(null);
  const topRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const state = useRef<{ busy: boolean; waitingFor: string | null; raf: number }>({ busy: false, waitingFor: null, raf: 0 });

  const paint = (cover: number, slit: number, part: number) => {
    const vh = window.innerHeight;
    const depth = slit * 0.022 * vh + part * 90;
    const travel = (1 - cover) * (vh / 2 + 40) + part * (vh / 2 + 120);
    if (topRef.current) {
      topRef.current.style.transform = `translateY(${-travel}px)`;
      topRef.current.style.clipPath = notch("bottom", depth);
    }
    if (bottomRef.current) {
      bottomRef.current.style.transform = `translateY(${travel}px)`;
      bottomRef.current.style.clipPath = notch("top", depth);
    }
  };

  const run = (duration: number, step: (t: number) => void, done: () => void) => {
    const start = performance.now();
    const frame = (now: number) => {
      const t = clamp01((now - start) / duration);
      step(t);
      if (t < 1) state.current.raf = requestAnimationFrame(frame);
      else done();
    };
    state.current.raf = requestAnimationFrame(frame);
  };

  const reveal = () => {
    run(
      SLIT_MS,
      (t) => paint(1, outExpo(t), 0),
      () =>
        run(
          PART_MS,
          (t) => paint(1, 1, inOut(t)),
          () => {
            if (rootRef.current) rootRef.current.style.visibility = "hidden";
            state.current.busy = false;
          },
        ),
    );
  };

  useEffect(() => {
    const onNavigate = (e: Event) => {
      const href = (e as CustomEvent<string>).detail;
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        router.push(href);
        return;
      }
      if (state.current.busy) return;
      state.current.busy = true;
      router.prefetch(href);
      if (rootRef.current) rootRef.current.style.visibility = "visible";
      run(
        COVER_MS,
        (t) => paint(inOut(t), 0, 0),
        () => {
          state.current.waitingFor = href;
          router.push(href);
        },
      );
    };
    window.addEventListener(NAVIGATE, onNavigate);
    const s = state.current;
    return () => {
      window.removeEventListener(NAVIGATE, onNavigate);
      cancelAnimationFrame(s.raf);
    };
  }, [router]);

  // The new route has rendered underneath the closed panels — open onto it.
  useEffect(() => {
    if (state.current.waitingFor && pathname === state.current.waitingFor) {
      state.current.waitingFor = null;
      window.scrollTo(0, 0);
      const id = window.setTimeout(reveal, 140);
      return () => clearTimeout(id);
    }
    // reveal is stable for the component's lifetime
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  return (
    <div ref={rootRef} aria-hidden className="pointer-events-none fixed inset-0 z-[80]" style={{ visibility: "hidden" }}>
      <div ref={topRef} className="absolute inset-x-0 top-0 h-[calc(50vh+1px)] bg-paper will-change-transform" style={{ transform: "translateY(-110%)" }}>
        <TransitionMark />
      </div>
      <div ref={bottomRef} className="absolute inset-x-0 bottom-0 h-[calc(50vh+1px)] bg-paper will-change-transform" style={{ transform: "translateY(110%)" }} />
    </div>
  );
}

function TransitionMark() {
  return (
    <svg width="26" height="26" viewBox="0 0 22 22" className="absolute bottom-6 left-1/2 -translate-x-1/2" aria-hidden>
      <rect x="1" y="1" width="20" height="20" rx="5" fill="var(--color-night-900)" />
      <path d="M6 15 L10 7 L13 12 L16 7" stroke="var(--color-signal-500)" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
