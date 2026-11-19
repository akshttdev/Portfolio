"use client";

/**
 * /rotation: the ring of favourite tracks, the whole page. The wheel (either direction), a drag or the arrow
 * keys spin it, endlessly, and it settles on a track like a magnet; the track at the top (or under the cursor)
 * fills the screen with its cover and, with sound on, its drop plays, coming in on the beat of the one before.
 */

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import Orbit from "@/components/orbit/Orbit";
import { SETS, TRACKS } from "@/data/music";
import { disable, enable, play } from "@/lib/sound";
import { useSound } from "@/hooks/useSound";

const pad = (n: number) => String(n).padStart(2, "0");

export default function MusicOrbit() {
  const [activeId, setActiveId] = useState(TRACKS[0].id);
  const [revealed, setRevealed] = useState(false);
  const sound = useSound();
  const items = useMemo(() => TRACKS.map((t) => ({ id: t.id, title: t.title, thumb: t.cover, image: t.art })), []);
  const index = Math.max(0, TRACKS.findIndex((t) => t.id === activeId));
  const track = TRACKS[index];

  // fly the ring out once the page-enter wipe has cleared
  useEffect(() => {
    const t = setTimeout(() => setRevealed(true), 450);
    return () => clearTimeout(t);
  }, []);

  // leaving the page stops the music
  useEffect(() => () => disable(), []);

  // The selected track plays (once things settle). Not on mount: whatever is already playing keeps going.
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    const t = setTimeout(() => void play(track), 150);
    return () => clearTimeout(t);
  }, [track]);

  // Clicking a cover is a request to hear it: turn sound on (the ring brings it round to the top itself)
  const pick = (id: string) => {
    if (!sound.enabled) void enable(TRACKS.find((t) => t.id === id)!);
    setActiveId(id);
  };

  return (
    <section aria-label="Music: the drops I keep coming back to" className="relative bg-ink">
      <div className="h-svh">
        <Orbit
          items={items}
          repeat={2}
          mode="wheel"
          tick={false}
          thumb={{ w: 32, h: 32 }}
          activeId={activeId}
          onActive={setActiveId}
          onPick={pick}
          revealed={revealed}
          label="Favourite tracks"
          overlay={
            <div className="ui-txt pointer-events-none absolute inset-x-5 bottom-5 z-10 flex items-end justify-between gap-6 md:inset-x-8 md:bottom-7">
              <span className="pointer-events-auto tabular-nums text-bone/60">
                <Link href="/" className="mr-4 transition-colors hover:text-bone">
                  ← Back
                </Link>
                (Scroll or drag, it never ends) {pad(index + 1)} / {pad(TRACKS.length)}
              </span>
              <span className="pointer-events-auto flex flex-wrap justify-end gap-x-4 gap-y-1">
                <span className="text-bone/60">Full sets</span>
                {SETS.map((s) => (
                  <a key={s.url} href={s.url} target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-blood">
                    {s.label} ↗
                  </a>
                ))}
              </span>
            </div>
          }
        >
          <div className="ui-txt max-w-[min(90vw,40rem)] text-center text-[14px] text-white md:text-[16px] [text-shadow:0_0_18px_rgba(0,0,0,.9),0_1px_3px_rgba(0,0,0,.8)]">
            <p className="flex flex-wrap items-baseline justify-center gap-x-[0.9em] gap-y-1">
              <span>On rotation</span>
              <span className="underline decoration-1 underline-offset-[3px]">{track.title}.</span>
              <span>{track.artist}</span>
              
            </p>
            <button
              type="button"
              onClick={() => (sound.enabled ? disable() : void enable(track))}
              className="mt-4 cursor-pointer border border-white/70 bg-black/30 px-3 py-1.5 text-[12px] text-white transition-colors hover:bg-white hover:text-ink"
            >
              {sound.enabled ? (sound.loading ? "Loading…" : "Mute") : "Play the drops"}
            </button>
          </div>
        </Orbit>
      </div>
    </section>
  );
}
