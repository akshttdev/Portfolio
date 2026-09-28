"use client";

import React, { FC, useEffect, useState } from "react";
import Dither from "./Dither";
import RandomLetterReveal from "./RandomLetterReveal";
import HeroParagraph from "./HeroParagraph";

const Hero: FC = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  return (
    <section
      id="index"
      className="relative w-full h-screen flex items-center justify-center text-white overflow-hidden select-none"
    >
      {/* === Background === */}
      <div className="absolute inset-0 -z-10 pointer-events-none">
        <Dither
          waveColor={[1, 0, 0]}
          disableAnimation={false}
          enableMouseInteraction={!isMobile}
          mouseRadius={0.3}
          colorNum={4}
          waveAmplitude={0.3}
          waveFrequency={3}
          waveSpeed={0.05}
        />
      </div>

      <div className="flex flex-col px-6 md:px-16 w-full max-w-6xl min-w-0 pointer-events-none">
        {/* ======================================================
            BIG TITLES — FULLY RESPONSIVE + 1240–1350 FIX
        ======================================================= */}
        <div className="mt-24 md:mt-32 ml-0 lg:ml-0 xl:ml-[-10rem]">
          <RandomLetterReveal
            word="SOFTWARE"
            className="block font-extrabold tracking-tight leading-[0.9]
                      text-[2.8rem] sm:text-[3.5rem]
                      md:text-[5rem]
                      lg:text-[6rem]
                      xl:text-[7rem]
                      2xl:text-[9rem] mb-2 md:mb-4"
          />

          <RandomLetterReveal
            word="DEVELOPER"
            className="block font-extrabold tracking-tight leading-[0.9]
                      text-[2.8rem] sm:text-[3.5rem]
                      md:text-[5rem]
                      lg:text-[6rem]
                      xl:text-[7rem]
                      2xl:text-[9rem] mb-2 md:mb-4"
          />

          <RandomLetterReveal
            word="BASED IN MUNICH,"
            className="block font-extrabold tracking-tight leading-[0.9]
                      text-[2.8rem] sm:text-[3.5rem]
                      md:text-[5rem]
                      lg:text-[6rem]
                      xl:text-[7rem]
                      2xl:text-[9rem] mb-2 md:mb-4"
          />

          <RandomLetterReveal
            word="GERMANY"
            className="block font-extrabold tracking-tight leading-[0.9]
                      text-[2.8rem] sm:text-[3.5rem]
                      md:text-[5rem]
                      lg:text-[6rem]
                      xl:text-[7rem]
                      2xl:text-[9rem]"
          />
        </div>

        {/* ======================================================
            SMALL PARAGRAPH — CLEAN, RESPONSIVE, AWWARDS STYLE
        ======================================================= */}
        <div className="mt-6 md:mt-10 w-full min-w-0 md:flex md:justify-end md:pr-5">
          <HeroParagraph className="text-[0.5rem] sm:text-xs md:text-base opacity-80 leading-relaxed uppercase font-medium text-left" />
        </div>
      </div>
    </section>
  );
};

export default Hero;
