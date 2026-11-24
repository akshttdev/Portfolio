"use client";

/**
 * First visit of the session (on whichever page it starts): a little box flickering through the work and the
 * music, the name and a count while the page loads (on the home page that includes the 3D hero), then the site.
 */

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { TRACKS } from "@/data/music";
import { projectsData } from "@/data/projects";
import { markRevealed } from "@/lib/intro";
import { holdScroll } from "@/lib/lenis";
import { onSkullProgress, skullReadyPromise } from "@/lib/skullReady";

type Phase = "loading" | "gone";

const FLICKER = [...projectsData.map((p) => p.grunge), ...TRACKS.slice(0, 6).map((t) => t.cover)];
const MIN_MS = 1300; // the count never finishes faster than this, so it reads as a count
const MAX_MS = 9000; // ...and never waits longer than this

const pad3 = (n: number) => String(n).padStart(3, "0");

/** waitForHero: count the home page's 3D hero in (it reports its loading steps through lib/skullReady) */
export default function Preloader({ waitForHero = false }: { waitForHero?: boolean }) {
  const [phase, setPhase] = useState<Phase>("loading");
  const [pct, setPct] = useState(0);
  const [frame, setFrame] = useState(0);
  const loaded = useRef(0);
  const releaseScroll = useRef<(() => void) | null>(null);

  // loading: the 3D hero (when there is one) and the fonts
  useEffect(() => {
    const parts = { hero: waitForHero ? 0 : 1, fonts: 0 };
    const update = () => (loaded.current = (2 * parts.hero + parts.fonts) / 3);
    const unsubscribe = waitForHero
      ? onSkullProgress((p) => {
          parts.hero = Math.max(parts.hero, p);
          update();
        })
      : () => {};
    if (waitForHero) skullReadyPromise.then(() => ((parts.hero = 1), update()));
    const fontsDone = () => ((parts.fonts = 1), update());
    (document.fonts?.ready ?? Promise.resolve()).then(fontsDone, fontsDone);
    update();
    const start = performance.now();
    let shown = 0;
    let raf = 0;
    let leave: ReturnType<typeof setTimeout> | undefined;
    const loop = (now: number) => {
      const elapsed = now - start;
      const goal = elapsed > MAX_MS ? 1 : Math.min(loaded.current, elapsed / MIN_MS);
      shown += (goal - shown) * 0.12;
      if (goal >= 1 && shown > 0.995) {
        setPct(100);
        // a beat on 100, then in
        leave = setTimeout(() => {
          markRevealed();
          setPhase("gone");
        }, 300);
        return;
      }
      setPct(Math.floor(shown * 100));
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(leave);
      unsubscribe();
    };
  }, [waitForHero]);

  // the page underneath doesn't scroll until the preloader has faded out (or is swapped out mid-count)
  useEffect(() => {
    const release = holdScroll();
    releaseScroll.current = release;
    return release;
  }, []);

  // the little image box flickers through the work and the music; faster in the build-up
  useEffect(() => {
    if (phase === "gone") return;
    const id = setInterval(() => setFrame((f) => (f + 1) % FLICKER.length), 120);
    return () => clearInterval(id);
  }, [phase]);

  return (
    <AnimatePresence onExitComplete={() => releaseScroll.current?.()}>
      {phase !== "gone" && (
        <motion.div
          key="preloader"
          data-scroll-lock
          className="fixed inset-0 z-[2000] flex items-center justify-center bg-ink text-bone"
          exit={{ opacity: 0, transition: { duration: 0.45 } }}
        >
          <div className="relative flex flex-col items-center gap-5">
            <div className="relative h-[72px] w-[54px] overflow-hidden bg-neutral-900">
              {FLICKER.map((src, i) => (
                <Image
                  key={src}
                  src={src}
                  alt=""
                  fill
                  sizes="108px"
                  priority={i < 3}
                  className={`object-cover grayscale contrast-125 ${i === frame ? "opacity-100" : "opacity-0"}`}
                />
              ))}
            </div>
            <p className="ui-txt">Akshat™</p>
            <p className="ui-txt tabular-nums text-bone/55">{pad3(pct)}</p>
          </div>

          <p className="ui-txt absolute inset-x-0 bottom-6 text-center text-bone/45">Software developer</p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
