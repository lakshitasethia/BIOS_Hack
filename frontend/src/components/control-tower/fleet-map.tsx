"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import maplibregl, { type GeoJSONSource } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import type { Disruption, LngLat, Risk, Snapshot } from "@/lib/data/types";

/*
 * The live map (DESIGN.md §8.5): dark basemap, lanes tinted by health, shipments moving
 * along their paths coloured by risk, pulsing disruption zones, and a dashed preview of
 * whichever recommendation is being considered. Updated imperatively every frame.
 */

const STYLE = "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json";
const RISK_COLOR: Record<Risk, string> = { clear: "#2fb8a6", watch: "#f2b33d", high: "#ff5b04", critical: "#ff5a65" };

export type FleetMapHandle = {
  frame: (s: Snapshot, time: number) => void;
  sync: (s: Snapshot) => void;
  preview: (path: LngLat[] | null) => void;
  focus: (d: Disruption | null) => void;
};

// position along a polyline, by fraction of its length (cached per path)
const lengths = new WeakMap<LngLat[], { cum: number[]; total: number }>();
function along(path: LngLat[], t: number): LngLat {
  let m = lengths.get(path);
  if (!m) {
    const cum = [0];
    for (let i = 1; i < path.length; i++) cum.push(cum[i - 1] + Math.hypot(path[i][0] - path[i - 1][0], path[i][1] - path[i - 1][1]));
    m = { cum, total: cum[cum.length - 1] };
    lengths.set(path, m);
  }
  const d = t * m.total;
  let i = 1;
  while (i < m.cum.length - 1 && m.cum[i] < d) i++;
  const seg = m.cum[i] - m.cum[i - 1] || 1;
  const f = (d - m.cum[i - 1]) / seg;
  return [path[i - 1][0] + (path[i][0] - path[i - 1][0]) * f, path[i - 1][1] + (path[i][1] - path[i - 1][1]) * f];
}

function circle(center: LngLat, km: number): LngLat[] {
  const pts: LngLat[] = [];
  const dLat = km / 111;
  const dLng = km / (111 * Math.cos((center[1] * Math.PI) / 180));
  for (let i = 0; i <= 48; i++) {
    const a = (i / 48) * Math.PI * 2;
    pts.push([center[0] + Math.cos(a) * dLng, center[1] + Math.sin(a) * dLat]);
  }
  return pts;
}

const fc = (features: GeoJSON.Feature[]): GeoJSON.FeatureCollection => ({ type: "FeatureCollection", features });

