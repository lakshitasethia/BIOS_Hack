"use client";

import { useEffect, useRef } from "react";
import type { Shot, YardScene } from "./yard-scene";

/*
 * A live render of the 3D yard from a fixed shot. When `index` changes, the camera and
 * scene settings glide to the next shot instead of cutting. Renders only while on screen.
 */

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const lerp3 = (a: [number, number, number], b: [number, number, number], t: number): [number, number, number] => [
  lerp(a[0], b[0], t),
  lerp(a[1], b[1], t),
  lerp(a[2], b[2], t),
];
function mix(a: Shot, b: Shot, t: number): Shot {
  return {
    dist: lerp(a.dist, b.dist, t),
    cam: lerp3(a.cam, b.cam, t),
    look: lerp3(a.look, b.look, t),
    fov: lerp(a.fov, b.fov, t),
    convert: lerp(a.convert, b.convert, t),
    radius: lerp(a.radius, b.radius, t),
    night: lerp(a.night, b.night, t),
    routes: lerp(a.routes, b.routes, t),
    dissolve: lerp(a.dissolve ?? 1, b.dissolve ?? 1, t),
  };
}

// Blend a list of shots at a fractional position t (0 … shots.length - 1), eased per segment.
export function sampleShots(shots: Shot[], t: number): Shot {
  const max = shots.length - 1;
  const c = Math.min(max, Math.max(0, t));
  const i = Math.min(max - 1, Math.floor(c));
  const f = c - i;
  return mix(shots[i], shots[i + 1] ?? shots[i], f * f * (3 - 2 * f));
}

type Props = {
  shots: Shot[];
  index: number;
  className?: string;
  // When given, the shot is read from this every frame (e.g. driven by scroll) instead of `index`.
  getShot?: () => Shot;
};

export function YardStill({ shots, index, className = "", getShot }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const targetRef = useRef(shots[index]);
  const getShotRef = useRef(getShot);

  useEffect(() => {
    targetRef.current = shots[index];
    getShotRef.current = getShot;
  }, [shots, index, getShot]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let scene: YardScene | null = null;
    let raf = 0;
    let visible = false;
    let disposed = false;
    let current = targetRef.current;
    let last = performance.now();

    const loop = (time: number) => {
      if (!scene || disposed) return;
      const dt = Math.min(0.05, (time - last) / 1000);
      last = time;
      const target = getShotRef.current ? getShotRef.current() : targetRef.current;
      current = mix(current, target, 1 - Math.exp(-dt * (getShotRef.current ? 7 : 3.2)));
      scene.setShot(current);
      scene.render(time);
      raf = visible ? requestAnimationFrame(loop) : 0;
    };
    const size = () => scene?.resize(canvas.clientWidth, canvas.clientHeight);
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (visible && !raf && scene) {
        last = performance.now();
        raf = requestAnimationFrame(loop);
      }
    });
    const ro = new ResizeObserver(size);

    import("./yard-scene").then(({ YardScene }) => {
      if (disposed) return;
      try {
        scene = new YardScene(canvas);
      } catch {
        return;
      }
      size();
      ro.observe(canvas);
      io.observe(canvas);
    });

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      io.disconnect();
      ro.disconnect();
      scene?.dispose();
    };
  }, []);

  return <canvas ref={canvasRef} aria-hidden className={`block size-full bg-[#2a1d16] ${className}`} />;
}
