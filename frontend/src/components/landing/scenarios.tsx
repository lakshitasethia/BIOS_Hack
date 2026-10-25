"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  CloudRain,
  Factory,
  PackageX,
  TrafficCone,
  type LucideIcon,
} from "lucide-react";
import type { Shot } from "@/components/landing/yard-scene";

/*
 * Scenarios — a pinned horizontal scroll (GSAP ScrollTrigger). Scrolling down slides the
 * cards sideways; when the last card is in view the page carries on down.
 * Card images are rendered once, in the browser, from the same 3D yard as the hero.
 */

type Scenario = {
  type: string;
  icon: LucideIcon;
  title: string;
  place: string;
  signal: string;
  impact: string;
  action: string;
  shot: Shot;
};

const SCENARIOS: Scenario[] = [
  {
    type: "Weather",
    icon: CloudRain,
    title: "A monsoon landslide shuts the Khandala ghat",
    place: "Mumbai – Pune Expressway",
    signal: "IMD red alert · 210 mm rain forecast",
    impact: "9 shipments · +7h · ₹14.2L at stake",
    action: "Reroute 6 via old NH-48, hold 3 at Bhiwandi",
    shot: {
      dist: 8,
      cam: [20, 40, 30],
      look: [22, 0, 2],
      fov: 40,
      convert: 0,
      radius: 12,
      night: 0.4,
      routes: 1,
    },
  },
  {
    type: "Traffic",
    icon: TrafficCone,
    title: "Container trucks queue for 14 hours at the port gate",
    place: "JNPT, Navi Mumbai",
    signal: "Gate dwell time 3× normal",
    impact: "22 containers · ₹31L demurrage risk",
    action: "Rebook 8 pickups to the 02:00 slot, move 6 by rail",
    shot: {
      dist: 8,
      cam: [-8, 21, 5],
      look: [17, 1, -12],
      fov: 46,
      convert: 0,
      radius: 12,
      night: 0.18,
      routes: 0,
    },
  },
  {
    type: "Supplier",
    icon: Factory,
    title: "A component supplier slips four days",
    place: "Sriperumbudur, Chennai",
    signal: "Supplier ETA moved from 12 to 16 Nov",
    impact: "3 SKUs · 1,240 units · ₹42L of orders",
    action: "Expedite 40% of volume from the Pune backup supplier",
    shot: {
      dist: 8,
      cam: [30, 28, 14],
      look: [46, 0, -22],
      fov: 44,
      convert: 0,
      radius: 12,
      night: 0.28,
      routes: 0,
    },
  },
  {
    type: "Inventory",
    icon: PackageX,
    title: "A fast-moving SKU drops below safety stock",
    place: "Gurugram distribution centre",
    signal: "2.1 days of cover left · demand +18%",
    impact: "36 store orders at risk this week",
    action: "Transfer 600 units from Jaipur DC, arrives in 9h",
    shot: {
      dist: 8,
      cam: [40, 30, 18],
      look: [40, 0, -20],
      fov: 46,
      convert: 1.02,
      radius: 30,
      night: 0.85,
      routes: 0,
    },
  },
];

