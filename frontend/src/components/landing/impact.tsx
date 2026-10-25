"use client";

import { useEffect, useRef, useState } from "react";

// What the platform is built to deliver — product capabilities, not customer claims.
const STATS = [
  { value: 60, prefix: "<", suffix: "s", label: "From signal to alert" },
  { value: 4, suffix: "", label: "Disruption types watched" },
  { value: 3, suffix: "", label: "Ranked options per alert" },
  { value: 1, suffix: "-click", label: "Approve and reroute" },
  { value: 24, suffix: "/7", label: "Network monitoring" },
];

function useInView<T extends Element>() {
  const ref = useRef<T>(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => e.isIntersecting && setSeen(true), { threshold: 0.4 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return [ref, seen] as const;
}

function CountUp({ to, run }: { to: number; run: boolean }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!run) return;
    const duration = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 1 : 1100;
    const start = performance.now();
    let raf = 0;
    const step = (t: number) => {
      const p = Math.min(1, (t - start) / duration);
      setN(Math.round(to * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [run, to]);
  return <>{n}</>;
}

export function Impact() {
  const [ref, seen] = useInView<HTMLDivElement>();
  return (
    <section id="impact" aria-label="Impact" className="bg-deep text-white">
      <div ref={ref} className="grid grid-cols-2 md:grid-cols-5">
        {STATS.map((s, i) => (
          <div
            key={s.label}
            className={`flex min-h-48 flex-col justify-between border-white/15 p-6 md:min-h-56 ${i > 0 ? "md:border-l" : ""} ${
              i % 2 ? "border-l md:border-l" : ""
            } ${i >= 2 ? "border-t md:border-t-0" : ""}`}
          >
            <p className="text-[clamp(2.25rem,3.6vw,3rem)] font-medium leading-none tracking-[-0.03em] tabular-nums">
              {s.prefix}
              <CountUp to={s.value} run={seen} />
              {s.suffix}
            </p>
            <p className="mt-10 text-[0.9375rem] text-white/75">{s.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
