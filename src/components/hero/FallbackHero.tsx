"use client";

import Dither from "./dither/Dither";
import HeroHeadline from "./HeroHeadline";
import { useMediaQuery } from "@/hooks/useMediaQuery";

/** Hero for browsers without WebGPU: dithered WebGL waves instead of the 3D scene. */
export default function FallbackHero() {
  const isMobile = useMediaQuery("(max-width: 767px)");

  return (
    <section
      id="index"
      className="relative w-full h-screen flex items-center justify-center text-bone overflow-hidden select-none"
    >
      <div className="absolute inset-0 -z-10 pointer-events-none">
        <Dither
          waveColor={[1, 0, 0]}
          enableMouseInteraction={!isMobile}
          mouseRadius={0.3}
          colorNum={4}
          waveAmplitude={0.3}
          waveFrequency={3}
          waveSpeed={0.05}
        />
      </div>

      <div className="flex flex-col px-6 md:px-16 w-full max-w-7xl min-w-0 pointer-events-none">
        <HeroHeadline className="text-center" />
      </div>
    </section>
  );
}
