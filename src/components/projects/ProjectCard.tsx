"use client";

import Image from "next/image";
import { motion, useTransform, type MotionValue } from "framer-motion";
import RandomLetterReveal from "@/components/text/RandomLetterReveal";
import type { Project } from "@/data/projects";

type Props = {
  project: Project;
  index: number;
  /** Scroll progress through the projects section, 0..1 */
  progress: MotionValue<number>;
  /** Sideways drift in px (0 on small screens, where cards don't move) */
  spread: number;
};

const CARD_W = 500;

export default function ProjectCard({ project, index: i, progress, spread }: Props) {
  // Cards fan out alternately left/right and up/down as the section scrolls by
  const drift = spread > 0;
  const toX = drift ? (i % 2 === 0 ? spread + i * 10 : -spread - i * 10) : 0;
  const toY = drift ? (i % 3 === 0 ? 50 + i * 5 : -50 - i * 5) : 0;
  const x = useTransform(progress, [0, 1], [0, toX]);
  const y = useTransform(progress, [0, 1], [0, toY]);

  return (
    <motion.a
      href={project.url}
      target="_blank"
      rel="noopener noreferrer"
      style={{ x, y }}
      // Own GPU layer: the card glides at sub-pixel precision instead of being repainted every scroll frame
      className="block w-fit mx-auto group max-md:w-full cursor-pointer will-change-transform"
    >
      <div className="size-full overflow-hidden">
        {/* Real proportions, not a 500x500 placeholder: the photos aren't square, so each card used to resize
            by ~120px the moment its image loaded, shoving every card below it mid-scroll */}
        <Image
          src={project.img}
          width={CARD_W}
          height={Math.round((CARD_W * project.imgSize[1]) / project.imgSize[0])}
          alt={project.alt}
          style={{ aspectRatio: `${project.imgSize[0]} / ${project.imgSize[1]}` }}
          className="object-cover group-hover:scale-125 transition-transform duration-500 max-md:size-full"
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
    </motion.a>
  );
}
