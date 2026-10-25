"use client";

import { YardStill } from "@/components/landing/yard-still";
import type { Shot } from "@/components/landing/yard-scene";

// A single aerial of the yard with the truck half-digitised — the product's point of view.
const SHOT: Shot[] = [{ dist: 8, cam: [18, 26, 22], look: [4, 0, -2], fov: 40, convert: 0.45, radius: 14, night: 0.25, routes: 1, dissolve: 0 }];

export function LoginVisual() {
  return <YardStill shots={SHOT} index={0} />;
}
