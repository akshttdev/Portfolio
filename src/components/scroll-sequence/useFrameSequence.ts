"use client";

import { useEffect, type RefObject } from "react";
import { clamp } from "@/lib/math";
import { SMALL_SCREEN, drawCover, frameUrl, loadFrames, nearestLoaded, timecode, type FrameSequence } from "./frames";

export type SequenceEls = {
  section: RefObject<HTMLElement | null>;
  stage: RefObject<HTMLDivElement | null>;
  canvas: RefObject<HTMLCanvasElement | null>;
  text: RefObject<HTMLHeadingElement | null>;
  time: RefObject<HTMLSpanElement | null>;
};

const PLAY_END = 0.85; // the clip ends at 85% of the scroll, so its last frame holds before the section leaves
const PRELOAD = "150% 0px"; // start loading 1.5 screens before the section scrolls in
const INSET = { y: 12, x: 8, radius: 28 }; // the card the frame grows out of on the way in (%, %, px)

/**
 * Scrubs a frame sequence with the scroll position (like a scroll-driven video, but every frame is a still
 * image, so it can't stutter on seeks the way a <video> does). Kept cheap on purpose:
 * - the canvas only repaints when the frame actually changes (most scroll ticks don't change it)
 * - the canvas never has more pixels than the frames themselves
 * - the loop only runs while the section is on screen, and styles are only written when they change
 * Everything writes straight to the DOM: no React state, so scrolling never re-renders.
 */
export function useFrameSequence(seq: FrameSequence, els: SequenceEls) {
  useEffect(() => {
    const section = els.section.current;
    const stage = els.stage.current;
    const canvas = els.canvas.current;
    const ctx = canvas?.getContext("2d");
    if (!section || !stage || !canvas || !ctx) return;

    const frames: (HTMLImageElement | undefined)[] = new Array(seq.count);
    let drawn = -1; // frame index on the canvas; -1 forces a repaint
    let sized = false; // canvas sized against a real frame yet
    let clip = "";
    let shift = NaN;
    let textWidth = 0;
    let raf = 0;
    let disposed = false;
    let stopLoading: (() => void) | null = null;

    const resize = () => {
      if (disposed) return;
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      const sample = frames.find(Boolean);
      // Never more canvas pixels than the frame has where it's drawn: extra resolution only costs fill rate
      const native = sample ? 1 / Math.max(w / sample.naturalWidth, h / sample.naturalHeight) : 1;
      const dpr = clamp(Math.min(window.devicePixelRatio || 1, native), 0.5, 2);
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.imageSmoothingQuality = "high";
      textWidth = els.text.current?.scrollWidth ?? 0;
      sized = Boolean(sample);
      drawn = -1;
    };

    const tick = () => {
      raf = requestAnimationFrame(tick);
      const rect = section.getBoundingClientRect();
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const progress = clamp(-rect.top / (rect.height - vh));
      const frame = Math.round(clamp(progress / PLAY_END) * (seq.count - 1));

      // Closest frame that has loaded (a newly loaded, closer one also triggers a repaint)
      const shown = nearestLoaded(frames, frame);
      if (shown >= 0 && shown !== drawn) {
        drawCover(ctx, frames[shown]!);
        drawn = shown;
        if (els.time.current) els.time.current.textContent = timecode(shown, seq.fps);
      }

      // On the way in, the frame grows from an inset card to full-bleed
      const k = Math.round(clamp(rect.top / vh) * 1000) / 1000;
      const nextClip = k > 0 ? `inset(${k * INSET.y}% ${k * INSET.x}% round ${k * INSET.radius}px)` : "none";
      if (nextClip !== clip) stage.style.clipPath = clip = nextClip;

      // The headline slides across while the clip plays: starts 40% in, ends with its right edge 5% from the edge
      const x = Math.round((vw * 0.4 + (vw * 0.55 - textWidth) * progress) * 2) / 2;
      if (x !== shift && els.text.current) {
        shift = x;
        els.text.current.style.transform = `translate3d(${x}px,0,0)`;
      }
    };

    // Loading starts 1.5 screens early; the loop itself only runs while the section is actually visible
    const loader = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        loader.disconnect();
        const small = window.matchMedia(SMALL_SCREEN).matches;
        const urls = Array.from({ length: seq.count }, (_, i) => frameUrl(seq, i, small));
        stopLoading = loadFrames(urls, (i, img) => {
          frames[i] = img;
          if (!sized) resize();
        });
      },
      { rootMargin: PRELOAD },
    );
    const looper = new IntersectionObserver(([entry]) => {
      cancelAnimationFrame(raf);
      raf = entry.isIntersecting ? requestAnimationFrame(tick) : 0;
    });

    resize();
    loader.observe(section);
    looper.observe(section);
    window.addEventListener("resize", resize);
    document.fonts?.ready.then(resize); // the headline's width changes once its font loads

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      loader.disconnect();
      looper.disconnect();
      stopLoading?.();
      window.removeEventListener("resize", resize);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seq.dir, seq.count, seq.fps]);
}
