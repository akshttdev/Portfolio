"use client";

import { useSyncExternalStore } from "react";
import { musicStore, toggleMusic } from "@/lib/music";

/** "Sound on / off" with a little red EQ while it plays. */
export default function SoundToggle() {
  const { on } = useSyncExternalStore(musicStore.subscribe, musicStore.get, musicStore.getServer);
  return (
    <button type="button" onClick={toggleMusic} aria-pressed={on} className="flex cursor-pointer items-center gap-2 text-left">
      <span aria-hidden="true" className="flex h-3 items-end gap-[2px]">
        {[0, 0.25, 0.5, 0.15].map((d) => (
          <span
            key={d}
            className={`block h-full w-[2px] origin-bottom bg-blood ${on ? "eq-bar" : "eq-bar-static"}`}
            style={{ animationDelay: `${d}s` }}
          />
        ))}
      </span>
      <span>{on ? "Sound on" : "Sound off"}</span>
    </button>
  );
}
