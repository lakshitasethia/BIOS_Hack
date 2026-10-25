import type { DisruptionType, Kpis, Snapshot } from "./types";
import { MockProvider } from "./mock/provider";

// The only surface the UI talks to. Swap MockProvider for an API-backed implementation
// (NEXT_PUBLIC_DATA_SOURCE=api) without touching components — DESIGN.md §11.2.

export type ScenarioInfo = { id: string; title: string; type: DisruptionType };

export interface DataProvider {
  snapshot(): Snapshot;
  subscribe(cb: () => void): () => void;
  step(dt: number): void; // advance live positions (an API provider would apply streamed updates here)
  scenarios(): ScenarioInfo[];
  fire(id?: string): string | null; // demo: inject a disruption, returns its id
  approve(disruptionId: string, recommendationId: string): void;
  dismiss(disruptionId: string): void;
  reset(): void;
}

let instance: DataProvider | null = null;
export function getProvider(): DataProvider {
  if (!instance) instance = new MockProvider();
  return instance;
}

export function kpis(s: Snapshot): Kpis {
  const atRisk = s.shipments.filter((x) => x.risk === "high" || x.risk === "critical");
  const open = s.disruptions.filter((d) => d.status === "open");
  const delayed = s.shipments.filter((x) => x.delayMin > 0);
  return {
    active: s.shipments.length,
    atRisk: atRisk.length,
    valueAtRisk: open.reduce((a, d) => a + (d.risk === "watch" ? 0 : d.valueAtRisk), 0),
    avgDelayMin: delayed.length ? Math.round(delayed.reduce((a, b) => a + b.delayMin, 0) / delayed.length) : 0,
  };
}

export const inr = (v: number) => (v >= 1e7 ? `₹${(v / 1e7).toFixed(2)}Cr` : `₹${(v / 1e5).toFixed(1)}L`);
