"use client";

import React, { useEffect, useRef, useState } from "react";
import Hero from "./Hero";
import RandomLetterReveal from "./RandomLetterReveal";
import { markSkullReady } from "@/lib/skullReady";

type ThreeInstance = {
  dispose: () => void;
};

export default function SkullHero() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [webgpuSupported, setWebgpuSupported] = useState<boolean | null>(null);
  const [skullReady, setSkullReady] = useState<boolean>(false);

  useEffect(() => {
    const supported = typeof navigator !== "undefined" && "gpu" in navigator;
    setWebgpuSupported(supported);
    if (!supported) {
      setSkullReady(true);
      markSkullReady();
    }
  }, []);

  useEffect(() => {
    if (!webgpuSupported || !containerRef.current) return;

    let instance: ThreeInstance | null = null;
    let cancelled = false;

    (async () => {
      try {
        const { default: Three } = await import("./skull/core/Three.js");
        if (cancelled || !containerRef.current) return;
        const three = new Three(containerRef.current);
        await three.run();
        await three.scene?.ready;
        if (cancelled) {
          three.dispose();
          return;
        }
        instance = three;
        setSkullReady(true);
        markSkullReady();
      } catch (err) {
        console.error("[SkullHero] WebGPU init failed:", err);
        if (!cancelled) {
          setWebgpuSupported(false);
          setSkullReady(true);
          markSkullReady();
        }
      }
    })();

    return () => {
      cancelled = true;
      instance?.dispose();
    };
  }, [webgpuSupported]);

  if (webgpuSupported === null) {
    return (
      <section className="relative w-full h-screen overflow-hidden bg-[#080808]" />
    );
  }

  if (!webgpuSupported) {
    return <Hero />;
  }

  return (
    <section
      id="index"
      className="relative w-full h-screen overflow-hidden select-none"
    >
      <div
        ref={containerRef}
        className="absolute inset-0 z-0 pointer-events-auto bg-[#080808]"
      />

      {skullReady && (
        <div className="relative z-10 flex flex-col h-full w-full pt-[38vh] pb-10 md:pb-14 pointer-events-none">
          {/* Heading — left aligned */}
          <div className="text-white mix-blend-difference px-6 md:px-16">
            <div>
              <RandomLetterReveal
                word="FRONT–END"
                className="font-extrabold tracking-tight leading-[0.9]
                          text-[1.8rem] sm:text-[2.3rem]
                          md:text-[3.25rem]
                          lg:text-[4rem]
                          xl:text-[4.5rem]
                          2xl:text-[5.5rem] mb-2 md:mb-3"
              />
            </div>

            <div>
              <RandomLetterReveal
                word="DEVELOPER"
                className="font-extrabold tracking-tight leading-[0.9]
                          text-[1.8rem] sm:text-[2.3rem]
                          md:text-[3.25rem]
                          lg:text-[4rem]
                          xl:text-[4.5rem]
                          2xl:text-[5.5rem] mb-2 md:mb-3"
              />
            </div>

            <div>
              <RandomLetterReveal
                word="BASED IN DELHI, INDIA"
                className="font-extrabold tracking-tight leading-[0.9]
                          text-[1.8rem] sm:text-[2.3rem]
                          md:text-[3.25rem]
                          lg:text-[4rem]
                          xl:text-[4.5rem]
                          2xl:text-[5.5rem]"
              />
            </div>
          </div>

          {/* Paragraph — bottom-right */}
          <div className="mt-auto w-full max-w-6xl mx-auto px-6 md:px-16 md:flex md:justify-end md:pr-5 text-white mix-blend-difference">
            <div className="max-w-[90%] sm:max-w-[80%] md:max-w-md text-left md:text-right">
              {/* Mobile: flat string, breakable spaces, wraps naturally */}
              <span className="md:hidden">
                <RandomLetterReveal
                  breakable
                  word="I DESIGN AND BUILD SMOOTH, INTERACTIVE, AND VISUALLY ENGAGING DIGITAL EXPERIENCES. I BLEND UI/UX, MOTION, AND CLEAN ENGINEERING TO CREATE PRODUCTS THAT FEEL FAST, MODERN, AND HUMAN. I LOVE EXPERIMENTING WITH MOTION, INTERACTION, AND MICRO DETAILS THAT MAKE INTERFACES FEEL ALIVE. ALWAYS EXPLORING, ALWAYS LEARNING CRAFTING DIGITAL WORK THAT FEELS EXPRESSIVE, INTENTIONAL AND REALLY COOL."
                  className="text-xs sm:text-sm leading-relaxed uppercase font-medium text-left"
                />
              </span>

              {/* Desktop: hardcoded line shape with nbsp (original layout) */}
              <span className="hidden md:inline">
                <RandomLetterReveal
                  word={`I DESIGN AND BUILD SMOOTH, INTERACTIVE, AND VISUALLY ENGAGING DIGITAL
EXPERIENCES. I BLEND UI/UX, MOTION, AND CLEAN ENGINEERING TO CREATE
PRODUCTS THAT FEEL FAST, MODERN, AND HUMAN. I LOVE EXPERIMENTING
WITH MOTION, INTERACTION, AND MICRO DETAILS THAT MAKE INTERFACES
FEEL ALIVE. ALWAYS EXPLORING, ALWAYS LEARNING CRAFTING DIGITAL WORK
THAT FEELS EXPRESSIVE, INTENTIONAL AND REALLY COOL.`}
                  className="md:text-base lg:text-lg
                             leading-relaxed uppercase font-medium text-left whitespace-pre-line"
                />
              </span>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
