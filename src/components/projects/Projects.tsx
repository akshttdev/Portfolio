"use client";

import { useRef } from "react";
import { useScroll } from "framer-motion";
import ProjectsTitle from "./ProjectsTitle";
import ProjectCard from "./ProjectCard";
import ProjectsOutro from "./ProjectsOutro";
import { useCardSpread } from "./useCardSpread";
import { projectsData } from "@/data/projects";

export default function Projects() {
  const container = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: container, offset: ["start center", "end start"] });
  const spread = useCardSpread();

  return (
    <section ref={container} id="project" className="relative w-screen px-6 pb-[250px] max-md:px-3">
      <ProjectsTitle count={projectsData.length} />

      <div className="flex flex-col gap-5 mt-10">
        {projectsData.map((project, i) => (
          <ProjectCard key={project.id} project={project} index={i} progress={scrollYProgress} spread={spread} />
        ))}
      </div>

      <ProjectsOutro />
    </section>
  );
}
