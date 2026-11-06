"use client";

import { useEffect, type RefObject } from "react";
import { getLenis } from "@/lib/lenis";
import { clamp, damp, easeOutCubic } from "@/lib/math";
import { CFG, type DepthSlide } from "./config";
import type { LoadedSlide } from "./framing";
import { createMorphRenderer } from "./renderer";
import { loadSlide } from "./loader";
import { createPointer, softLimit } from "./pointer";
import { createTitleAnimator } from "./title";
import { slideAt, timelineSpan } from "./timeline";

export type MorphElements = {
  /** Tall scroll container */
  hero: RefObject<HTMLElement | null>;
  /** Sticky full-screen stage */
  stage: RefObject<HTMLDivElement | null>;
  canvasHost: RefObject<HTMLDivElement | null>;
  title: RefObject<HTMLHeadingElement | null>;
  /** Slide counter column (rolls to the current number) */
  roll: RefObject<HTMLSpanElement | null>;
  label: RefObject<HTMLSpanElement | null>;
  cue: RefObject<HTMLDivElement | null>;
};

/** Runs the WebGL morph for `slides` inside the given elements. Calls `onFail` to switch to a static image. */
export function useDepthMorph(slides: DepthSlide[], els: MorphElements, onFail: () => void) {
  useEffect(() => {
    const hero = els.hero.current, stage = els.stage.current, host = els.canvasHost.current;
    const titleEl = els.title.current, roll = els.roll.current, label = els.label.current, cue = els.cue.current;
    const N = slides.length;
    if (!hero || !stage || !host || !titleEl || !roll || !label || !cue || N < 2) return;
    const span = timelineSpan(N);

    // A fresh canvas per mount. A WebGL context is tied to its canvas element, and we lose the context
    // on unmount to free GPU memory; reusing the same element on remount (client-side navigation,
    // StrictMode, fast refresh) would hand back that dead context and drop us into the fallback.
    const canvas = document.createElement("canvas");
    canvas.className = "absolute inset-0 w-full h-full block";
    canvas.setAttribute("aria-hidden", "true");
    host.appendChild(canvas);

    const renderer = createMorphRenderer(canvas);
    if (!renderer) {
      canvas.remove();
      onFail();
      return;
    }

    let disposed = false;
    const loaded: (LoadedSlide | null)[] = slides.map(() => null);
    const anchorIdx = slides.findIndex((s) => s.anchor && s.face);
    const title = createTitleAnimator(titleEl);
    const pointer = createPointer();
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");

    const resize = () => {
      renderer.resize(stage.clientWidth, stage.clientHeight);
      title.measure();
    };
    const ro = new ResizeObserver(resize);
    ro.observe(stage);
    resize();
    document.fonts?.ready.then(() => !disposed && title.measure());

    // 0..1 through the tall hero
    const scrollTarget = () => {
      const max = hero.offsetHeight - window.innerHeight;
      return max > 0 ? clamp(-hero.getBoundingClientRect().top / max) : 0;
    };

    let smooth = scrollTarget();
    let last = performance.now();
    let startAt: number | null = null;
    let shownIdx = -1;
    let raf = 0;

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      const dt = Math.min((now - last) / 1000, 0.1);
      last = now;
      startAt ??= now;
      const time = (now - startAt) / 1000;
      const still = reduce.matches;

      smooth += (scrollTarget() - smooth) * (still || getLenis() ? 1 : damp(CFG.scrollEase, dt));
      const mouse = pointer.update(now, time, dt, still);
      const reveal = still ? 1 : easeOutCubic((time - CFG.revealDelay) / 1.1);
      const { index, progress } = slideAt(smooth, N);

      const a = loaded[index];
      const b = loaded[index + 1] ?? a;
      if (!a || !b) return;
      renderer.bindPair(a, b, anchorIdx >= 0 ? loaded[anchorIdx] : null);

      // the first transition grows the framed card into a full-bleed photo
      const startScale = stage.clientWidth < 768 ? 0.74 : 0.56;
      const V = index === 0 ? progress : 1;
      renderer.draw({
        scale: (startScale + (1 - startScale) * V) * (0.94 + 0.06 * reveal),
        offset: [mouse.x * CFG.shift.image, (1 - V) * 0.14 + mouse.y * CFG.shift.image],
        progress,
        time,
        reveal,
        parallax: still ? 0 : CFG.parallax,
        breath: still ? 0 : CFG.breath,
        mouse: [softLimit(mouse.x), softLimit(mouse.y)],
      });
      title.update(mouse, V, time, still);

      const idx = index + (progress > 0.5 ? 1 : 0);
      if (idx !== shownIdx) {
        shownIdx = idx;
        roll.style.transform = `translateY(${-idx * 1.25}em)`;
        label.textContent = slides[idx].label;
      }
      cue.style.opacity = String(1 - clamp((smooth * span) / 0.25));
    };

    // Only render while the hero is on screen and the tab is visible. Also wait for the anchor slide,
    // otherwise the first slides would visibly re-frame when it arrives.
    let visible = true;
    let running = false;
    const sync = () => {
      const ready = loaded[0] !== null && (anchorIdx < 0 || loaded[anchorIdx] !== null);
      const should = !disposed && visible && !document.hidden && ready;
      if (should === running) return;
      running = should;
      if (should) {
        last = performance.now();
        raf = requestAnimationFrame(frame);
      } else {
        cancelAnimationFrame(raf);
      }
    };
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      sync();
    });
    io.observe(hero);
    document.addEventListener("visibilitychange", sync);

    // First slide first (it's on screen right away), then the rest in parallel
    const isDisposed = () => disposed;
    loadSlide(renderer, slides[0], isDisposed)
      .then((first) => {
        loaded[0] = first;
        sync();
        return Promise.all(
          slides.slice(1).map((s, i) =>
            loadSlide(renderer, s, isDisposed).then((l) => {
              loaded[i + 1] = l;
              sync();
            }),
          ),
        );
      })
      .catch((e) => {
        if (disposed) return;
        console.warn("DepthMorph: a texture failed to load, showing static image", e);
        disposed = true; // stop drawing to a canvas that's about to be replaced
        cancelAnimationFrame(raf);
        onFail();
      });

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      io.disconnect();
      ro.disconnect();
      document.removeEventListener("visibilitychange", sync);
      pointer.dispose();
      renderer.dispose();
      canvas.remove();
    };
    // els holds stable refs; onFail only flips state
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slides]);
}
