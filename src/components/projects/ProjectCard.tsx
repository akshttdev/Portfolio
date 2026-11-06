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
      className="block w-fit mx-auto group max-md:w-full cursor-pointer"
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
    </motion.a>
  );
}
