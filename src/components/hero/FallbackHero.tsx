"use client";

import Dither from "./dither/Dither";
import HeroHeadline from "./HeroHeadline";
import HeroParagraph from "./HeroParagraph";
import { useMediaQuery } from "@/hooks/useMediaQuery";

/** Hero for browsers without WebGPU: dithered WebGL waves instead of the 3D scene. */
export default function FallbackHero() {
  const isMobile = useMediaQuery("(max-width: 767px)");

  return (
    <section
      id="index"
      className="relative w-full h-screen flex items-center justify-center text-white overflow-hidden select-none"
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
        <HeroHeadline
          className="mt-24 md:mt-32"
          lineClassName="text-[1.35rem] sm:text-[1.9rem] md:text-[2.75rem] lg:text-[3.5rem] xl:text-[4.25rem] 2xl:text-[5rem]"
          gapClassName="mb-2 md:mb-4"
        />

        <div className="mt-6 md:mt-10 w-full min-w-0 md:flex md:justify-end md:pr-5">
          <HeroParagraph className="text-[0.5rem] sm:text-xs md:text-base opacity-80 leading-relaxed uppercase font-medium text-left" />
        </div>
      </div>
    </section>
  );
}