// Renders each card's shot once with an offscreen 3D yard, then frees the GPU context.
function useYardSnapshots(
  trigger: React.RefObject<HTMLElement | null>,
  shots: Shot[],
) {
  const [urls, setUrls] = useState<(string | null)[]>(() =>
    shots.map(() => null),
  );
  useEffect(() => {
    const el = trigger.current;
    if (!el) return;
    let done = false;
    const io = new IntersectionObserver(
      async ([e]) => {
        if (!e.isIntersecting || done) return;
        done = true;
        io.disconnect();
        const { YardScene } = await import("./yard-scene");
        const canvas = document.createElement("canvas");
        try {
          const scene = new YardScene(canvas);
          scene.resize(1200, 900);
          const out = shots.map((shot) => {
            scene.setShot(shot);
            scene.render(performance.now());
            return canvas.toDataURL("image/webp", 0.88);
          });
          scene.dispose();
          setUrls(out);
        } catch {
          // no WebGL: cards keep their icon placeholders
        }
      },
      { rootMargin: "800px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [trigger, shots]);
  return urls;
}

const SHOTS = SCENARIOS.map((s) => s.shot);
const GUTTER = "max(1.25rem, calc((100vw - 80rem) / 2 + 2rem))";

export function Scenarios() {
  const sectionRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const markerRef = useRef<HTMLDivElement>(null);
  const images = useYardSnapshots(sectionRef, SHOTS);

  useEffect(() => {
    const section = sectionRef.current;
    const track = trackRef.current;
    if (!section || !track) return;
    gsap.registerPlugin(ScrollTrigger);
    const mm = gsap.matchMedia();
    mm.add(
      "(min-width: 768px) and (prefers-reduced-motion: no-preference)",
      () => {
        const distance = () =>
          Math.max(0, track.scrollWidth - window.innerWidth);
        const tween = gsap.to(track, {
          x: () => -distance(),
          ease: "none",
          scrollTrigger: {
            trigger: section,
            start: "top top",
            end: () => `+=${distance()}`,
            pin: true,
            scrub: 0.8,
            invalidateOnRefresh: true,
            onUpdate: (self) => {
              if (markerRef.current)
                markerRef.current.style.left = `calc(${self.progress * 100}% - 1px)`;
            },
          },
        });
        return () => {
          tween.scrollTrigger?.kill();
          tween.kill();
        };
      },
    );
    return () => mm.revert();
  }, []);

  // The pinned element is wrapped in a React-owned div: GSAP inserts a pin-spacer around the
  // section, and React must never be asked to remove a node whose parent GSAP replaced.
  return (
    <div>
      <section
        id="scenarios"
        ref={sectionRef}
        data-nav="light"
        className="flex min-h-[100svh] flex-col justify-center overflow-hidden bg-paper py-16 text-black md:h-[100svh] md:py-0"
      >
        <div className="mx-auto w-full max-w-7xl px-5 md:px-8">
          <p className="label text-black/55">Scenarios</p>
          <h2 className="mt-4 text-[clamp(2.25rem,4vw,3.5rem)] font-medium leading-[1.05] tracking-[-0.03em]">
            Built for the weeks that break plans
          </h2>
        </div>

        {/* phones swipe natively; from md up the track is driven by the pinned scroll */}
        <div className="mt-10 overflow-x-auto [scrollbar-width:none] md:overflow-visible [&::-webkit-scrollbar]:hidden">
          <div
            ref={trackRef}
            className="flex w-max gap-8 pb-2 will-change-transform"
            style={{ paddingInline: GUTTER }}
          >
            {SCENARIOS.map((s, i) => (
              <article
                key={s.title}
                className="grid h-[min(62vh,560px)] w-[min(88vw,64rem)] shrink-0 grid-cols-1 gap-8 border-l-2 border-tide-500 pl-6 md:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]"
              >
                <div className="relative overflow-hidden bg-paper-bar">
                  {images[i] ? (
                    // Generated in the browser from the 3D yard, so there is nothing for next/image to optimise.
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={images[i]!}
                      alt=""
                      className="absolute inset-0 size-full object-cover"
                    />
                  ) : (
                    <s.icon
                      size={64}
                      strokeWidth={1}
                      className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-black/40"
                      aria-hidden
                    />
                  )}
                  <div
                    aria-hidden
                    className="absolute inset-0 bg-[linear-gradient(to_top,rgba(5,9,10,0.6),transparent_45%)]"
                  />
                  <span className="label absolute left-5 top-5 rounded bg-black/45 px-2 py-1 text-white/90 backdrop-blur">
                    {s.type}
                  </span>
                  <span
                    className="absolute right-5 top-5 size-2.5 bg-signal-500"
                    aria-hidden
                  />
                  <span className="absolute bottom-5 left-5 font-mono text-[0.8125rem] text-white/85">
                    {s.place}
                  </span>
                </div>
                <div className="flex flex-col py-2">
                  <span className="font-mono text-sm text-black/40">
                    0{i + 1}
                  </span>
                  <h3 className="mt-3 text-[clamp(1.5rem,2.2vw,2rem)] font-medium leading-[1.15] tracking-[-0.02em]">
                    {s.title}
                  </h3>
                  <dl className="mt-auto flex flex-col gap-4 pt-8">
                    {[
                      ["Signal", s.signal],
                      ["Impact", s.impact],
                      ["Action", s.action],
                    ].map(([k, v]) => (
                      <div key={k} className="border-t border-black/10 pt-3">
                        <dt
                          className={`label ${k === "Action" ? "text-signal-700" : "text-black/50"}`}
                        >
                          {k}
                        </dt>
                        <dd className="mt-1.5 text-[1.0625rem] leading-snug text-black/85">
                          {v}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </div>
              </article>
            ))}
          </div>
        </div>

        <div
          className="mx-auto mt-10 hidden w-full max-w-7xl px-5 md:block md:px-8"
          aria-hidden
        >
          <div className="relative h-5">
            <div className="absolute inset-0 bg-[repeating-linear-gradient(to_right,rgba(0,0,0,0.28)_0_1px,transparent_1px_12px)] [mask-image:linear-gradient(to_bottom,#000_50%,transparent_50%)]" />
            <div
              ref={markerRef}
              className="absolute top-0 h-full w-0.5 bg-tide-500"
              style={{ left: "-1px" }}
            />
          </div>
        </div>
      </section>
    </div>
  );
}
