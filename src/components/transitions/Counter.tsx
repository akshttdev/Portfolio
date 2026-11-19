"use client";

import { useEffect, useRef } from "react";

type Props = {
  /** Number to count up to. May rise while counting: it carries on from wherever it is. */
  to: number;
  /** Seconds a full 0 -> 100 count takes; shorter stretches take proportionally less */
  duration: number;
  /** Seconds to wait before the very first count */
  delay?: number;
  /** Called each time the count arrives at `to` */
  onReach?: (value: number) => void;
};

/**
 * Counts up with an ease-out curve, in stretches: each new `to` starts a stretch from the current number.
 * Writes straight to the DOM: no re-render per frame.
 */
export default function Counter({ to, duration, delay = 0, onReach }: Props) {
  const ref = useRef<HTMLSpanElement>(null);
  const value = useRef(0);
  const onReachRef = useRef(onReach);

  useEffect(() => {
    onReachRef.current = onReach;
  }, [onReach]);

  useEffect(() => {
    const from = value.current;
    if (to <= from) return;
    const ms = (duration * 1000 * (to - from)) / 100;
    const start = performance.now() + (from === 0 ? delay * 1000 : 0);
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(Math.max((now - start) / ms, 0), 1);
      value.current = from + (to - from) * t * (2 - t); // easeOutQuad
      if (ref.current) ref.current.textContent = String(Math.round(value.current));
      if (t < 1) raf = requestAnimationFrame(tick);
      else onReachRef.current?.(to);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [to, duration, delay]);

  return <span ref={ref}>0</span>;
}
