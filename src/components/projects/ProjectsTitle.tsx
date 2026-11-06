"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { arraySlideUpAnimation, spanAnimation } from "@/animations/anim";
import { YEAR } from "@/lib/site";

const LETTERS = [..."PROJECTS"];

/** Sticky "PROJECTS (n)" heading whose letters slide up when it comes into view. */
export default function ProjectsTitle({ count }: { count: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const state = useInView(ref) ? "animate" : "initial";

  return (
    <div className="pt-30 sticky top-[20rem] h-screen flex flex-col items-center z-50 mix-blend-exclusion pointer-events-none select-none">
      <div className="flex items-start" ref={ref}>
        <h2 aria-label="Projects" className="relative flex items-start overflow-hidden">
          {LETTERS.map((char, i) => (
            <motion.span
              key={i}
              aria-hidden="true"
              custom={i}
              variants={arraySlideUpAnimation}
              initial="initial"
              animate={state}
              className="project-txt"
            >
              {char}
            </motion.span>
          ))}
        </h2>

        <motion.span className="project-length-txt" variants={spanAnimation} initial="initial" animate={state}>
          ({count})
        </motion.span>
      </div>

      <div className="w-full flex justify-center max-md:ml-0 ml-[80px]">
        <motion.span className="project-year-count-txt" variants={spanAnimation} initial="initial" animate={state}>
          2024 to {YEAR}
        </motion.span>
      </div>
    </div>
  );
}
