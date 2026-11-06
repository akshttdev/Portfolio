import Lenis from "lenis";

let instance: Lenis | null = null;

/**
 * One Lenis instance for the whole site (started from <SmoothScroll /> in the root layout).
 * lerp 0.08 matches the easing of the About page's depth-morph section, so every page scrolls with the
 * same feel. Users who ask for reduced motion keep native scrolling.
 */
export function initLenis(): Lenis | null {
  if (instance) return instance;
  if (typeof window === "undefined") return null;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return null;

  instance = new Lenis({ lerp: 0.08, smoothWheel: true });

  const raf = (time: number) => {
    instance?.raf(time);
    requestAnimationFrame(raf);
  };
  requestAnimationFrame(raf);

  return instance;
}

export function getLenis(): Lenis | null {
  return instance;
}

/** Glides back to the top. Goes through Lenis when it's running, so the two never fight over the scroll. */
export function scrollToTop(duration = 1.4) {
  const lenis = getLenis();
  if (lenis) lenis.scrollTo(0, { duration });
  else window.scrollTo({ top: 0, behavior: "smooth" });
}
