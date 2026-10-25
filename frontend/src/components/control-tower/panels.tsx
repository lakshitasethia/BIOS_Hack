"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Check, ChevronDown, CloudLightning, Factory, PackageX, Play, RotateCcw, Route, Sparkles, TrafficCone, X, type LucideIcon } from "lucide-react";
import type { Disruption, DisruptionType, Kpis, Risk, Shipment, Snapshot } from "@/lib/data/types";
import type { ScenarioInfo } from "@/lib/data/provider";
import { inr } from "@/lib/data/provider";
import { TransitionLink } from "@/components/transition/route-transition";
import { site } from "@/lib/site";

export const TYPE_ICON: Record<DisruptionType, LucideIcon> = { weather: CloudLightning, traffic: TrafficCone, supplier: Factory, inventory: PackageX };
const RISK_LABEL: Record<Risk, string> = { clear: "Clear", watch: "Watch", high: "At risk", critical: "Critical" };
const RISK_TEXT: Record<Risk, string> = { clear: "text-risk-clear", watch: "text-risk-watch", high: "text-risk-high", critical: "text-risk-critical" };
const RISK_BG: Record<Risk, string> = { clear: "bg-risk-clear", watch: "bg-risk-watch", high: "bg-risk-high", critical: "bg-risk-critical" };

export function RiskBadge({ risk }: { risk: Risk }) {
  return (
    <span className={`label inline-flex items-center gap-1.5 rounded px-2 py-1 ${RISK_TEXT[risk]}`} style={{ background: "color-mix(in srgb, currentColor 14%, transparent)" }}>
      <span className={`size-1.5 rounded-full ${RISK_BG[risk]} ${risk === "critical" ? "animate-pulse" : ""}`} />
      {RISK_LABEL[risk]}
    </span>
  );
}

const ago = (t: number) => {
  const m = Math.max(0, Math.round((Date.now() - t) / 60000));
  return m < 1 ? "just now" : m < 60 ? `${m}m ago` : `${Math.floor(m / 60)}h ago`;
};

/* ---------------- top bar ---------------- */

export function TopBar({ scenarios, onFire, onReset }: { scenarios: ScenarioInfo[]; onFire: (id: string) => void; onReset: () => void }) {
  const [open, setOpen] = useState(false);
  const [clock, setClock] = useState("");
  const menu = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const t = () => setClock(new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Asia/Kolkata" }));
    t();
    const id = setInterval(t, 15000);
    const close = (e: MouseEvent) => menu.current && !menu.current.contains(e.target as Node) && setOpen(false);
    document.addEventListener("mousedown", close);
    return () => {
      clearInterval(id);
      document.removeEventListener("mousedown", close);
    };
  }, []);

  return (
    <header className="relative z-20 flex h-14 shrink-0 items-center justify-between border-b border-border bg-night-900 px-4">
      <div className="flex items-center gap-6">
        <TransitionLink href="/" className="focus-ring flex items-center gap-2.5 rounded-md">
          <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden>
            <path d="M12 2 L21.5 7.5 V16.5 L12 22 L2.5 16.5 V7.5 Z" fill="var(--accent)" rx="3" />
            <path d="M7 9 L12 17 L17 9" stroke="var(--on-accent)" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="7" cy="9" r="1.3" fill="var(--on-accent)" />
            <circle cx="17" cy="9" r="1.3" fill="var(--on-accent)" />
          </svg>
          <span className="text-[1.0625rem] font-medium tracking-tight">{site.name}</span>
        </TransitionLink>
        <nav className="hidden items-center gap-1 md:flex" aria-label="Sections">
          {["Control tower", "Shipments", "Network"].map((t, i) => (
            <span key={t} className={`label rounded-md px-3 py-2 ${i === 0 ? "bg-night-800 text-text" : "text-text-subtle"}`} aria-current={i === 0 ? "page" : undefined}>
              {t}
            </span>
          ))}
        </nav>
      </div>

      <div className="flex items-center gap-2">
        <div ref={menu} className="relative">
          <button onClick={() => setOpen((v) => !v)} className="label focus-ring flex h-9 items-center gap-2 rounded-lg bg-accent px-3 text-on-accent hover:bg-signal-400" aria-expanded={open}>
            <Play size={13} /> Run scenario <ChevronDown size={13} />
          </button>
          {open && (
            <div className="absolute right-0 mt-2 w-80 overflow-hidden rounded-xl border border-border-strong bg-night-850 p-1.5 shadow-2xl">
              {scenarios.map((s) => {
                const Icon = TYPE_ICON[s.type];
                return (
                  <button
                    key={s.id}
                    onClick={() => {
                      setOpen(false);
                      onFire(s.id);
                    }}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-[0.9375rem] hover:bg-night-800"
                  >
                    <Icon size={16} className="text-text-muted" /> {s.title}
                  </button>
                );
              })}
              <p className="border-t border-border px-3 pb-1.5 pt-2.5 font-mono text-[0.75rem] text-text-subtle">Shift + D fires the next one</p>
            </div>
          )}
        </div>
        <button onClick={onReset} className="label focus-ring flex h-9 items-center gap-2 rounded-lg border border-border-strong px-3 text-text-muted hover:text-text" title="Reset the demo">
          <RotateCcw size={13} /> Reset
        </button>
        <span className="label ml-2 hidden items-center gap-2 text-text-muted sm:flex">
          <span className="size-2 animate-pulse rounded-full bg-risk-clear" /> Live · {clock} IST
        </span>
        <span className="ml-2 grid size-8 place-items-center rounded-full bg-tide-700 font-mono text-xs">OP</span>
      </div>
    </header>
  );
}

