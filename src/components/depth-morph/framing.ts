import { clamp } from "@/lib/math";

/** A slide once its textures are on the GPU. Points are in texture space: x from the left, y from the bottom. */
export type LoadedSlide = {
  img: WebGLTexture;
  depth: WebGLTexture;
  aspect: number;
  focus: [number, number];
  zoom: number;
  face: [x: number, y: number, h: number] | null;
};

export type Framing = { center: [number, number]; zoom: number };

/** Visible fraction of an image per axis at plain object-fit: cover. */
const coverFraction = (planeAspect: number, imgAspect: number): [number, number] =>
  planeAspect > imgAspect ? [1, imgAspect / planeAspect] : [planeAspect / imgAspect, 1];

/** Where the anchor's face ends up on screen (uv, from bottom-left) and how tall it is (fraction of screen). */
function anchorTarget(anchor: LoadedSlide, planeAspect: number) {
  if (!anchor.face) return null;
  const [sx, sy] = coverFraction(planeAspect, anchor.aspect);
  const kx = sx / anchor.zoom;
  const ky = sy / anchor.zoom;
  const want = [0.5, 0.58]; // try to centre it, a little above the middle
  const cx = clamp(anchor.face[0] - (want[0] - 0.5) * kx, kx / 2, 1 - kx / 2);
  const cy = clamp(anchor.face[1] - (want[1] - 0.5) * ky, ky / 2, 1 - ky / 2);
  return { x: (anchor.face[0] - cx) / kx + 0.5, y: (anchor.face[1] - cy) / ky + 0.5, h: anchor.face[2] / ky };
}

/** Crop centre + zoom for a slide on the current screen. With an anchor, faces line up with the anchor's. */
export function frameSlide(slide: LoadedSlide, anchor: LoadedSlide | null, planeAspect: number): Framing {
  const target = anchor ? anchorTarget(anchor, planeAspect) : null;
  if (!slide.face || !target) return { center: slide.focus, zoom: slide.zoom };
  const [sx, sy] = coverFraction(planeAspect, slide.aspect);
  // zoom so the face matches the anchor's size; never below "cover" (that would expose the photo's edges)
  const zoom = slide === anchor ? slide.zoom : clamp((target.h * sy) / slide.face[2], 1, 2.2);
  const kx = sx / zoom;
  const ky = sy / zoom;
  return { center: [slide.face[0] - (target.x - 0.5) * kx, slide.face[1] - (target.y - 0.5) * ky], zoom };
}
