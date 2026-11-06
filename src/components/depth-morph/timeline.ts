import { CFG } from "./config";
import { easeInOutCubic } from "@/lib/math";

/** Scroll length of the whole morph in screen heights: a hold on each slide, a transition between each pair. */
export const timelineSpan = (slides: number) => (slides - 1) * (1 + CFG.hold) + CFG.hold;

/** Which transition scroll position `s` (0..1) is in, and how far along it is (eased). */
export function slideAt(s: number, slides: number) {
  let i = s * timelineSpan(slides);
  for (let k = 0; k < slides - 1; k++) {
    if ((i -= CFG.hold) <= 0) return { index: k, progress: 0 };
    if (i < 1) return { index: k, progress: easeInOutCubic(i) };
    i -= 1;
  }
  return { index: slides - 2, progress: 1 };
}
