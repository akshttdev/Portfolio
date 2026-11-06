"use client";

import { useRef } from "react";
import type { FrameSequence } from "./frames";
import { useFrameSequence } from "./useFrameSequence";

type Props = {
  seq: FrameSequence;
  /** Big headline that slides across while the clip plays */
  text: string;
  /** Scroll length of the section in screen heights (the clip plays over all but one of them) */
  screens?: number;
};

/**
 * A clip that plays as you scroll: the frame pins full-screen and the video scrubs with the scroll position,
 * forwards and backwards. Image-sequence technique, as on eseagency.ch's hero.
 */
export default function ScrollSequence({ seq, text, screens = 3.2 }: Props) {
  const els = {
    section: useRef<HTMLElement>(null),
    stage: useRef<HTMLDivElement>(null),
    canvas: useRef<HTMLCanvasElement>(null),
    text: useRef<HTMLHeadingElement>(null),
    time: useRef<HTMLSpanElement>(null),
  };
  useFrameSequence(seq, els);

  return (
    <section ref={els.section} className="relative bg-black" style={{ height: `${screens * 100}vh` }}>
      <div
        ref={els.stage}
        className="sticky top-0 h-screen h-[100svh] overflow-hidden select-none"
        style={{ clipPath: "inset(12% 8% round 28px)" }}
      >
        <canvas ref={els.canvas} aria-hidden="true" className="absolute inset-0 w-full h-full" />
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/55 to-transparent pointer-events-none" />

        {/* plain white rather than nav-txt: its difference blend would turn the red rec dot cyan */}
        <div
          className="absolute top-20 inset-x-6 flex justify-between pointer-events-none max-md:top-16 font-robert-b text-[.9rem]
                     max-sm:text-[.75rem] uppercase tracking-wide text-white drop-shadow-[0_1px_6px_rgba(0,0,0,0.45)]"
        >
          <span className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#e5372b] animate-pulse" />
            Rec
          </span>
          <span ref={els.time} className="tabular-nums">
            00:00:00
          </span>
        </div>

        <h2
          ref={els.text}
          className="absolute left-0 bottom-[4vh] whitespace-nowrap pointer-events-none will-change-transform
                     font-robert-b uppercase text-white mix-blend-difference leading-[0.82] tracking-[-0.04em]
                     text-[clamp(64px,19vw,380px)]"
          style={{ transform: "translate3d(40vw,0,0)" }}
        >
          {text}
        </h2>
      </div>
    </section>
  );
}
