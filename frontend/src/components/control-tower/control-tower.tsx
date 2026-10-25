"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { getProvider, kpis } from "@/lib/data/provider";
import { FleetMap, type FleetMapHandle } from "./fleet-map";
import { AlertFeed, DecisionPanel, KpiRail, TopBar } from "./panels";

/*
 * Control tower (DESIGN.md §8): map in the middle, KPIs on the left, disruptions on the
 * right. Selecting a disruption opens its decision panel; approving an option updates the
 * network live. Demo: "Run scenario" or Shift+D fires disruptions, Reset restores calm.
 */

// Live data and clocks differ between server and browser, so the tower renders client-side only.
export function ControlTower() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    // one-time switch after hydration
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);
  if (!mounted) return <div className="h-[100svh] bg-night-950" />;
  return <Tower />;
}

function Tower() {
  const [provider] = useState(getProvider);
  const mapRef = useRef<FleetMapHandle>(null);
  const [, setVersion] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const snap = provider.snapshot();
  const disruption = snap.disruptions.find((d) => d.id === selected) ?? null;

  // re-render on discrete changes, and once a second so ETAs and "x min ago" stay fresh
  useEffect(() => {
    const bump = () => setVersion((v) => v + 1);
    const off = provider.subscribe(() => {
      bump();
      mapRef.current?.sync(provider.snapshot());
    });
    const id = setInterval(bump, 1000);
    mapRef.current?.sync(provider.snapshot());
    return () => {
      off();
      clearInterval(id);
    };
  }, [provider]);

  // live movement
  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    const loop = (t: number) => {
      provider.step(Math.min(0.1, (t - last) / 1000));
      last = t;
      mapRef.current?.frame(provider.snapshot(), t);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [provider]);

  const select = useCallback(
    (id: string | null) => {
      setSelected(id);
      mapRef.current?.preview(null);
      mapRef.current?.focus(id ? provider.snapshot().disruptions.find((d) => d.id === id) ?? null : null);
    },
    [provider],
  );

  const fire = useCallback(
    (id?: string) => {
      const newId = provider.fire(id);
      if (newId) setTimeout(() => select(newId), 350);
    },
    [provider, select],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.shiftKey && e.key.toLowerCase() === "d") fire();
      if (e.key === "Escape") select(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [fire, select]);

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 4200);
    return () => clearTimeout(id);
  }, [toast]);

  const approve = (recId: string) => {
    if (!disruption) return;
    const rec = disruption.recommendations.find((r) => r.id === recId);
    provider.approve(disruption.id, recId);
    mapRef.current?.preview(null);
    setToast(`${rec?.title} · approved`);
  };

  const preview = (recId: string | null) => {
    const rec = disruption?.recommendations.find((r) => r.id === recId);
    mapRef.current?.preview(rec?.preview ?? null);
  };

  return (
    <div className="flex h-[100svh] flex-col overflow-hidden bg-night-950 text-text">
      <TopBar scenarios={provider.scenarios()} onFire={fire} onReset={() => { provider.reset(); select(null); }} />
      <div className="flex min-h-0 flex-1">
        <KpiRail k={kpis(snap)} s={snap} />
        <main className="relative min-w-0 flex-1">
          <FleetMap ref={mapRef} />
          <div className="pointer-events-none absolute bottom-4 left-4 rounded-lg border border-border bg-night-900/80 px-3 py-2.5 backdrop-blur">
            <ul className="flex flex-wrap gap-x-4 gap-y-1.5 font-mono text-[0.6875rem] uppercase tracking-wider text-text-muted">
              {[
                ["bg-risk-clear", "Clear"],
                ["bg-risk-watch", "Watch"],
                ["bg-risk-high", "At risk"],
                ["bg-risk-critical", "Critical"],
              ].map(([c, l]) => (
                <li key={l} className="flex items-center gap-1.5">
                  <span className={`size-2 rounded-full ${c}`} /> {l}
                </li>
              ))}
              <li className="flex items-center gap-1.5">
                <span className="h-0.5 w-4 bg-tide-300" /> Approved route
              </li>
            </ul>
          </div>
          {toast && (
            <div className="absolute bottom-12 right-4 flex animate-[slidein_400ms_cubic-bezier(0.16,1,0.3,1)] items-center gap-2.5 rounded-xl border border-tide-400/40 bg-night-900/90 px-4 py-3 text-[0.9375rem] shadow-2xl backdrop-blur">
              <CheckCircle2 size={18} className="text-risk-clear" /> {toast}
            </div>
          )}
        </main>
        <aside className="w-[400px] shrink-0 border-l border-border bg-night-900">
          {disruption ? (
            <DecisionPanel
              d={disruption}
              shipments={snap.shipments}
              onBack={() => select(null)}
              onApprove={approve}
              onDismiss={() => {
                provider.dismiss(disruption.id);
                setToast("Alert dismissed");
              }}
              onPreview={preview}
            />
          ) : (
            <AlertFeed s={snap} onSelect={select} />
          )}
        </aside>
      </div>
    </div>
  );
}
