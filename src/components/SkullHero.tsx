"use client";

import React, { useEffect, useRef, useState } from "react";
import Hero from "./Hero";
import RandomLetterReveal from "./RandomLetterReveal";
import HeroParagraph from "./HeroParagraph";
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
                word="SOFTWARE"
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
                word="BASED IN MUNICH "
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
          <div className="mt-auto w-full min-w-0 px-6 md:pl-16 md:pr-10 md:flex md:justify-end text-white mix-blend-difference">
            <HeroParagraph className="text-xs sm:text-sm md:text-base lg:text-lg leading-relaxed uppercase font-medium text-left" />
          </div>
        </div>
      )}
    </section>
  );
}
