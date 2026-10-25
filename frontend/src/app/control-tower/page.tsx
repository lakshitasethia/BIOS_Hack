import type { Metadata } from "next";
import { ControlTower } from "@/components/control-tower/control-tower";
import { site } from "@/lib/site";

export const metadata: Metadata = { title: `Control tower — ${site.name}` };

export default function ControlTowerPage() {
  return <ControlTower />;
}
