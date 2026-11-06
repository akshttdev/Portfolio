/**
 * A video cut into still frames on disk: `${dir}/lg/00.webp`, `01.webp`, … (full frame, for wide screens) and
 * `${dir}/sm/…` (portrait crops that follow the subject, for phones). Plain data so a server page can pass it.
 */
export type FrameSequence = { dir: string; count: number; fps: number };

export const SMALL_SCREEN = "(max-width: 767px)";

export const frameUrl = (seq: FrameSequence, i: number, small: boolean) =>
  `${seq.dir}/${small ? "sm" : "lg"}/${String(i).padStart(2, "0")}.webp`;

/** Every 8th frame first, then every 4th, 2nd, the rest: a fast scroll shows a coarse clip instead of a frozen one. */
function loadOrder(count: number): number[] {
  const order: number[] = [];
  const queued = new Uint8Array(count);
  for (let step = 8; step >= 1; step >>= 1) {
    for (let i = 0; i < count; i += step) {
      if (queued[i]) continue;
      queued[i] = 1;
      order.push(i);
    }
  }
  return order;
}

/**
 * Loads the frames a few at a time, decoding each before reporting it so drawing it never stalls a frame.
 * Returns a cancel function.
 */
export function loadFrames(urls: string[], onLoad: (i: number, img: HTMLImageElement) => void, parallel = 6) {
  const queue = loadOrder(urls.length);
  let cancelled = false;
  let active = 0;

  const pump = () => {
    while (!cancelled && active < parallel && queue.length) {
      const i = queue.shift()!;
      const img = new Image();
      img.src = urls[i];
      active++;
      img
        .decode()
        .then(() => !cancelled && onLoad(i, img))
        .catch(() => {}) // a missing frame just falls back to its nearest neighbour
        .finally(() => {
          active--;
          pump();
        });
    }
  };

  pump();
  return () => {
    cancelled = true;
  };
}

/** The loaded frame closest to i (earlier one first on a tie), or -1 if none is loaded yet. */
export function nearestLoaded(frames: (HTMLImageElement | undefined)[], i: number): number {
  for (let d = 0; d < frames.length; d++) {
    if (frames[i - d]) return i - d;
    if (frames[i + d]) return i + d;
  }
  return -1;
}

/** Draws an image over the whole canvas like object-fit: cover. */
export function drawCover(ctx: CanvasRenderingContext2D, img: HTMLImageElement) {
  const { width: w, height: h } = ctx.canvas;
  const s = Math.max(w / img.naturalWidth, h / img.naturalHeight);
  const dw = img.naturalWidth * s;
  const dh = img.naturalHeight * s;
  ctx.drawImage(img, (w - dw) / 2, (h - dh) / 2, dw, dh);
}

/** Camera-style timecode for a frame: "00:01:12" (minutes : seconds : frames). */
export function timecode(i: number, fps: number): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  const s = Math.floor(i / fps);
  return `${pad(Math.floor(s / 60))}:${pad(s % 60)}:${pad(i % fps)}`;
}
