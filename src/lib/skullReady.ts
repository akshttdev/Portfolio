let resolveReady: (() => void) | null = null;

export const skullReadyPromise: Promise<void> = new Promise((resolve) => {
  resolveReady = resolve;
});

export function markSkullReady(): void {
  if (resolveReady) {
    resolveReady();
    resolveReady = null;
  }
}
