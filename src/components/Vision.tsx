"use client";

import { motion, useInView, useScroll, useTransform } from "framer-motion";
import Image from "next/image";
import React, { useRef, FC } from "react";

const Background: FC = () => {
  const container = useRef<HTMLElement>(null);

  const { scrollYProgress } = useScroll({
    target: container,
    offset: ["start end", "end start"],
  });

  const y = useTransform(scrollYProgress, [0, 1], ["-15%", "15%"]);

  // The background is a fixed, full-screen layer revealed by this section's clip-path. Without this the
  // browser keeps compositing it the whole time (e.g. while the hero is on screen); only show it when near.
  const isNear = useInView(container, { margin: "25% 0px 25% 0px" });

  return (
    <section
      ref={container}
      className="relative px-6 flex items-center justify-center h-screen overflow-hidden max-md:px-3 isolate"
      style={{ clipPath: "polygon(0% 0, 100% 0%, 100% 100%, 0 100%)" }}
    >
      {/* Parallax Background */}
      <div
        className="fixed top-[-10vh] left-0 w-full h-[120vh] md:h-[130vh]"
        style={{ visibility: isNear ? "visible" : "hidden" }}
      >
        <motion.div style={{ y }} className="relative w-full h-full will-change-transform">
          <Image
            src="/images/2.jpeg"
            alt=""
            width={3000}
            height={3000}
            sizes="100vw"
            // Below the fold: let it load lazily instead of competing with the hero for first-load bandwidth.
            // The browser still starts it well before this section scrolls into view.
            className="w-full h-full object-cover"
          />
        </motion.div>
      </div>

      <div className="absolute top-32 left-1/2 -translate-x-1/2 z-20 pointer-events-none select-none mix-blend-difference">
        <p
          className="text-white uppercase tracking-wide 
                text-xs sm:text-sm md:text-base font-semibold"
        >
          Discomfort Drives Growth
        </p>
      </div>

      {/* MY VISION TEXT */}
      <div className="absolute bottom-1 left-6 md:left-10 z-20 pointer-events-none select-none">
        <h1
          className="text-white font-extrabold tracking-tight mix-blend-difference
                       text-[5rem] sm:text-[4rem] md:text-[10rem] leading-[0.9]"
        >
          MY
          <br />
          VISION
        </h1>
      </div>

      {/* QUOTE: stays in normal layout, NO absolute positioning */}
      <div className="mt-6 md:mt-10 w-full md:flex md:justify-end md:pr-5 z-20 mix-blend-difference">
        <div
          className="
            max-w-[90%]
            sm:max-w-[80%]
            md:max-w-md
            text-left md:text-right
            pointer-events-none select-none
          "
        >
          <p
            className="
              text-white 
              mix-blend-difference 
              text-[0.56rem] sm:text-xs md:text-base
              leading-relaxed uppercase font-medium
              whitespace-pre-line tracking-wide
              relative
              text-left
            "
          >
            " I’m wired to fixate, break things apart, and push them past the
            obvious. It’s never clean, never linear, just persistence until
            meaning shows up. Nothing extravagant. "
          </p>
        </div>
      </div>
    </section>
  );
};

export default Background;
