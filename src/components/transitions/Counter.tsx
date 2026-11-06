"use client";

import { useEffect, useRef } from "react";

type Props = {
  to: number;
  /** seconds */
  duration: number;
  /** seconds */
  delay?: number;
  onEnd?: () => void;
};

/** Counts from 0 up to `to` with an ease-out curve. Writes straight to the DOM: no re-render per frame. */
export default function Counter({ to, duration, delay = 0, onEnd }: Props) {
  const ref = useRef<HTMLSpanElement>(null);
  const onEndRef = useRef(onEnd);

  useEffect(() => {
    onEndRef.current = onEnd;
  }, [onEnd]);

  useEffect(() => {
    const start = performance.now() + delay * 1000;
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(Math.max((now - start) / (duration * 1000), 0), 1);
      if (ref.current) ref.current.textContent = String(Math.round(to * t * (2 - t))); // easeOutQuad
      if (t < 1) raf = requestAnimationFrame(tick);
      else onEndRef.current?.();
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [to, duration, delay]);

  return <span ref={ref}>0</span>;
}
