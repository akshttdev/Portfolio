"use client";

import React, { useEffect, useRef, useState } from "react";
import Hero from "./Hero";
import RandomLetterReveal from "./RandomLetterReveal";
import HeroParagraph from "./HeroParagraph";
import { markSkullReady } from "@/lib/skullReady";

type ThreeInstance = {
  dispose: () => void;
};

// WebGPU init can hang forever (never rejects) on some browsers/GPUs, which
// would leave the preloader stuck. Bail out to the non-WebGPU hero instead.
const INIT_TIMEOUT_MS = 15000;

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
        // Warm the HTTP cache so the models are ready when the loader asks.
        ["man_comp-transformed", "skeleton_comp-transformed"].forEach((m) =>
          fetch(`/models/${m}.glb`).catch(() => {}),
        );
        const { default: Three } = await import("./skull/core/Three.js");
        if (cancelled || !containerRef.current) return;
        const three = new Three(containerRef.current);
        let timer: ReturnType<typeof setTimeout> | undefined;
        const timeout = new Promise<never>((_, reject) => {
          timer = setTimeout(
            () => reject(new Error("WebGPU init timed out")),
            INIT_TIMEOUT_MS,
          );
        });
        try {
          await Promise.race([
            (async () => {
              await three.run();
              await three.scene?.ready;
            })(),
            timeout,
          ]);
        } catch (err) {
          try {
            three.dispose();
          } catch {}
          throw err;
        } finally {
          clearTimeout(timer);
        }
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
        <div className="relative z-10 flex flex-col h-full w-full pt-[38vh] pb-10 md:pb-14 pointer-events-none text-white mix-blend-difference">
          {/* Heading — left aligned */}
          <div className="px-6 md:px-16">
            <div>
              <RandomLetterReveal
                word="SOFTWARE DEVELOPER"
                className="font-extrabold tracking-tight leading-[0.9] whitespace-nowrap
                          text-[1.2rem] sm:text-[1.6rem]
                          md:text-[2.25rem]
                          lg:text-[3rem]
                          xl:text-[3.5rem]
                          2xl:text-[4.25rem] mb-2 md:mb-3"
              />
            </div>

            <div>
              <RandomLetterReveal
                word="BASED IN MUNICH, GERMANY"
                className="font-extrabold tracking-tight leading-[0.9] whitespace-nowrap
                          text-[1.2rem] sm:text-[1.6rem]
                          md:text-[2.25rem]
                          lg:text-[3rem]
                          xl:text-[3.5rem]
                          2xl:text-[4.25rem]"
              />
            </div>
          </div>

          {/* Paragraph — bottom-right */}
          <div className="mt-auto w-full min-w-0 px-6 md:pl-16 md:pr-10 md:flex md:justify-end">
            <HeroParagraph className="text-xs sm:text-sm md:text-base lg:text-lg leading-relaxed uppercase font-medium text-left" />
          </div>
        </div>
      )}
    </section>
  );
}
