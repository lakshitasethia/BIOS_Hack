// Scroll-scrubbed image sequence drawn to a canvas (DESIGN.md §7.4).
// Frames load coarse-to-fine — every 16th, then every 8th, … then the rest — so scrubbing
// works almost immediately and sharpens as the remaining frames arrive.

export type FrameManifest = {
  count: number;
  pad: number;
  desktop: { path: string; width: number; height: number };
  mobile: { path: string; width: number; height: number };
};

export async function loadManifest(url = "/frames/hero/manifest.json"): Promise<FrameManifest | null> {
  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return null;
    const m = (await res.json()) as FrameManifest;
    return m.count > 1 ? m : null;
  } catch {
    return null;
  }
}

function loadOrder(count: number) {
  const order: number[] = [];
  const seen = new Set<number>();
  for (let step = 16; step >= 1; step /= 2) {
    for (let i = 0; i < count; i += step) {
      if (!seen.has(i)) {
        seen.add(i);
        order.push(i);
      }
    }
  }
  if (!seen.has(count - 1)) order.push(count - 1);
  return order;
}

export class FrameSequence {
  private frames: (ImageBitmap | null)[];
  private worker: Worker;
  private ctx: CanvasRenderingContext2D;
  private drawn = -1;
  private progress = 0;
  private dpr = 1;
  onFirstFrame?: () => void;

  constructor(
    private canvas: HTMLCanvasElement,
    manifest: FrameManifest,
    variant: "desktop" | "mobile",
  ) {
    this.frames = new Array(manifest.count).fill(null);
    this.ctx = canvas.getContext("2d", { alpha: false })!;
    this.worker = new Worker(new URL("./frames.worker.ts", import.meta.url), { type: "module" });
    this.worker.addEventListener("message", (e: MessageEvent) => {
      if (e.data.type !== "frame") return;
      this.frames[e.data.index] = e.data.bitmap;
      if (e.data.index === 0) this.onFirstFrame?.();
      // A sharper frame for the current position just arrived — redraw.
      if (this.nearestIndex(this.targetIndex()) !== this.drawn) this.draw(true);
    });

    const { path } = manifest[variant];
    const url = (i: number) => path.replace("{index}", String(i + 1).padStart(manifest.pad, "0"));
    const order = loadOrder(manifest.count);
    const BATCH = 8;
    let cursor = 0;
    const pump = () => {
      if (cursor >= order.length) return;
      const batch = order.slice(cursor, cursor + BATCH).map((index) => ({ index, url: url(index) }));
      cursor += BATCH;
      this.worker.postMessage({ type: "load", frames: batch });
      setTimeout(pump, 40);
    };
    pump();
    this.resize();
  }

  resize() {
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    const { clientWidth: w, clientHeight: h } = this.canvas;
    this.canvas.width = Math.round(w * this.dpr);
    this.canvas.height = Math.round(h * this.dpr);
    this.draw(true);
  }

  setProgress(p: number) {
    this.progress = Math.min(1, Math.max(0, p));
    this.draw();
  }

  private targetIndex() {
    return Math.round(this.progress * (this.frames.length - 1));
  }

  // The closest frame that has actually loaded.
  private nearestIndex(target: number) {
    for (let d = 0; d < this.frames.length; d++) {
      if (this.frames[target - d]) return target - d;
      if (this.frames[target + d]) return target + d;
    }
    return -1;
  }

  private draw(force = false) {
    const i = this.nearestIndex(this.targetIndex());
    if (i < 0 || (i === this.drawn && !force)) return;
    const img = this.frames[i]!;
    const cw = this.canvas.width;
    const ch = this.canvas.height;
    // object-fit: cover, centred
    const scale = Math.max(cw / img.width, ch / img.height);
    const w = img.width * scale;
    const h = img.height * scale;
    this.ctx.drawImage(img, (cw - w) / 2, (ch - h) / 2, w, h);
    this.drawn = i;
  }

  destroy() {
    this.worker.terminate();
    this.frames.forEach((f) => f?.close());
  }
}
