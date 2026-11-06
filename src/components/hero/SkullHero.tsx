"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import HeroHeadline from "./HeroHeadline";
import HeroParagraph from "./HeroParagraph";
import { markSkullReady } from "@/lib/skullReady";

const Placeholder = () => <section className="relative w-full h-screen overflow-hidden bg-[#080808]" />;

// The fallback hero pulls in three.js + react-three-fiber + postprocessing. Load it only for browsers
// that actually need it, instead of shipping it in the main bundle to every visitor.
const FallbackHero = dynamic(() => import("./FallbackHero"), { ssr: false, loading: Placeholder });

// WebGPU init can hang forever (never rejects) on some browsers/GPUs, which would leave the preloader
// stuck. Bail out to the fallback hero instead.
const INIT_TIMEOUT_MS = 15000;

// First-visit critical path: the 3D engine chunk + models are what the preloader waits on. Start them as soon
// as this module is evaluated in the browser (in parallel with hydration) instead of after React's first
// render + effects. Only for WebGPU browsers; others get the lightweight fallback and skip the download.
const HAS_WEBGPU = typeof navigator !== "undefined" && "gpu" in navigator;
const loadEngine = () => import("@/components/skull/core/Three.js");
const earlyEngine = HAS_WEBGPU ? loadEngine() : null;
earlyEngine?.catch(() => {}); // a failure is handled where it's awaited; avoid an "unhandled rejection" before then
if (HAS_WEBGPU) {
  ["man_comp-transformed", "skeleton_comp-transformed"].forEach((m) => fetch(`/models/${m}.glb`).catch(() => {}));
}

function withTimeout<T>(promise: Promise<T>, ms: number, message: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(message)), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

export default function SkullHero() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [webgpu, setWebgpu] = useState<boolean | null>(null); // null until checked on the client
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setWebgpu(HAS_WEBGPU);
    if (!HAS_WEBGPU) markSkullReady();
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!webgpu || !container) return;

    let instance: { dispose: () => void } | null = null;
    let cancelled = false;

    (async () => {
      try {
        const { default: Three } = await (earlyEngine ?? loadEngine());
        if (cancelled) return;
        const three = new Three(container);
        try {
          const start = async () => {
            await three.run();
            await three.scene?.ready;
          };
          await withTimeout(start(), INIT_TIMEOUT_MS, "WebGPU init timed out");
        } catch (err) {
          three.dispose();
          throw err;
        }
        if (cancelled) {
          three.dispose();
          return;
        }
        instance = three;
        setReady(true);
        markSkullReady();
      } catch (err) {
        console.error("[SkullHero] WebGPU init failed:", err);
        if (!cancelled) {
          setWebgpu(false);
          markSkullReady();
        }
      }
    })();

    return () => {
      cancelled = true;
      instance?.dispose();
    };
  }, [webgpu]);

  if (webgpu === null) return <Placeholder />;
  if (!webgpu) return <FallbackHero />;

  return (
    <section id="index" className="relative w-full h-screen overflow-hidden select-none">
      <div ref={containerRef} className="absolute inset-0 z-0 pointer-events-auto bg-[#080808]" />

      {ready && (
        <div className="relative z-10 flex flex-col h-full w-full pt-[38vh] pb-10 md:pb-14 pointer-events-none text-white mix-blend-difference">
          <HeroHeadline
            className="px-6 md:px-16"
            lineClassName="text-[1.2rem] sm:text-[1.6rem] md:text-[2.25rem] lg:text-[3rem] xl:text-[3.5rem] 2xl:text-[4.25rem]"
            gapClassName="mb-2 md:mb-3"
          />

          {/* Paragraph: bottom-right */}
          <div className="mt-auto w-full min-w-0 px-6 md:pl-16 md:pr-10 md:flex md:justify-end">
            <HeroParagraph className="text-xs sm:text-sm md:text-base lg:text-lg leading-relaxed uppercase font-medium text-left" />
          </div>
        </div>
      )}
    </section>
  );
}
