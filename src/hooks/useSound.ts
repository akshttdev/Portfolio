"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { soundStore } from "@/lib/sound";
import { onRevealed } from "@/lib/intro";

/** The site player's state (sound on/off, which track). */
export function useSound() {
  return useSyncExternalStore(soundStore.subscribe, soundStore.get, soundStore.getServer);
}

/** True once the intro is over (see lib/intro). */
export function useRevealed() {
  const [revealed, setRevealed] = useState(false);
  useEffect(() => onRevealed(() => setRevealed(true)), []);
  return revealed;
}
