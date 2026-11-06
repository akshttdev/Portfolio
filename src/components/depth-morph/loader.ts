import type { DepthSlide } from "./config";
import type { LoadedSlide } from "./framing";
import type { MorphRenderer } from "./renderer";

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.decoding = "async";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load ${src}`));
    img.src = src;
  });
}

/** Downloads a slide's photo + depth map and uploads them as textures (skipped if `cancelled()` by then). */
export async function loadSlide(
  renderer: MorphRenderer,
  slide: DepthSlide,
  cancelled: () => boolean,
): Promise<LoadedSlide> {
  const [img, depth] = await Promise.all([loadImage(slide.image), loadImage(slide.depth)]);
  if (cancelled()) throw new Error("disposed");
  const [fx, fy] = slide.focus ?? [0.5, 0.5];
  // Textures are uploaded flipped, so y is measured from the bottom from here on
  return {
    img: renderer.createTexture(img),
    depth: renderer.createTexture(depth),
    aspect: img.naturalWidth / img.naturalHeight,
    focus: [fx, 1 - fy],
    zoom: Math.max(1, slide.zoom ?? 1),
    face: slide.face ? [slide.face.x, 1 - slide.face.y, slide.face.h] : null,
  };
}
