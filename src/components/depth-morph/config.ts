/**
 * One photo in the morph.
 * - focus: point to keep in frame when the photo is cropped to the screen, as [x, y] fractions from the
 *   top-left (default centre). Matters for portrait photos on landscape screens and vice versa.
 * - zoom: crop in further than "cover" (1 = default, 1.2 = 20% closer). Lets focus re-centre a subject even
 *   when the photo's full width/height would otherwise already be on screen.
 * - face: where the face is in the photo ({x, y} centre and h = face height, all fractions from the top-left).
 * - anchor: when set on one slide with a face, every other slide with a face is zoomed/shifted so the face
 *   lands at the same screen position and size as the anchor's, so the morph flows face-to-face.
 *   The anchor itself is shown un-zoomed (or at its own zoom), framed as close to centre as the photo allows.
 */
export type DepthSlide = {
  image: string;
  /** Grayscale depth map, white = near, same framing as the photo */
  depth: string;
  label: string;
  focus?: [number, number];
  zoom?: number;
  face?: { x: number; y: number; h: number };
  anchor?: boolean;
};

export const CFG = {
  hold: 0.35, // scroll rest between transitions, in screen heights
  parallax: 0.04,
  // soft cap on how far the cursor can push the depth effect: full response near the centre, easing off
  // toward the screen edges (1.0 at the edge maps to 0.6) so it never reaches the cut-out "paper" look
  parallaxLimit: 0.4,
  breath: 0.015,
  scrollEase: 0.08, // only used when Lenis isn't already smoothing the scroll
  mouseEase: 0.06,
  shift: { image: 0.014, title: 16 },
  idle: { delayMs: 1500, ax: 0.75, fx: 0.42, ay: 0.45, fy: 0.84, py: 0.6 },
  revealDelay: 0.7, // let the page-transition wipe finish first
  rim: [0.55, 0.06, 0.04] as const, // red glow on the dissolve edge
  maxPixels: 2560 * 1440, // render budget: photos + grain don't need full Retina resolution
  maxDpr: 1.5,
};
