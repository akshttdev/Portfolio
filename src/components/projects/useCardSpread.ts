"use client";

import { useSyncExternalStore } from "react";

// How far (px) the project cards drift sideways while scrolling, by max screen width. 0 = no drift.
const SPREAD: [maxWidth: number, px: number][] = [
  [768, 0],
  [820, 100],
  [1024, 150],
  [1200, 200],
  [1400, 250],
];
const WIDE = 500;
const QUERIES = SPREAD.map(([w]) => `(max-width: ${w}px)`);

function subscribe(onChange: () => void) {
  const lists = QUERIES.map((q) => window.matchMedia(q));
  lists.forEach((l) => l.addEventListener("change", onChange));
  return () => lists.forEach((l) => l.removeEventListener("change", onChange));
}

function getSpread() {
  const i = QUERIES.findIndex((q) => window.matchMedia(q).matches);
  return i < 0 ? WIDE : SPREAD[i][1];
}

/** Sideways drift for the project cards on this screen size (one hook instead of five media queries). */
export function useCardSpread(): number {
  return useSyncExternalStore(subscribe, getSpread, () => WIDE);
}