/* ---------------- KPI rail ---------------- */

export function KpiRail({ k, s }: { k: Kpis; s: Snapshot }) {
  const tiles = [
    { label: "Active shipments", value: String(k.active), note: `${s.lanes.length} lanes watched` },
    { label: "At risk", value: String(k.atRisk), note: k.atRisk ? "need a decision" : "all clear", hot: k.atRisk > 0 },
    { label: "Value at risk", value: inr(k.valueAtRisk), note: "open disruptions", hot: k.valueAtRisk > 0 },
    { label: "Avg delay", value: k.avgDelayMin ? `${Math.floor(k.avgDelayMin / 60)}h ${k.avgDelayMin % 60}m` : "0m", note: "delayed shipments" },
  ];
  const open = s.disruptions.filter((d) => d.status === "open");
  return (
    <aside className="hidden w-64 shrink-0 flex-col gap-3 overflow-y-auto border-r border-border bg-night-900 p-3 lg:flex">
      {tiles.map((t) => (
        <div key={t.label} className={`rounded-xl border p-4 transition-colors duration-500 ${t.hot ? "border-accent/40 bg-accent/[0.06]" : "border-border bg-night-850"}`}>
          <p className="label text-text-subtle">{t.label}</p>
          <p className={`mt-2 text-[2rem] font-medium leading-none tracking-[-0.03em] tabular-nums ${t.hot ? "text-signal-400" : ""}`}>{t.value}</p>
          <p className="mt-2 text-[0.8125rem] text-text-subtle">{t.note}</p>
        </div>
      ))}
      <div className="mt-1 rounded-xl border border-border bg-night-850 p-4">
        <p className="label text-text-subtle">Lane health</p>
        <ul className="mt-3 flex flex-col gap-2.5">
          {s.lanes.map((l) => {
            const d = open.find((x) => x.laneId === l.id);
            const risk: Risk = d ? d.risk : "clear";
            return (
              <li key={l.id} className="flex items-center gap-2.5 text-[0.8125rem]">
                <span className={`size-2 shrink-0 rounded-full ${RISK_BG[risk]}`} />
                <span className="truncate text-text-muted">{l.name}</span>
              </li>
            );
          })}
        </ul>
      </div>
    </aside>
  );
}

/* ---------------- alert feed ---------------- */

