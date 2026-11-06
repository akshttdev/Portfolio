import type { Variants } from "framer-motion";

export type Bezier = [number, number, number, number];

export const EASE_OUT: Bezier = [0.33, 1, 0.68, 1];
export const EASE_IN_OUT: Bezier = [0.65, 0, 0.35, 1];
/** easeOutCubic (GSAP's power3.out) */
export const EASE_OUT_CUBIC: Bezier = [0.215, 0.61, 0.355, 1];

export const arraySlideUpAnimation: Variants = {
  initial: { y: "175%" },
  animate: (i: number) => ({
    y: "0",
    transition: { duration: 0.5, ease: EASE_OUT, delay: i * 0.05 },
  }),
  exit: { y: "175%" },
};

export const spanAnimation: Variants = {
  initial: { opacity: 0, y: 100 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: EASE_OUT, delay: 0.8 },
  },
  exit: { opacity: 0, y: 100 },
};
