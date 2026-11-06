import { CFG } from "./config";
import { clamp, damp } from "@/lib/math";

/**
 * Smoothed cursor position in -1..1 (y up). After a while without mouse movement (and on touch screens)
 * it drifts in a slow figure-eight instead, so the depth effect stays alive.
 */
export function createPointer() {
  const target = { x: 0, y: 0, lastMove: -Infinity };
  const mouse = { x: 0, y: 0 };

  const onMove = (e: PointerEvent) => {
    if (e.pointerType === "touch") return;
    target.x = (e.clientX / window.innerWidth) * 2 - 1;
    target.y = -((e.clientY / window.innerHeight) * 2 - 1);
    target.lastMove = performance.now();
  };
  const onLeave = () => {
    target.x = 0;
    target.y = 0;
  };
  window.addEventListener("pointermove", onMove, { passive: true });
  document.documentElement.addEventListener("pointerleave", onLeave);

  return {
    /** Advance one frame and return the smoothed position. */
    update(now: number, time: number, dt: number, still: boolean) {
      const I = CFG.idle;
      const idle = !still && now - target.lastMove > I.delayMs;
      const tx = idle ? I.ax * Math.sin(time * I.fx) : target.x;
      const ty = idle ? I.ay * Math.sin(time * I.fy + I.py) : target.y;
      const k = damp(idle ? CFG.mouseEase * 0.5 : CFG.mouseEase, dt);
      mouse.x += (tx - mouse.x) * k;
      mouse.y += (ty - mouse.y) * k;
      return mouse;
    },
    dispose() {
      window.removeEventListener("pointermove", onMove);
      document.documentElement.removeEventListener("pointerleave", onLeave);
    },
  };
}

/** Full response near the centre, easing off toward the edges, so parallax never looks like paper cut-outs. */
export function softLimit(v: number) {
  const c = clamp(v, -1, 1);
  return c * (1 - CFG.parallaxLimit * Math.abs(c));
}
