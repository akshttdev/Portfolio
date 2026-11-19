"use client";

/** /work: the projects on the ring. Hover or spin to see one, click it for the details. */

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, LayoutGroup, motion } from "framer-motion";
import Orbit from "@/components/orbit/Orbit";
import ProjectDetails from "./ProjectDetails";
import { projectsData } from "@/data/projects";
import { NAV_SOCIALS } from "@/data/links";

const pad = (n: number) => String(n).padStart(2, "0");

export default function WorkOrbit() {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [open, setOpen] = useState<{ id: string; dir: number } | null>(null);
  // fly the ring out once the page-enter wipe has cleared
  const [revealed, setRevealed] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setRevealed(true), 450);
    return () => clearTimeout(t);
  }, []);
  const items = useMemo(() => projectsData.map((p) => ({ id: p.id, title: p.name, thumb: p.grunge, image: p.grunge })), []);
  const active = projectsData.find((p) => p.id === activeId) ?? null;

  // mouse: hovering already made it active, so a click opens it. Touch: the first tap picks, the second opens.
  const pick = (id: string) => (id === activeId ? setOpen({ id, dir: 0 }) : setActiveId(id));
  const nav = (dir: number) => {
    if (!open) return;
    const i = projectsData.findIndex((p) => p.id === open.id);
    const next = projectsData[(i + dir + projectsData.length) % projectsData.length].id;
    setOpen({ id: next, dir });
    setActiveId(next);
  };

  return (
    <>
      <Orbit
        items={items}
        repeat={4}
        mode="wheel"
        thumb={{ w: 24, h: 32 }}
        activeId={activeId}
        onActive={setActiveId}
        onPick={pick}
        revealed={revealed}
        label="Projects. Scroll, drag or use the arrow keys to spin."
        overlay={
          <div className="ui-txt pointer-events-none absolute inset-x-5 bottom-5 z-10 flex items-end justify-between gap-6 md:inset-x-8 md:bottom-7">
            <span className="text-bone/60">
              <span className="max-md:hidden">(Scroll, drag or ← → to spin)</span>
              <span className="md:hidden">(Drag to spin)</span> {pad(projectsData.length)} projects
            </span>
            <span className="pointer-events-auto flex flex-wrap justify-end gap-x-4 gap-y-1">
              {NAV_SOCIALS.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  className="capitalize transition-colors hover:text-blood"
                  {...(/^https?:/.test(s.href) && { target: "_blank", rel: "noopener noreferrer" })}
                >
                  {s.label.toLowerCase()}
                </a>
              ))}
            </span>
          </div>
        }
      >
        <LayoutGroup>
          <p className="ui-txt flex flex-wrap items-baseline justify-center gap-x-[0.9em] gap-y-1 text-center text-[13px] md:text-[15px] [text-shadow:0_0_18px_rgba(0,0,0,.9),0_1px_3px_rgba(0,0,0,.8)]">
            <motion.span layout>Akshat™</motion.span>
            <AnimatePresence mode="popLayout" initial={false}>
              {active && (
                <motion.button
                  layout
                  key={active.id}
                  type="button"
                  onClick={() => setOpen({ id: active.id, dir: 0 })}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.3 }}
                  className="cursor-pointer underline decoration-1 underline-offset-[3px]"
                >
                  {active.name}.
                </motion.button>
              )}
            </AnimatePresence>
            <motion.span layout>
              <Link href="/about" className="transition-colors hover:text-blood">
                About
              </Link>
            </motion.span>
            <motion.span layout>
              <Link href="/#contact" className="transition-colors hover:text-blood">
                Contact
              </Link>
            </motion.span>
          </p>
        </LayoutGroup>
      </Orbit>

      <AnimatePresence>{open && <ProjectDetails key="details" id={open.id} dir={open.dir} onClose={() => setOpen(null)} onNav={nav} />}</AnimatePresence>
    </>
  );
}
