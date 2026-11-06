"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

/** Fades its content in while rising 40px, once, on mount. */
export default function FadeUp({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className={className}>
      {children}
    </motion.div>
  );
}
