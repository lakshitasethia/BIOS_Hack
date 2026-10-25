import type { DataProvider, ScenarioInfo } from "../provider";
import type { Disruption, LngLat, Recommendation, Shipment, Snapshot } from "../types";
import { ALT, HUBS, LANES, POINTS } from "./network";

/*
 * In-memory provider for demos and offline stages. Shipments loop along their lanes;
 * scenarios inject disruptions that affect real shipments; approving a recommendation
 * changes their paths, ETAs and risk so the map visibly responds.
 */

const CARGO = ["Electronics", "FMCG", "Pharma", "Auto parts", "Apparel", "Steel coils", "Packaged food", "Home appliances"];
const PER_LANE: Record<string, number> = { "mum-pune": 6, "jnpt-ggn": 6, "chn-blr": 3, "blr-hyd": 3, "hyd-del": 3, "mum-kol": 3, "kol-chn": 3, "pune-blr": 2 };

function seeded(n: number) {
  const x = Math.sin(n * 91.73 + 12.9) * 43758.5453;
  return x - Math.floor(x);
}

const pad = (n: number) => String(n).padStart(2, "0");
const etaIn = (minutes: number) => {
  const d = new Date(Date.now() + minutes * 60_000);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

function baseShipments(): Shipment[] {
  const out: Shipment[] = [];
  let k = 0;
  for (const lane of LANES) {
    const n = PER_LANE[lane.id] ?? 2;
    for (let i = 0; i < n; i++, k++) {
      const r = seeded(k);
      out.push({
        id: `SHP-${1036 + k}`,
        laneId: lane.id,
        path: lane.path,
        progress: (i + r * 0.6) / n,
        speed: 1 / (110 + seeded(k + 50) * 90),
        from: HUBS.find((h) => h.at[0] === lane.path[0][0] && h.at[1] === lane.path[0][1])?.name ?? lane.name.split("·").pop()!.split("–")[0].trim(),
        to: lane.name.split("–").pop()!.trim(),
        cargo: CARGO[k % CARGO.length],
        value: Math.round((4 + seeded(k + 7) * 36) * 1e5),
        eta: etaIn(120 + Math.round(seeded(k + 3) * 600)),
        delayMin: 0,
        risk: "clear",
      });
    }
  }
  return out;
}

const lakh = (v: number) => (v >= 1e7 ? `₹${(v / 1e7).toFixed(1)}Cr` : `₹${(v / 1e5).toFixed(1)}L`);

type Scenario = ScenarioInfo & { build: (s: Snapshot) => Disruption };

const SCENARIOS: Scenario[] = [
  {
    id: "monsoon",
    title: "Monsoon landslide · Khandala ghat",
    type: "weather",
    build: (s) => {
      const affected = s.shipments.filter((x) => x.laneId === "mum-pune").slice(0, 4);
      const value = affected.reduce((a, b) => a + b.value, 0);
      return {
        id: "dis-monsoon",
        type: "weather",
        title: "Landslide risk on the Mumbai – Pune Expressway",
        location: "Khandala ghat, Maharashtra",
        at: POINTS.khandala,
        radiusKm: 18,
        source: "IMD red alert",
        detectedAt: Date.now(),
        risk: "high",
        laneId: "mum-pune",
        affected: affected.map((x) => x.id),
        delay: "+7h",
        valueAtRisk: value,
        evidence: [
          { label: "IMD red alert: 210 mm rain forecast over the ghats", source: "IMD", confidence: 0.92 },
          { label: "Two slips reported near Adoshi tunnel in the last 3 hours", source: "Traffic feed", confidence: 0.78 },
          { label: "Average speed on the expressway down 64%", source: "Fleet telematics", confidence: 0.86 },
        ],
        recommendations: [
          {
            id: "r1",
            title: `Reroute ${affected.length} trucks via old NH-48`,
            rationale: "The old ghat road stays open below the slip zone and keeps every delivery inside its window.",
            deltaTime: "+1h 40m",
            deltaCost: "₹4,200",
            riskAfter: "clear",
            saves: `saves ${lakh(value * 0.09)} in penalties`,
            recommended: true,
            preview: ALT.oldNh48,
            effect: { kind: "reroute", path: ALT.oldNh48, delayMin: 100, eta: etaIn(260) },
          },
          {
            id: "r2",
            title: "Hold at Bhiwandi until 18:00",
            rationale: "Wait out the heaviest rain; two deliveries would miss their slots.",
            deltaTime: "+5h",
            deltaCost: "₹0",
            riskAfter: "watch",
            saves: `saves ${lakh(value * 0.04)}`,
            effect: { kind: "reschedule", delayMin: 300, eta: etaIn(460) },
          },
        ],
        status: "open",
      };
    },
  },
  {
    id: "jnpt",
    title: "Port gate backlog · JNPT",
    type: "traffic",
    build: (s) => {
      const affected = s.shipments.filter((x) => x.laneId === "jnpt-ggn").slice(0, 3);
      const value = affected.reduce((a, b) => a + b.value, 0) + 31e5;
      return {
        id: "dis-jnpt",
        type: "traffic",
        title: "14-hour container backlog at the JNPT gate",
        location: "JNPT, Navi Mumbai",
        at: POINTS.jnpt,
        radiusKm: 14,
        source: "Port community system",
        detectedAt: Date.now(),
        risk: "critical",
        laneId: "jnpt-ggn",
        affected: affected.map((x) => x.id),
        delay: "+14h",
        valueAtRisk: value,
        evidence: [
          { label: "Gate dwell time 3× the 30-day normal", source: "Port feed", confidence: 0.95 },
          { label: "22 containers waiting for pickup slots", source: "Terminal API", confidence: 0.9 },
          { label: "Demurrage starts accruing in 6 hours", source: "Contracts", confidence: 0.99 },
        ],
        recommendations: [
          {
            id: "r1",
            title: "Rebook 8 pickups to the 02:00 slot",
            rationale: "Night slots are clear; trucks avoid the queue and demurrage never starts.",
            deltaTime: "+6h",
            deltaCost: "₹9,600",
            riskAfter: "clear",
            saves: `saves ${lakh(31e5)} demurrage`,
            recommended: true,
            effect: { kind: "reschedule", delayMin: 360, eta: etaIn(720) },
          },
          {
            id: "r2",
            title: "Move 6 containers by rail via Bhiwandi ICD",
            rationale: "Rail bypasses the gate entirely but adds a transfer at the ICD.",
            deltaTime: "+9h",
            deltaCost: "₹1.1L",
            riskAfter: "watch",
            saves: `saves ${lakh(22e5)}`,
            preview: ALT.jnptRail,
            effect: { kind: "dispatch", path: ALT.jnptRail, count: 2, cargo: "Containers (rail)" },
          },
        ],
        status: "open",
      };
    },
  },
  {
    id: "supplier",
    title: "Supplier slip · Chennai",
    type: "supplier",
    build: (s) => {
      const affected = s.shipments.filter((x) => x.laneId === "chn-blr");
      return {
        id: "dis-supplier",
        type: "supplier",
        title: "Component supplier slips four days",
        location: "Sriperumbudur, Chennai",
        at: POINTS.chennai,
        radiusKm: 12,
        source: "Supplier portal",
        detectedAt: Date.now(),
        risk: "high",
        laneId: "chn-blr",
        affected: affected.map((x) => x.id),
        delay: "+4 days",
        valueAtRisk: 42e5,
        evidence: [
          { label: "Supplier ETA moved from 12 Nov to 16 Nov", source: "Supplier portal", confidence: 0.97 },
          { label: "3 SKUs · 1,240 units feed the Bengaluru line", source: "ERP", confidence: 0.93 },
        ],
        recommendations: [
          {
            id: "r1",
            title: "Expedite 40% of volume from the Pune backup supplier",
            rationale: "Pune has stock on hand and a clear 19-hour run down NH-48 to Bengaluru.",
            deltaTime: "+19h",
            deltaCost: "₹68,000",
            riskAfter: "clear",
            saves: "protects ₹42L of orders",
            recommended: true,
            preview: ALT.puneBlr,
            effect: { kind: "dispatch", path: ALT.puneBlr, count: 2, cargo: "Components (expedited)" },
          },
        ],
        status: "open",
      };
    },
  },
  {
    id: "stock",
    title: "Stock-out risk · Gurugram DC",
    type: "inventory",
    build: () => ({
      id: "dis-stock",
      type: "inventory",
      title: "Fast-moving SKU below safety stock",
      location: "Gurugram distribution centre",
      at: POINTS.gurugram,
      radiusKm: 10,
      source: "WMS",
      detectedAt: Date.now(),
      risk: "high",
      affected: [],
      delay: "2.1 days cover",
      valueAtRisk: 18e5,
      evidence: [
        { label: "2.1 days of cover left against a 5-day target", source: "WMS", confidence: 0.98 },
        { label: "Demand up 18% week on week (festive season)", source: "Order book", confidence: 0.84 },
      ],
      recommendations: [
        {
          id: "r1",
          title: "Transfer 600 units from Jaipur DC",
          rationale: "Jaipur holds 9 days of the SKU; a direct run arrives in 9 hours.",
          deltaTime: "9h",
          deltaCost: "₹22,000",
          riskAfter: "clear",
          saves: "protects 36 store orders",
          recommended: true,
          preview: ALT.jaipurGgn,
          effect: { kind: "dispatch", path: ALT.jaipurGgn, count: 2, cargo: "Transfer · SKU 4471" },
        },
      ],
      status: "open",
    }),
  },
];

function initialDisruptions(): Disruption[] {
  return [
    {
      id: "dis-fog",
      type: "weather",
      title: "Dense fog building near Agra",
      location: "NH-44, Agra",
      at: POINTS.agra,
      radiusKm: 22,
      source: "IMD advisory",
      detectedAt: Date.now() - 26 * 60_000,
      risk: "watch",
      laneId: "hyd-del",
      affected: ["SHP-1054"],
      delay: "+45m",
      valueAtRisk: 9e5,
      evidence: [{ label: "Visibility forecast under 200 m after 22:00", source: "IMD", confidence: 0.71 }],
      recommendations: [
        {
          id: "r1",
          title: "Advance the Agra departure by 2 hours",
          rationale: "Clears the corridor before visibility drops.",
          deltaTime: "−2h",
          deltaCost: "₹0",
          riskAfter: "clear",
          saves: "avoids a 45m delay",
          recommended: true,
          effect: { kind: "reschedule", delayMin: 0, eta: etaIn(300) },
        },
      ],
      status: "open",
    },
  ];
}

export class MockProvider implements DataProvider {
  private state: Snapshot;
  private listeners = new Set<() => void>();
  private fired = 0;

  constructor() {
    this.state = this.fresh();
  }

  private fresh(): Snapshot {
    const shipments = baseShipments();
    const s: Snapshot = { hubs: HUBS, lanes: LANES, shipments, disruptions: initialDisruptions() };
    s.shipments.find((x) => x.id === "SHP-1054")!.risk = "watch";
    return s;
  }

  private emit() {
    this.listeners.forEach((l) => l());
  }

  snapshot() {
    return this.state;
  }

  subscribe(cb: () => void) {
    this.listeners.add(cb);
    return () => {
      this.listeners.delete(cb);
    };
  }

  step(dt: number) {
    for (const s of this.state.shipments) {
      // trucks caught in an open disruption crawl
      const slow = s.risk === "high" || s.risk === "critical" ? 0.15 : 1;
      s.progress += s.speed * dt * slow;
      if (s.progress >= 1) s.progress -= 1;
    }
  }

  scenarios(): ScenarioInfo[] {
    return SCENARIOS.map(({ id, title, type }) => ({ id, title, type }));
  }

  fire(id?: string) {
    const open = new Set(this.state.disruptions.map((d) => d.id));
    const scenario = id ? SCENARIOS.find((s) => s.id === id) : SCENARIOS.find((s, i) => i >= this.fired % SCENARIOS.length && !open.has(`dis-${s.id}`)) ?? SCENARIOS.find((s) => !open.has(`dis-${s.id}`));
    if (!scenario || open.has(`dis-${scenario.id}`)) return null;
    this.fired++;
    const d = scenario.build(this.state);
    for (const s of this.state.shipments) {
      if (d.affected.includes(s.id)) {
        s.risk = d.risk;
        s.delayMin = 420;
      }
    }
    this.state.disruptions = [d, ...this.state.disruptions];
    this.emit();
    return d.id;
  }

  approve(disruptionId: string, recId: string) {
    const d = this.state.disruptions.find((x) => x.id === disruptionId);
    const rec = d?.recommendations.find((r) => r.id === recId);
    if (!d || !rec) return;
    const affected = this.state.shipments.filter((s) => d.affected.includes(s.id));
    const e = rec.effect;
    if (e.kind === "reroute") {
      affected.forEach((s) => Object.assign(s, { path: e.path, risk: "clear", delayMin: e.delayMin, eta: e.eta }));
    } else if (e.kind === "reschedule") {
      affected.forEach((s) => Object.assign(s, { risk: "clear", delayMin: e.delayMin, eta: e.eta }));
    } else {
      affected.forEach((s) => Object.assign(s, { risk: "watch" }));
      for (let i = 0; i < e.count; i++) {
        const n = this.state.shipments.length;
        this.state.shipments.push({
          id: `SHP-${1036 + n}`,
          laneId: `dispatch-${d.id}`,
          path: e.path,
          progress: i * 0.18,
          speed: 1 / 140,
          from: "Dispatch",
          to: d.location.split(",")[0],
          cargo: e.cargo,
          value: 12e5,
          eta: etaIn(540),
          delayMin: 0,
          risk: "clear",
        });
      }
    }
    d.status = "resolved";
    d.resolution = rec.title;
    this.emit();
  }

  dismiss(disruptionId: string) {
    const d = this.state.disruptions.find((x) => x.id === disruptionId);
    if (!d) return;
    d.status = "resolved";
    d.resolution = "Dismissed";
    this.state.shipments.forEach((s) => {
      if (d.affected.includes(s.id)) s.risk = "clear";
    });
    this.emit();
  }

  reset() {
    this.state = this.fresh();
    this.fired = 0;
    this.emit();
  }
}

export type { Recommendation, LngLat };
