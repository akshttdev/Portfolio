// "The intro is over, show the page": the preloader fires it on the drop (or when entering muted), the quick
// page wipe fires it straight away. Kept at module level, so later visits in the same session are revealed.

let revealed = false;
const listeners = new Set<() => void>();

export function markRevealed() {
  if (revealed) return;
  revealed = true;
  listeners.forEach((l) => l());
  listeners.clear();
}

export function onRevealed(listener: () => void): () => void {
  if (revealed) {
    listener();
    return () => {};
  }
  listeners.add(listener);
  return () => listeners.delete(listener);
}
