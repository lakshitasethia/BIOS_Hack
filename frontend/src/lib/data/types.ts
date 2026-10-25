// The data contract between the control tower UI and whatever serves it (mock today, API later).
// Change deliberately and tell the backend team — see DESIGN.md §11.2.

export type LngLat = [number, number];

export type Risk = "clear" | "watch" | "high" | "critical";
export type DisruptionType = "weather" | "traffic" | "supplier" | "inventory";

export type Hub = {
  id: string;
  name: string;
  kind: "port" | "warehouse" | "supplier" | "city";
  at: LngLat;
};

export type Lane = {
  id: string;
  name: string; // e.g. "Mumbai – Pune Expressway"
  path: LngLat[];
};

export type Shipment = {
  id: string; // SHP-1042
  laneId: string;
  path: LngLat[]; // current path (lane, or a reroute)
  progress: number; // 0..1 along path
  speed: number; // fraction of path per second (demo time)
  from: string;
  to: string;
  cargo: string;
  value: number; // ₹
  eta: string; // "21:40"
  delayMin: number;
  risk: Risk;
};

export type Recommendation = {
  id: string;
  title: string; // "Reroute 4 trucks via old NH-48"
  rationale: string;
  deltaTime: string; // "+1h 40m"
  deltaCost: string; // "₹4,200"
  riskAfter: Risk;
  saves: string; // "saves ₹6.2L in penalties"
  recommended?: boolean;
  preview?: LngLat[]; // route drawn on the map while hovering the option
  effect:
    | { kind: "reroute"; path: LngLat[]; delayMin: number; eta: string }
    | { kind: "reschedule"; delayMin: number; eta: string }
    | { kind: "dispatch"; path: LngLat[]; count: number; cargo: string };
};

export type Disruption = {
  id: string;
  type: DisruptionType;
  title: string;
  location: string;
  at: LngLat;
  radiusKm: number;
  source: string; // "IMD red alert"
  detectedAt: number; // epoch ms
  risk: Risk;
  laneId?: string;
  affected: string[]; // shipment ids
  delay: string; // "+7h"
  valueAtRisk: number; // ₹
  evidence: { label: string; source: string; confidence: number }[];
  recommendations: Recommendation[];
  status: "open" | "resolved";
  resolution?: string;
};

export type Kpis = { active: number; atRisk: number; valueAtRisk: number; avgDelayMin: number };

export type Snapshot = {
  hubs: Hub[];
  lanes: Lane[];
  shipments: Shipment[];
  disruptions: Disruption[];
};
