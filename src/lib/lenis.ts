import Lenis from "lenis";

let instance: Lenis | null = null;
let holds = 0;

/**
 * Freezes Lenis until the returned function is called (the preloader holds it while it covers the page).
 * The CSS side of the lock is `html:has([data-scroll-lock])` in globals.css: that one also covers the time
 * before hydration and visitors without Lenis, but Lenis scrolls from script, which overflow doesn't stop.
 */
export function holdScroll(): () => void {
  holds++;
  instance?.stop();
  let released = false;
  return () => {
    if (released) return;
    released = true;
    if (--holds === 0) instance?.start();
  };
}

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
  if (holds > 0) instance.stop(); // something asked for a hold before Lenis existed

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
