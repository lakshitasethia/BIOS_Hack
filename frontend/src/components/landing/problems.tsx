"use client";

import { useEffect, useRef } from "react";

/*
 * "Four ways the network breaks" — a blueprint-style column grid. Each disruption gets an
 * isometric line drawing that draws itself in once, then on hover darkens, lifts, and lights
 * the one part that matters in signal orange (DESIGN.md: orange is always the disruption).
 */

type Pt = [number, number];

// Isometric projection: x runs right-down, y runs left-down, z runs up.
const P = (x: number, y: number, z: number): Pt => [(x - y) * 0.866, (x + y) * 0.5 - z];
const f = (n: number) => Math.round(n * 10) / 10;
const poly = (pts: Pt[]) => `M${pts.map(([x, y]) => `${f(x)} ${f(y)}`).join(" L")} Z`;
const seg = (a: Pt, b: Pt) => `M${f(a[0])} ${f(a[1])} L${f(b[0])} ${f(b[1])}`;

// A box with its near corner at (x, y, z), w along x, d along y, h up.
// `visible` is the outline of the three faces the camera sees, `hidden` the three back edges.
function box(x: number, y: number, z: number, w: number, d: number, h: number) {
  const visible = [
    poly([P(x, y, z + h), P(x + w, y, z + h), P(x + w, y + d, z + h), P(x, y + d, z + h)]),
    poly([P(x + w, y, z), P(x + w, y + d, z), P(x + w, y + d, z + h), P(x + w, y, z + h)]),
    poly([P(x, y + d, z), P(x + w, y + d, z), P(x + w, y + d, z + h), P(x, y + d, z + h)]),
  ].join(" ");
  const hidden = [
    seg(P(x, y, z), P(x + w, y, z)),
    seg(P(x, y, z), P(x, y + d, z)),
    seg(P(x, y, z), P(x, y, z + h)),
  ].join(" ");
  return { visible, hidden };
}

// A circle of radius r lying flat at height z, as an isometric ellipse.
function ring(r: number, z = 0) {
  const rx = r * 1.2247;
  const ry = r * 0.7071;
  const cy = -z;
  return `M${f(-rx)} ${f(cy)} A${f(rx)} ${f(ry)} 0 1 0 ${f(rx)} ${f(cy)} A${f(rx)} ${f(ry)} 0 1 0 ${f(-rx)} ${f(cy)}`;
}

const V = "iso iso-v";
const H = "iso iso-hid";

function Traffic() {
  const road = box(-62, -34, -6, 124, 68, 6);
  const cars = [-52, -24, 4].map((x) => box(x, -7, 0, 20, 14, 10));
  const last = box(32, -7, 0, 20, 14, 10);
  return (
    <g transform="translate(0 6)">
      <path d={road.hidden} className={H} />
      <path d={road.visible} className={V} pathLength={1} />
      <path d={seg(P(-62, 0, 0), P(62, 0, 0))} className={`${H} iso-march`} />
      <g className="iso-float">
        {cars.map((c, i) => (
          <g key={i}>
            <path d={c.hidden} className={H} />
            <path d={c.visible} className={V} pathLength={1} />
          </g>
        ))}
        <path d={last.hidden} className={H} />
        <path d={last.visible} className={`${V} iso-acc`} pathLength={1} />
      </g>
    </g>
  );
}

function Weather() {
  return (
    <g transform="translate(0 40)">
      <path d={ring(64)} className={`${H} iso-march`} />
      <path d={ring(44)} className={V} pathLength={1} />
      <path d={ring(24)} className={V} pathLength={1} />
      <path d={seg([0, -118], [0, 0])} className={`${H} iso-march`} />
      <g className="iso-float">
        <path d={`${ring(22, 74)} M-27 -74 L-27 0 M27 -74 L27 0 M-27 0 A27 15.6 0 0 0 27 0`} className={`${V} iso-acc`} pathLength={1} />
        <path d={`M-12 -52 L-12 -34 M0 -58 L0 -30 M12 -52 L12 -34`} className={H} />
      </g>
    </g>
  );
}

function Supplier() {
  const belt = box(-62, -18, -6, 124, 36, 6);
  const now = box(-54, -10, 0, 26, 20, 26);
  const later = box(28, -10, 0, 26, 20, 26);
  return (
    <g transform="translate(0 14)">
      <path d={belt.hidden} className={H} />
      <path d={belt.visible} className={V} pathLength={1} />
      <path d={`${later.hidden} ${later.visible}`} className={H} />
      <path d={seg(P(-20, 0, 13), P(22, 0, 13))} className={`${H} iso-march`} />
      <path d={`M${f(P(22, 0, 13)[0] - 7)} ${f(P(22, 0, 13)[1] - 3)} L${f(P(22, 0, 13)[0])} ${f(P(22, 0, 13)[1])} L${f(P(22, 0, 13)[0] - 8)} ${f(P(22, 0, 13)[1] + 5)}`} className={H} />
      <g className="iso-float">
        <path d={now.hidden} className={H} />
        <path d={now.visible} className={`${V} iso-acc`} pathLength={1} />
      </g>
    </g>
  );
}

