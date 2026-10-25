"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import { INTRO_OPEN_EVENT, introIsOpen } from "@/components/landing/intro";

declare global {
  interface Window {
    __lenis?: Lenis;
  }
}

const NAV_OFFSET = 64;
const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

// Glide to an in-page section (#id), clearing the fixed nav. Uses Lenis when it's running.
export function scrollToSection(hash: string) {
  const el = document.getElementById(hash.replace(/^#/, ""));
  if (!el) return false;
  const lenis = window.__lenis;
  if (lenis) {
    lenis.scrollTo(el, { offset: -NAV_OFFSET, duration: 1.6, easing: easeInOutCubic });
  } else {
    const y = el.getBoundingClientRect().top + window.scrollY - NAV_OFFSET;
    window.scrollTo({ top: y, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  }
  history.replaceState(null, "", hash);
  return true;
}

// Click handler for anchor links: smooth-scroll instead of jumping.
export function onAnchorClick(e: React.MouseEvent<HTMLAnchorElement>) {
  const href = e.currentTarget.getAttribute("href") ?? "";
  if (!href.startsWith("#") || e.metaKey || e.ctrlKey || e.shiftKey) return;
  if (scrollToSection(href)) e.preventDefault();
}

// Inertial smooth scrolling for the landing page; scroll-driven scenes read window.scrollY as usual.
export function SmoothScroll() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    document.documentElement.style.scrollBehavior = "auto";
    const lenis = new Lenis({ lerp: 0.1 });
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