export function AlertFeed({ s, onSelect }: { s: Snapshot; onSelect: (id: string) => void }) {
  const items = [...s.disruptions].sort((a, b) => (a.status === b.status ? b.detectedAt - a.detectedAt : a.status === "open" ? -1 : 1));
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <p className="label text-text-muted">Disruptions</p>
        <span className="font-mono text-[0.75rem] text-text-subtle">{items.filter((d) => d.status === "open").length} open</span>
      </div>
      <ul className="flex-1 overflow-y-auto p-3">
        {items.map((d) => {
          const Icon = TYPE_ICON[d.type];
          const bar = d.status === "resolved" ? "bg-night-600" : RISK_BG[d.risk];
          return (
            <li key={d.id} className="mb-2.5 animate-[slidein_400ms_cubic-bezier(0.16,1,0.3,1)]">
              <button
                onClick={() => onSelect(d.id)}
                className={`focus-ring relative w-full overflow-hidden rounded-xl border p-4 pl-5 text-left transition-colors hover:border-border-strong ${
                  d.status === "open" && d.risk !== "watch" ? "border-accent/35 bg-night-850 shadow-[0_0_24px_-10px_rgba(255,91,4,0.5)]" : "border-border bg-night-850/70"
                }`}
              >
                <span className={`absolute inset-y-0 left-0 w-[3px] ${bar}`} />
                <div className="flex items-center justify-between gap-3">
                  <span className="label flex items-center gap-2 text-text-muted">
                    <Icon size={14} /> {d.type}
                  </span>
                  {d.status === "open" ? <RiskBadge risk={d.risk} /> : <span className="label flex items-center gap-1 text-risk-clear"><Check size={12} /> Resolved</span>}
                </div>
                <p className={`mt-2.5 text-[0.9375rem] font-medium leading-snug ${d.status === "resolved" ? "text-text-muted" : ""}`}>{d.title}</p>
                <p className="mt-1 font-mono text-[0.75rem] text-text-subtle">
                  {d.location} · {ago(d.detectedAt)}
                </p>
                {d.status === "resolved" ? (
                  <p className="mt-2 text-[0.8125rem] text-risk-clear">→ {d.resolution}</p>
                ) : (
                  <p className="mt-2 text-[0.8125rem] text-text-muted">
                    {d.affected.length ? `${d.affected.length} shipments · ` : ""}
                    {d.delay} · {inr(d.valueAtRisk)} at stake
                  </p>
                )}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/* ---------------- decision panel ---------------- */

export function DecisionPanel({
  d,
  shipments,
  onBack,
  onApprove,
  onDismiss,
  onPreview,
}: {
  d: Disruption;
  shipments: Shipment[];
  onBack: () => void;
  onApprove: (recId: string) => void;
  onDismiss: () => void;
  onPreview: (recId: string | null) => void;
}) {
  const Icon = TYPE_ICON[d.type];
  const affected = shipments.filter((s) => d.affected.includes(s.id));
  const resolved = d.status === "resolved";
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 border-b border-border px-4 py-3">
        <button onClick={onBack} className="focus-ring grid size-8 place-items-center rounded-lg hover:bg-night-800" aria-label="Back to disruptions">
          <ArrowLeft size={16} />
        </button>
        <span className="label flex items-center gap-2 text-text-muted">
          <Icon size={14} /> {d.type} · {d.source}
        </span>
        <span className="ml-auto">{resolved ? <span className="label text-risk-clear">Resolved</span> : <RiskBadge risk={d.risk} />}</span>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-6">
        <h2 className="mt-5 text-[1.375rem] font-medium leading-snug tracking-[-0.015em]">{d.title}</h2>
        <p className="mt-1.5 font-mono text-[0.8125rem] text-text-subtle">
          {d.location} · detected {ago(d.detectedAt)}
        </p>

        <dl className="mt-5 grid grid-cols-3 gap-px overflow-hidden rounded-xl border border-border bg-border">
          {[
            ["Shipments", String(d.affected.length || "—")],
            ["Delay", d.delay],
            ["At stake", inr(d.valueAtRisk)],
          ].map(([k, v]) => (
            <div key={k} className="bg-night-850 px-3.5 py-3">
              <dt className="text-xs text-text-subtle">{k}</dt>
              <dd className="mt-1 font-mono text-[1.0625rem] tabular-nums">{v}</dd>
            </div>
          ))}
        </dl>

        <p className="label mt-7 text-text-subtle">Why we flagged this</p>
        <ul className="mt-3 flex flex-col gap-3">
          {d.evidence.map((e) => (
            <li key={e.label} className="text-[0.875rem]">
              <p className="text-text">{e.label}</p>
              <div className="mt-1.5 flex items-center gap-3">
                <span className="h-1 flex-1 overflow-hidden rounded-full bg-night-700">
                  <span className="block h-full rounded-full bg-tide-400" style={{ width: `${e.confidence * 100}%` }} />
                </span>
                <span className="font-mono text-[0.6875rem] uppercase tracking-wider text-text-subtle">{e.source}</span>
              </div>
            </li>
          ))}
        </ul>

        {affected.length > 0 && (
          <>
            <p className="label mt-7 text-text-subtle">Affected shipments</p>
            <ul className="mt-3 divide-y divide-border rounded-xl border border-border">
              {affected.map((s) => (
                <li key={s.id} className="flex items-center justify-between gap-3 px-3.5 py-2.5 text-[0.8125rem]">
                  <span className="font-mono">{s.id}</span>
                  <span className="truncate text-text-muted">{s.cargo}</span>
                  <span className={`font-mono tabular-nums ${s.delayMin > 0 && s.risk !== "clear" ? "text-signal-400" : "text-text-muted"}`}>
                    {s.risk === "clear" ? `ETA ${s.eta}` : `+${Math.round(s.delayMin / 60)}h`}
                  </span>
                </li>
              ))}
            </ul>
          </>
        )}

        <p className="label mt-7 text-text-subtle">{resolved ? "Decision" : "Recommended responses"}</p>
        <div className="mt-3 flex flex-col gap-3">
          {d.recommendations.map((r) => {
            const chosen = resolved && d.resolution === r.title;
            if (resolved && !chosen) return null;
            return (
              <div
                key={r.id}
                onMouseEnter={() => onPreview(r.id)}
                onMouseLeave={() => onPreview(null)}
                className={`rounded-xl border p-4 transition-colors ${r.recommended || chosen ? "border-accent/45 bg-accent/[0.06]" : "border-border bg-night-850 hover:border-border-strong"}`}
              >
                {(r.recommended || chosen) && (
                  <p className="label mb-2 flex items-center gap-1.5 text-accent">
                    <Sparkles size={12} /> {chosen ? "Approved" : "Recommended"}
                  </p>
                )}
                <p className="flex items-center gap-2 text-[0.9375rem] font-medium">
                  <Route size={15} className="shrink-0 text-tide-300" /> {r.title}
                </p>
                <p className="mt-1.5 text-[0.8125rem] leading-relaxed text-text-muted">{r.rationale}</p>
                <dl className="mt-3 grid grid-cols-3 gap-2 font-mono text-[0.75rem]">
                  <div>
                    <dt className="text-text-subtle">Time</dt>
                    <dd className="mt-0.5">{r.deltaTime}</dd>
                  </div>
                  <div>
                    <dt className="text-text-subtle">Cost</dt>
                    <dd className="mt-0.5">{r.deltaCost}</dd>
                  </div>
                  <div>
                    <dt className="text-text-subtle">Risk after</dt>
                    <dd className={`mt-0.5 ${RISK_TEXT[r.riskAfter]}`}>{RISK_LABEL[r.riskAfter]}</dd>
                  </div>
                </dl>
                <p className="mt-2 text-[0.8125rem] text-risk-clear">{r.saves}</p>
                {!resolved && (
                  <button
                    onClick={() => onApprove(r.id)}
                    className={`label focus-ring mt-4 flex h-10 w-full items-center justify-center gap-2 rounded-lg ${r.recommended ? "bg-accent text-on-accent hover:bg-signal-400" : "border border-border-strong text-text hover:bg-white/5"}`}
                  >
                    <Check size={14} /> Approve
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {!resolved && (
          <button onClick={onDismiss} className="label focus-ring mt-4 flex w-full items-center justify-center gap-2 rounded-lg py-2.5 text-text-subtle hover:text-text">
            <X size={13} /> Dismiss alert
          </button>
        )}
      </div>
    </div>
  );
}
