"use client";

import { motion } from "framer-motion";
import { EASE_OUT_CUBIC } from "@/animations/anim";

const COLUMNS = 6;

/**
 * Page-enter transition: black columns slide off to the right one after another.
 * Animates transform (not left/width), so it runs on the compositor without relayout.
 */
export default function ColumnWipe() {
  return (
    <div
      aria-hidden="true"
      className="fixed top-0 left-0 w-screen h-screen grid grid-cols-6 z-[1000] pointer-events-none select-none overflow-hidden"
    >
      {Array.from({ length: COLUMNS }, (_, i) => (
        <div key={i} className="w-full h-full overflow-hidden">
          <motion.div
            className="w-full h-full bg-black"
            initial={{ x: "0%" }}
            animate={{ x: "100%" }}
            transition={{ duration: 0.45, ease: EASE_OUT_CUBIC, delay: 0.07 * (i + 3) }}
          />
        </div>
      ))}
    </div>
  );
}
