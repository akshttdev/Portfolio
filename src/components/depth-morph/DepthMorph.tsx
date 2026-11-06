"use client";

/**
 * Scroll-driven depth morph between photos.
 *
 * Each slide is a photo plus a grayscale depth map (white = near). As you scroll, the next photo
 * dissolves in nearest-first along a noisy, rippling edge with a chromatic split; the cursor drives
 * depth parallax. Plain WebGL, no extra deps. Falls back to a static image without WebGL.
 *
 * Transition technique inspired by the hero on martingarrix.com.
 */

import { useCallback, useRef, useState } from "react";
import type { DepthSlide } from "./config";
import { timelineSpan } from "./timeline";
import { useDepthMorph } from "./useDepthMorph";

const pad = (n: number) => String(n).padStart(2, "0");

export default function DepthMorph({ slides, title }: { slides: DepthSlide[]; title: string }) {
  const els = {
    hero: useRef<HTMLElement>(null),
    stage: useRef<HTMLDivElement>(null),
    canvasHost: useRef<HTMLDivElement>(null),
    title: useRef<HTMLHeadingElement>(null),
    roll: useRef<HTMLSpanElement>(null),
    label: useRef<HTMLSpanElement>(null),
    cue: useRef<HTMLDivElement>(null),
  };
  const [fallback, setFallback] = useState(false);
  useDepthMorph(slides, els, useCallback(() => setFallback(true), []));

  return (
    <section
      ref={els.hero}
      className="relative bg-[#0a0a0a]"
      style={{ height: `${(timelineSpan(slides.length) + 1) * 100}vh` }}
    >
      <div ref={els.stage} className="sticky top-0 h-screen h-[100svh] overflow-hidden select-none">
        {fallback ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={slides[0]?.image} alt="" className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <div ref={els.canvasHost} className="absolute inset-0" />
        )}

        <h1
          ref={els.title}
          aria-label={title}
          className="absolute inset-x-0 bottom-[3vh] flex justify-center overflow-hidden pt-[0.08em] pointer-events-none
                     font-robert-b uppercase text-white mix-blend-difference leading-[0.82] tracking-[-0.04em]
                     text-[clamp(64px,19vw,380px)] will-change-transform"
        >
          {[...title].map((ch, i) => (
            <span
              key={i}
              aria-hidden="true"
              className="inline-block will-change-transform"
              style={{ transform: fallback ? "none" : "translateY(110%)" }}
            >
              {ch}
            </span>
          ))}
        </h1>

        {/* Slide counter + label */}
        <div className="absolute top-20 inset-x-6 flex justify-between nav-txt text-white/70 pointer-events-none max-md:top-16">
          <span>
            <span className="inline-block h-[1.25em] overflow-hidden align-top text-white">
              <span ref={els.roll} className="flex flex-col transition-transform duration-[420ms] ease-[cubic-bezier(.2,.8,.2,1)]">
                {slides.map((_, i) => (
                  <span key={i} className="h-[1.25em] leading-[1.25em]">
                    {pad(i + 1)}
                  </span>
                ))}
              </span>
            </span>
            {" / "}
            {pad(slides.length)}
          </span>
          <span ref={els.label}>{slides[0]?.label}</span>
        </div>

        {/* plain white (not nav-txt, whose mix-blend-difference inverts it into colours over the photo) */}
        <div
          ref={els.cue}
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 font-robert-b text-[.9rem] max-sm:text-[.75rem] uppercase tracking-wide text-white drop-shadow-[0_1px_6px_rgba(0,0,0,0.45)] pointer-events-none flex flex-col items-center gap-3"
        >
          Scroll
          <span className="block w-px h-10 bg-white origin-top animate-pulse" />
        </div>
      </div>
    </section>
  );
}