export const FleetMap = forwardRef<FleetMapHandle>(function FleetMap(_, ref) {
  const el = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const ready = useRef(false);
  const pending = useRef<Snapshot | null>(null);

  const source = (id: string) => map.current?.getSource(id) as GeoJSONSource | undefined;

  const sync = (s: Snapshot) => {
    if (!ready.current) {
      pending.current = s;
      return;
    }
    const open = s.disruptions.filter((d) => d.status === "open");
    const riskLanes = new Map(open.filter((d) => d.laneId && d.risk !== "watch").map((d) => [d.laneId!, d.risk]));
    source("lanes")?.setData(
      fc(s.lanes.map((l) => ({ type: "Feature", properties: { id: l.id, risk: riskLanes.get(l.id) ?? "clear" }, geometry: { type: "LineString", coordinates: l.path } }))),
    );
    // paths that differ from their lane: approved reroutes and dispatches
    const custom = new Map<LngLat[], Risk>();
    s.shipments.forEach((x) => {
      const lane = s.lanes.find((l) => l.id === x.laneId);
      if (!lane || lane.path !== x.path) custom.set(x.path, "clear");
    });
    source("routes")?.setData(fc([...custom.keys()].map((p) => ({ type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: p } }))));
    source("zones")?.setData(
      fc(open.map((d) => ({ type: "Feature", properties: { risk: d.risk }, geometry: { type: "Polygon", coordinates: [circle(d.at, d.radiusKm * 3)] } }))),
    );
    source("incidents")?.setData(fc(open.map((d) => ({ type: "Feature", properties: { risk: d.risk }, geometry: { type: "Point", coordinates: d.at } }))));
    source("hubs")?.setData(fc(s.hubs.map((h) => ({ type: "Feature", properties: { name: h.name, kind: h.kind }, geometry: { type: "Point", coordinates: h.at } }))));
  };

  useImperativeHandle(ref, () => ({
    sync,
    frame(s, time) {
      if (!ready.current) return;
      source("shipments")?.setData(
        fc(s.shipments.map((x) => ({ type: "Feature", properties: { risk: x.risk, id: x.id }, geometry: { type: "Point", coordinates: along(x.path, x.progress) } }))),
      );
      // pulse rings on open incidents
      const p = (time / 1600) % 1;
      map.current?.setPaintProperty("incident-pulse", "circle-radius", 8 + p * 34);
      map.current?.setPaintProperty("incident-pulse", "circle-stroke-opacity", 0.9 * (1 - p));
    },
    preview(path) {
      source("preview")?.setData(fc(path ? [{ type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: path } }] : []));
    },
    focus(d) {
      if (!map.current) return;
      if (!d) map.current.flyTo({ center: [79.5, 21.5], zoom: 4.3, duration: 1400, essential: true });
      else map.current.flyTo({ center: d.at, zoom: d.radiusKm > 15 ? 7.2 : 8, duration: 1600, essential: true });
    },
  }));

  useEffect(() => {
    if (!el.current) return;
    const m = new maplibregl.Map({
      container: el.current,
      style: STYLE,
      center: [79.5, 21.5],
      zoom: 4.3,
      minZoom: 3.5,
      maxZoom: 11,
      attributionControl: { compact: true },
      dragRotate: false,
    });
    map.current = m;
    m.on("load", () => {
      const empty = fc([]);
      ["lanes", "routes", "preview", "zones", "incidents", "hubs", "shipments"].forEach((id) => m.addSource(id, { type: "geojson", data: empty }));
      m.addLayer({ id: "zones", type: "fill", source: "zones", paint: { "fill-color": ["match", ["get", "risk"], "critical", RISK_COLOR.critical, "high", RISK_COLOR.high, "watch", RISK_COLOR.watch, RISK_COLOR.clear], "fill-opacity": 0.12 } });
      m.addLayer({ id: "lanes-glow", type: "line", source: "lanes", layout: { "line-cap": "round", "line-join": "round" }, paint: { "line-color": ["match", ["get", "risk"], "clear", RISK_COLOR.clear, RISK_COLOR.high], "line-width": ["match", ["get", "risk"], "clear", 2, 7], "line-opacity": ["match", ["get", "risk"], "clear", 0, 0.35], "line-blur": 4 } });
      m.addLayer({ id: "lanes", type: "line", source: "lanes", layout: { "line-cap": "round", "line-join": "round" }, paint: { "line-color": ["match", ["get", "risk"], "clear", RISK_COLOR.clear, "critical", RISK_COLOR.critical, RISK_COLOR.high], "line-width": ["match", ["get", "risk"], "clear", 1.6, 3], "line-opacity": ["match", ["get", "risk"], "clear", 0.55, 1] } });
      m.addLayer({ id: "routes", type: "line", source: "routes", layout: { "line-cap": "round", "line-join": "round" }, paint: { "line-color": "#3fd0bc", "line-width": 3, "line-opacity": 0.95 } });
      m.addLayer({ id: "preview", type: "line", source: "preview", layout: { "line-cap": "round", "line-join": "round" }, paint: { "line-color": "#3fd0bc", "line-width": 3, "line-dasharray": [1.5, 1.5] } });
      m.addLayer({ id: "hubs", type: "circle", source: "hubs", paint: { "circle-radius": 4, "circle-color": "#0f1a1f", "circle-stroke-color": "#e4eef0", "circle-stroke-width": 1.5 } });
      m.addLayer({ id: "shipments", type: "circle", source: "shipments", paint: { "circle-radius": ["interpolate", ["linear"], ["zoom"], 4, 3.5, 8, 6], "circle-color": ["match", ["get", "risk"], "critical", RISK_COLOR.critical, "high", RISK_COLOR.high, "watch", RISK_COLOR.watch, RISK_COLOR.clear], "circle-stroke-color": "#0f1a1f", "circle-stroke-width": 1.2 } });
      m.addLayer({ id: "incident-pulse", type: "circle", source: "incidents", paint: { "circle-radius": 10, "circle-color": "rgba(0,0,0,0)", "circle-stroke-width": 2, "circle-stroke-color": ["match", ["get", "risk"], "critical", RISK_COLOR.critical, "high", RISK_COLOR.high, RISK_COLOR.watch] } });
      m.addLayer({ id: "incidents", type: "circle", source: "incidents", paint: { "circle-radius": 6, "circle-color": ["match", ["get", "risk"], "critical", RISK_COLOR.critical, "high", RISK_COLOR.high, RISK_COLOR.watch], "circle-stroke-color": "#fff", "circle-stroke-width": 1.5 } });
      ready.current = true;
      if (pending.current) sync(pending.current);
    });
    return () => {
      m.remove();
      map.current = null;
      ready.current = false;
    };
    // sync is stable for the component's lifetime
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // maplibre makes its container position:relative, so size it from a wrapper
  return (
    <div className="absolute inset-0">
      <div ref={el} className="size-full" />
    </div>
  );
});
