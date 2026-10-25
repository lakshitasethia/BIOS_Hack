import type { Hub, Lane, LngLat } from "../types";

// A small but real Indian freight network. Coordinates are [lng, lat]; lanes follow the
// national highways closely enough to read correctly on a country-scale map.

export const HUBS: Hub[] = [
  { id: "jnpt", name: "JNPT", kind: "port", at: [72.95, 18.95] },
  { id: "bhiwandi", name: "Bhiwandi WH", kind: "warehouse", at: [73.05, 19.28] },
  { id: "pune", name: "Pune", kind: "city", at: [73.86, 18.52] },
  { id: "ahmedabad", name: "Ahmedabad", kind: "city", at: [72.57, 23.02] },
  { id: "jaipur", name: "Jaipur DC", kind: "warehouse", at: [75.79, 26.91] },
  { id: "gurugram", name: "Gurugram DC", kind: "warehouse", at: [77.03, 28.46] },
  { id: "delhi", name: "Delhi", kind: "city", at: [77.1, 28.7] },
  { id: "agra", name: "Agra", kind: "city", at: [78.01, 27.18] },
  { id: "nagpur", name: "Nagpur", kind: "city", at: [79.09, 21.15] },
  { id: "hyderabad", name: "Hyderabad", kind: "city", at: [78.49, 17.39] },
  { id: "bengaluru", name: "Bengaluru", kind: "city", at: [77.59, 12.97] },
  { id: "chennai", name: "Sriperumbudur", kind: "supplier", at: [79.94, 12.97] },
  { id: "vizag", name: "Visakhapatnam", kind: "port", at: [83.22, 17.69] },
  { id: "kolkata", name: "Kolkata DC", kind: "warehouse", at: [88.36, 22.57] },
];

const P = {
  jnpt: [72.95, 18.95],
  bhiwandi: [73.05, 19.28],
  panvel: [73.12, 18.99],
  khandala: [73.38, 18.76],
  lonavala: [73.41, 18.75],
  pune: [73.86, 18.52],
  surat: [72.83, 21.17],
  vadodara: [73.18, 22.31],
  ahmedabad: [72.57, 23.02],
  udaipur: [73.71, 24.58],
  jaipur: [75.79, 26.91],
  gurugram: [77.03, 28.46],
  noida: [77.33, 28.55],
  agra: [78.01, 27.18],
  jhansi: [78.57, 25.45],
  nagpur: [79.09, 21.15],
  hyderabad: [78.49, 17.39],
  kurnool: [78.04, 15.83],
  anantapur: [77.6, 14.68],
  bengaluru: [77.59, 12.97],
  krishnagiri: [78.21, 12.52],
  vellore: [79.13, 12.92],
  chennai: [79.94, 12.97],
  chennaiCity: [80.27, 13.08],
  vijayawada: [80.65, 16.51],
  vizag: [83.22, 17.69],
  bhubaneswar: [85.82, 20.3],
  kolkata: [88.36, 22.57],
  nashik: [73.79, 20.0],
  aurangabad: [75.34, 19.88],
  raipur: [81.63, 21.25],
  satara: [74.0, 17.68],
  kolhapur: [74.24, 16.7],
  hubballi: [75.12, 15.36],
  tumakuru: [77.1, 13.34],
} satisfies Record<string, LngLat>;

export const LANES: Lane[] = [
  { id: "mum-pune", name: "Mumbai – Pune Expressway", path: [P.bhiwandi, P.panvel, P.khandala, P.lonavala, P.pune] },
  { id: "jnpt-ggn", name: "NH-48 · JNPT – Gurugram", path: [P.jnpt, P.bhiwandi, P.surat, P.vadodara, P.ahmedabad, P.udaipur, P.jaipur, P.gurugram] },
  { id: "chn-blr", name: "NH-48 · Chennai – Bengaluru", path: [P.chennai, P.vellore, P.krishnagiri, P.bengaluru] },
  { id: "blr-hyd", name: "NH-44 · Bengaluru – Hyderabad", path: [P.bengaluru, P.anantapur, P.kurnool, P.hyderabad] },
  { id: "hyd-del", name: "NH-44 · Hyderabad – Delhi", path: [P.hyderabad, P.nagpur, P.jhansi, P.agra, P.noida] },
  { id: "mum-kol", name: "Mumbai – Nagpur – Kolkata", path: [P.bhiwandi, P.nashik, P.aurangabad, P.nagpur, P.raipur, P.kolkata] },
  { id: "kol-chn", name: "NH-16 · Kolkata – Chennai", path: [P.kolkata, P.bhubaneswar, P.vizag, P.vijayawada, P.chennaiCity, P.chennai] },
  { id: "pune-blr", name: "NH-48 · Pune – Bengaluru", path: [P.pune, P.satara, P.kolhapur, P.hubballi, P.tumakuru, P.bengaluru] },
];

// Alternatives used by recommendations
export const ALT = {
  oldNh48: [P.bhiwandi, P.panvel, [73.28, 18.83], [73.345, 18.785], [73.405, 18.735], [73.675, 18.735], P.pune] as LngLat[],
  jaipurGgn: [P.jaipur, [76.2, 27.45], [76.6, 27.95], P.gurugram] as LngLat[],
  puneBlr: [P.pune, P.satara, P.kolhapur, P.hubballi, P.tumakuru, P.bengaluru] as LngLat[],
  jnptRail: [P.jnpt, P.bhiwandi, P.nashik, P.aurangabad] as LngLat[],
};

export const POINTS = P;
