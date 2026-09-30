"use client";

import Image from "next/image";
import { useRef } from "react";
import { motion, useInView, useScroll, useTransform } from "framer-motion";
import { projectsData } from "@/data/ProjectData";
import { arraySlideUpAnimation, spanAnimation } from "@/animations/anim";
import RandomLetterReveal from "@/components/RandomLetterReveal";
import { useMedia } from "react-use";

const Projects = () => {
  const container = useRef<HTMLDivElement | null>(null);
  const text = useRef<HTMLDivElement | null>(null);

  const isTablet = useMedia("(max-width: 768px)");
  const a = useMedia("(max-width: 1400px)");
  const b = useMedia("(max-width: 1200px)");
  const c = useMedia("(max-width: 1024px)");
  const d = useMedia("(max-width: 820px)");

  const currentYear = new Date().getFullYear();

  const { scrollYProgress } = useScroll({
    target: container,
    offset: ["start center", "end start"],
  });

  const isInView = useInView(text);

  return (
    <section
      className="relative w-screen px-6 pb-[250px] max-md:px-3"
      ref={container}
      id="project"
    >
      {/* PROJECTS TITLE */}
      <div className="pt-30 sticky top-[20rem] h-screen flex flex-col items-center z-50 mix-blend-exclusion pointer-events-none select-none">
        <div className="flex items-start" ref={text}>
          <div className="relative flex items-start overflow-hidden">
            {["P", "R", "O", "J", "E", "C", "T", "S"].map((char, i) => (
              <motion.h2
                key={i}
                custom={i}
                variants={arraySlideUpAnimation}
                initial="initial"
                animate={isInView ? "animate" : "initial"}
                className="project-txt"
              >
                {char}
              </motion.h2>
            ))}
          </div>

          <motion.span
            className="project-length-txt"
            variants={spanAnimation}
            initial="initial"
            animate={isInView ? "animate" : "initial"}
          >
            ({projectsData.length})
          </motion.span>
        </div>

        <div className="w-full flex justify-center max-md:ml-0 ml-[80px]">
          <motion.span
            className="project-year-count-txt"
            variants={spanAnimation}
            initial="initial"
            animate={isInView ? "animate" : "initial"}
          >
            2024 to {currentYear}
          </motion.span>
        </div>
      </div>

      {/* PROJECT CARDS */}
      <div className="flex flex-col gap-5 mt-10">
        {projectsData.map((project, i) => {
          let baseX = d ? 100 : c ? 150 : b ? 200 : a ? 250 : 500;

          const xValue = i % 2 === 0 ? baseX + i * 10 : -baseX - i * 10;
          const yValue = i % 3 === 0 ? 50 + i * 5 : -50 - i * 5;

          const x = useTransform(
            scrollYProgress,
            [0, 1],
            [0, isTablet ? 0 : xValue],
          );
          const y = useTransform(
            scrollYProgress,
            [0, 1],
            [0, isTablet ? 0 : yValue],
          );

          return (
            <motion.div
              key={i}
              style={{ x, y }}
              className="w-fit mx-auto group max-md:w-full cursor-pointer"
              onClick={() =>
                window.open(project.url, "_blank", "noopener,noreferrer")
              }
            >
              <div className="size-full overflow-hidden">
                <Image
                  src={project.img}
                  width={500}
                  height={500}
                  alt={project.alt}
                  className="object-cover group-hover:scale-125 transition-all duration-500 max-md:size-full"
                />
              </div>

              <div className="mt-2 w-full flex justify-between">
                <p className="project-card-txt text-[1.1rem]">
                  <RandomLetterReveal word={project.name} />
                </p>
                <p className="project-card-txt text-[1rem]">
                  <RandomLetterReveal word={project.category} />
                </p>
                <p className="project-card-txt text-[1rem]">
                  <RandomLetterReveal word={project.status} />
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="w-full mt-48 px-2 md:px-8 relative z-[30] pointer-events-none select-none">
        <div
          className="
      text-white/90 
      uppercase 
      text-[0.75rem] sm:text-[0.9rem] md:text-[1.2rem] 
      leading-relaxed 
      font-medium
      w-full
      flex flex-col
    "
        >
          <div className="text-left">
            Stuff changes. Taste shifts. What felt <br />
            insane one night might look mid the next morning. <br />
            These are just things I made that felt right — <br />
          </div>
          <div className="w-full flex flex-col md:flex-row md:items-center justify-between mt-1 gap-2 md:gap-0">
            <div className="text-left">
              no fake hype, no dramatic case studies…
            </div>
            <div className="text-left md:text-center">
              &quot; just work I actually enjoyed building
            </div>
            <div className="text-left md:text-right">once. &quot;</div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Projects;
