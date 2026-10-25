"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import { INTRO_OPEN_EVENT, introIsOpen } from "@/components/landing/intro";

declare global {
  interface Window {
    __lenis?: Lenis;
  }
}

// Inertial smooth scrolling for the landing page; scroll-driven scenes read window.scrollY as usual.
export function SmoothScroll() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    document.documentElement.style.scrollBehavior = "auto";
    const lenis = new Lenis({ lerp: 0.1, anchors: true });
    window.__lenis = lenis;
    // Hold still while the intro plays; release shortly after the panels start to part.
    let release = 0;
    const onOpen = () => {
      release = window.setTimeout(() => lenis.start(), 500);
    };
    if (!introIsOpen()) {
      lenis.stop();
      window.addEventListener(INTRO_OPEN_EVENT, onOpen, { once: true });
    }
    let raf = 0;
    const loop = (t: number) => {
      lenis.raf(t);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(release);
      window.removeEventListener(INTRO_OPEN_EVENT, onOpen);
      lenis.destroy();
      window.__lenis = undefined;
      document.documentElement.style.scrollBehavior = "";
    };
  }, []);
  return null;
}
