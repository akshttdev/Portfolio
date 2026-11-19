"use client";

import { useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { projectsData } from "@/data/projects";

const pad = (n: number) => String(n).padStart(2, "0");
const EASE = [0.76, 0, 0.24, 1] as const;

type Props = { id: string; dir: number; onClose: () => void; onNav: (dir: number) => void };

/** Full-screen project sheet over the ring. Esc closes, ← → go to the previous / next project. */
export default function ProjectDetails({ id, dir, onClose, onNav }: Props) {
  const i = projectsData.findIndex((p) => p.id === id);
  const p = projectsData[i];
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const before = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowRight") onNav(1);
      else if (e.key === "ArrowLeft") onNav(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      before?.focus?.();
    };
  }, [onClose, onNav]);

  const facts = [
    ["Category", p.category],
    ["Year", p.status],
    ["Client", p.client],
    ["License", p.license],
  ];

  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-label={p.name}
      className="fixed inset-0 z-[1100] bg-ink text-bone"
      initial={{ clipPath: "inset(50% 0% 50% 0%)" }}
      animate={{ clipPath: "inset(0% 0% 0% 0%)" }}
      exit={{ clipPath: "inset(50% 0% 50% 0%)" }}
      transition={{ duration: 0.6, ease: EASE }}
    >
      <div className="grid h-full md:grid-cols-[minmax(0,1fr)_minmax(340px,34vw)]">
        <div className="relative overflow-hidden max-md:h-[44svh]">
          <AnimatePresence initial={false} custom={dir}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <motion.img
              key={p.id}
              src={p.grunge}
              alt={p.alt || p.name}
              custom={dir}
              initial={{ x: `${(dir || 1) * 100}%` }}
              animate={{ x: "0%" }}
              exit={{ x: `${-(dir || 1) * 100}%` }}
              transition={{ duration: 0.7, ease: EASE }}
              className="absolute inset-0 size-full object-cover"
            />
          </AnimatePresence>
        </div>

        <div className="flex min-h-0 flex-col justify-between gap-8 overflow-y-auto p-5 md:p-8 md:pt-7">
          <div className="ui-txt flex justify-between">
            <span className="tabular-nums text-bone/60">
              ({pad(i + 1)}/{pad(projectsData.length)})
            </span>
            <button ref={closeRef} type="button" onClick={onClose} className="cursor-pointer transition-colors hover:text-blood">
              Close
            </button>
          </div>

          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.35 }}
            >
              <h2 className="text-[clamp(2.5rem,5vw,5rem)] font-bold leading-[0.9] tracking-[-0.045em]">{p.name}</h2>
              <dl className="ui-txt mt-8 grid grid-cols-[6.5rem_1fr] gap-y-2 border-t border-bone/15 pt-4">
                {facts.map(([k, v]) => (
                  <div key={k} className="contents">
                    <dt className="text-bone/50">{k}</dt>
                    <dd className="capitalize">{v}</dd>
                  </div>
                ))}
              </dl>
              {p.description.length > 2 && <p className="mt-6 max-w-prose text-[15px] leading-relaxed text-bone/80">{p.description}</p>}
              <a
                href={p.url}
                target="_blank"
                rel="noopener noreferrer"
                className="ui-txt mt-8 inline-block border-b border-blood pb-0.5 transition-colors hover:text-blood"
              >
                View on GitHub ↗
              </a>
            </motion.div>
          </AnimatePresence>

          <div className="ui-txt flex gap-6">
            <button type="button" onClick={() => onNav(-1)} className="cursor-pointer transition-colors hover:text-blood">
              ← Prev
            </button>
            <button type="button" onClick={() => onNav(1)} className="cursor-pointer transition-colors hover:text-blood">
              Next →
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