function Stock() {
  const z = [0, 28, 56];
  const slabs = z.map((h) => box(-42, -42, h, 84, 84, 9));
  const slot = box(-42, -42, 84, 84, 84, 9);
  const post = (x: number, y: number) => seg(P(x, y, 0), P(x, y, 84));
  return (
    <g transform="translate(0 52)">
      {[post(-42, -42), post(42, -42), post(-42, 42)].map((d, i) => (
        <path key={i} d={d} className={H} />
      ))}
      {slabs.map((s, i) => (
        <g key={i}>
          <path d={s.hidden} className={H} />
          <path d={s.visible} className={V} pathLength={1} />
        </g>
      ))}
      <g className="iso-float">
        <path d={slot.hidden} className={H} />
        <path d={slot.visible} className={`${H} iso-acc`} />
      </g>
    </g>
  );
}

const COLUMNS = [
  {
    tag: "Traffic",
    art: Traffic,
    title: "Roads and ports clog without warning",
    body: "A gate queue or an accident adds hours to trucks already moving, and the first you hear of it is a late customer call.",
  },
  {
    tag: "Weather",
    art: Weather,
    title: "One red alert can close a whole corridor",
    body: "The warning names a region, never the orders inside it, so nobody knows which shipments to move until the road is shut.",
  },
  {
    tag: "Supplier delay",
    art: Supplier,
    title: "Suppliers slip by days, quietly",
    body: "An ETA moves in a portal or an email thread, and no one connects it to the orders waiting on that part.",
  },
  {
    tag: "Stock-out",
    art: Stock,
    title: "Shortages surface when fixes cost most",
    body: "Safety stock runs dry between reviews, so by the time it shows up the cheap transfer is already gone.",
  },
];

export function Problems() {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          el.dataset.in = "";
          io.disconnect();
        }
      },
      { threshold: 0.2 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <section ref={ref} data-nav="light" className="problems bg-paper text-black">
      <div className="mx-auto grid max-w-[1440px] gap-6 px-5 pb-14 pt-20 md:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] md:gap-16 md:px-8 md:pt-28">
        <h2 className="max-w-3xl text-[clamp(2.25rem,4.6vw,4rem)] font-medium leading-[1.02] tracking-[-0.04em] text-balance">
          Four ways your network breaks, and you hear about it late
        </h2>
        <p className="max-w-md self-start text-[1.0625rem] leading-relaxed text-black/60 md:justify-self-end md:pt-3">
          Traffic and weather hit routes. Supplier delays and shortages hit stock. Today each one lands in a different tool,
          after the damage is done.
        </p>
      </div>

      <div className="relative mx-auto max-w-[1440px] border-t border-black/20">
        <ul className="grid sm:grid-cols-2 lg:grid-cols-4">
          {COLUMNS.map(({ tag, art: Art, title, body }, i) => (
            <li
              key={tag}
              tabIndex={0}
              className="problem group relative flex flex-col border-b border-black/20 outline-none sm:[&:nth-child(2n)]:border-l lg:border-l lg:first:border-l-0 lg:[&:nth-child(2n)]:border-l"
            >
              <div className="flex items-center justify-between border-b border-dashed border-black/20 px-5 py-5 font-mono text-[0.75rem] uppercase tracking-[0.08em] md:px-8">
                <span className="flex items-center gap-2.5">
                  <span className="size-2 bg-signal-500 opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-visible:opacity-100" aria-hidden />
                  {tag}
                </span>
                <span className="text-black/40">[0{i + 1}]</span>
              </div>

              <div className="relative border-b border-dashed border-black/20">
                <div aria-hidden className="problem-grid pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100 group-focus-visible:opacity-100" />
                {["left-3 top-3", "right-3 top-3", "bottom-3 left-3", "bottom-3 right-3"].map((pos) => (
                  <span key={pos} aria-hidden className={`absolute ${pos} font-mono text-sm leading-none text-black/35 opacity-0 transition-opacity duration-500 group-hover:opacity-100`}>
                    +
                  </span>
                ))}
                <svg viewBox="-125 -125 250 250" className="relative mx-auto block aspect-square w-full max-w-[380px]" aria-hidden>
                  <Art />
                </svg>
              </div>

              <div className="flex flex-1 flex-col px-5 pb-10 pt-8 md:px-8">
                <h3 className="text-[1.5rem] font-medium leading-[1.12] tracking-[-0.025em] text-balance">{title}</h3>
                <p className="mt-6 max-w-sm text-[0.9375rem] leading-relaxed text-black/60">{body}</p>
              </div>
            </li>
          ))}
        </ul>

        {/* ruler strip, like a drafting sheet */}
        <div aria-hidden className="relative h-7 overflow-hidden">
          <div className="problem-ruler absolute inset-x-8 top-1/2 h-2 -translate-y-1/2" />
          <span className="absolute left-0 top-1/2 -translate-y-1/2 font-mono text-sm leading-none text-black/40">+</span>
          <span className="absolute right-0 top-1/2 -translate-y-1/2 font-mono text-sm leading-none text-black/40">+</span>
        </div>
      </div>
    </section>
  );
}
