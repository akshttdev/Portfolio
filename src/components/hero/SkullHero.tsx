"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import HeroHeadline from "./HeroHeadline";
import { markSkullReady, setSkullProgress } from "@/lib/skullReady";
import { loadModelBuffer, MODEL_URLS } from "@/components/skull/utils/modelCache";

const Placeholder = () => <section className="relative w-full h-screen overflow-hidden bg-ink" />;

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
// The loader picks these same downloads up (see modelCache), so each model is fetched once
if (HAS_WEBGPU) Object.values(MODEL_URLS).forEach(loadModelBuffer);

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
        setSkullProgress(0.3);
        const three = new Three(container);
        try {
          // run() resolves once the models are in and the first frame is drawn
          await withTimeout(three.run(setSkullProgress), INIT_TIMEOUT_MS, "WebGPU init timed out");
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
      <div ref={containerRef} className="absolute inset-0 z-0 pointer-events-auto bg-ink" />

      {ready && (
        <div className="pointer-events-none relative z-10 h-full w-full text-bone">
          {/* centred title */}
          <div className="absolute inset-0 flex items-center justify-center px-6">
            <HeroHeadline className="text-center" />
          </div>
        </div>
      )}
    </section>
  );
}
