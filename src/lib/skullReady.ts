let resolveReady: (() => void) | null = null;
let progress = 0;
const listeners = new Set<(p: number) => void>();

export const skullReadyPromise: Promise<void> = new Promise((resolve) => {
  resolveReady = resolve;
});

/** How far the 3D hero has got, 0..1 (the preloader counts along with it). Only ever goes up. */
export function setSkullProgress(p: number): void {
  if (p <= progress) return;
  progress = Math.min(p, 1);
  listeners.forEach((listener) => listener(progress));
}

/** Calls `listener` with the current progress right away, then on every step. Returns an unsubscribe. */
export function onSkullProgress(listener: (p: number) => void): () => void {
  listeners.add(listener);
  listener(progress);
  return () => {
    listeners.delete(listener);
  };
}

export function markSkullReady(): void {
  setSkullProgress(1);
  if (resolveReady) {
    resolveReady();
    resolveReady = null;
  }
}
