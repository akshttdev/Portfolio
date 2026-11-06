import { CFG } from "./config";
import { clamp, easeOutCubic } from "@/lib/math";

/** Title letters rise in from the centre outward, then lift away during the first morph. */
export function createTitleAnimator(titleEl: HTMLElement) {
  const letters = Array.from(titleEl.children) as HTMLElement[];
  // each letter's centre as a fraction of the title width
  let centres = letters.map(() => 0.5);

  return {
    measure() {
      const tb = titleEl.getBoundingClientRect();
      if (!tb.width) return;
      centres = letters.map((l) => {
        const r = l.getBoundingClientRect();
        return (r.left + r.width / 2 - tb.left) / tb.width;
      });
    },

    /** `away` is 0..1 through the first morph; `time` is seconds since the stage started. */
    update(mouse: { x: number; y: number }, away: number, time: number, still: boolean) {
      const shift = CFG.shift.title;
      titleEl.style.transform = `translate3d(${-mouse.x * shift}px, ${mouse.y * shift * 0.6}px, 0)`;
      letters.forEach((el, i) => {
        const c = centres[i];
        const n = 2 * Math.abs(c - 0.5); // 0 at the centre, 1 at the ends
        const out = clamp((away - n * 0.35) / 0.5);
        const drift = (c - 0.5) * 2 * out * 0.25;
        const inn = still ? 1 : easeOutCubic((time - (CFG.revealDelay + 0.4 + n * 0.3)) / 0.8);
        el.style.transform = `translate(${drift}em, ${(-out + 1 - inn) * 110}%)`;
      });
    },
  };
}
