"use client";

/**
 * "On the decks": the DJ sets on SoundCloud, as rows with each set's real waveform. They play right here, through
 * SoundCloud's hidden embed player (lib/soundcloud).
 *  - scrolling in, every waveform grows out of a flat line, left to right, one row after another
 *  - hovering a waveform previews a scrub (red up to the cursor, with the time there)
 *  - clicking the cover plays / pauses the set; clicking the waveform plays it from that point
 *  - the playing row opens into a deck view, like rekordbox:
 *      the thin overview on top is the whole set: click or drag on it to go anywhere
 *      the big waveform under it is zoomed in and keeps coming in from the right toward a fixed playhead in the
 *      centre: drag it (or swipe sideways on a trackpad) to nudge the position, the wave follows the hand
 *  - the title opens the set on SoundCloud; a small link under the list goes to the tracks on rotation
 * The waveforms are drawn on a canvas, and only animate while something is moving.
 */

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useSyncExternalStore } from "react";
import { DJ_SETS, SOUNDCLOUD_PROFILE, type DjSet } from "@/data/sets";
import { deckStore, pauseAll, positionMs, seek, toggleSet, warmUp } from "@/lib/soundcloud";
import { clamp, easeOutCubic } from "@/lib/math";

const BLOOD = "#e1251b";
const EMBER = "#7a120c";
const BONE = "#efefef";
const BONE_DIM = "rgba(239, 239, 239, 0.28)";
/** seconds of the set visible across the zoomed waveform: with the detailed 3-band data, and without it */
const WINDOW_DETAILED_S = 16;
const WINDOW_COARSE_S = 60;
/** points per second in public/sets/<id>.bin (scripts/sets/waves.py) */
const BANDS_PER_SEC = 50;
const LOW = "#a3170f";
const MID = "#ff5a3c";
const OVERVIEW_H = 18;
const GAP = 10;

const pad = (n: number) => String(n).padStart(2, "0");
const clock = (s: number) => `${pad(Math.floor(s / 60))}:${pad(Math.floor(s % 60))}`;

export default function OnTheDecks() {
  const sectionRef = useRef<HTMLElement>(null);

  // load SoundCloud's player when the section comes near; stop the music when leaving the page
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        warmUp(DJ_SETS[0].url);
        io.disconnect();
      },
      { rootMargin: "100% 0px" },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      pauseAll();
    };
  }, []);

  return (
    <section ref={sectionRef} aria-label="On the decks: DJ sets" className="relative w-full px-6 pb-40 pt-24 md:px-20 md:pb-56">
      <div className="flex items-start justify-between gap-6">
        {/* same heading as PROJECTS (n), the year one step down and right */}
        <div className="relative inline-flex items-baseline gap-x-2">
          <h2 className="project-txt">On the decks</h2>
          <span className="project-length-txt">({DJ_SETS.length})</span>
          <span className="project-year-count-txt absolute left-full top-full ml-1 mt-1 whitespace-nowrap">2026</span>
        </div>
        <a href={SOUNDCLOUD_PROFILE} target="_blank" rel="noopener noreferrer" className="para-txt text-bone/60 transition-colors hover:text-bone">
          SoundCloud ↗
        </a>
      </div>

      <ol className="mt-20 border-t border-bone/10 md:mt-28">
        {DJ_SETS.map((set, i) => (
          <SetRow key={set.id} set={set} index={i} />
        ))}
      </ol>

      <Link href="/rotation" className="para-txt mt-8 inline-block text-bone/50 transition-colors hover:text-bone">
        Tracks on rotation →
      </Link>
    </section>
  );
}

function SetRow({ set, index }: { set: DjSet; index: number }) {
  const rowRef = useRef<HTMLLIElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const timeRef = useRef<HTMLSpanElement>(null);
  const deck = useSyncExternalStore(deckStore.subscribe, deckStore.get, deckStore.getServer);
  const active = deck.url === set.url;
  const playing = active && deck.playing;
  const loading = active && deck.loading;
  const blocked = active && deck.blocked;

  // for the frame loop
  const live = useRef({ active, playing });
  live.current = { active, playing };
  const kickRef = useRef<() => void>(() => {});
  const detail = useRef<number[] | null>(null);
  /** low/mid/high peaks, 3 bytes per point, when public/sets/<id>.bin exists */
  const bands = useRef<Uint8Array | null>(null);

  // the detailed waveform for the deck view, fetched the first time this set is played: the 3-band file made
  // from the audio if there is one, otherwise SoundCloud's coarse waveform
  useEffect(() => {
    if (!active || detail.current || bands.current) return;
    let cancelled = false;
    fetch(`/sets/${set.id}.bin`)
      .then((r) => (r.ok ? r.arrayBuffer() : Promise.reject()))
      .then((buf) => {
        if (!cancelled) bands.current = new Uint8Array(buf);
      })
      .catch(() =>
        fetch(`/sets/${set.id}.json`)
          .then((r) => r.json())
          .then((d: { samples: number[] }) => {
            if (!cancelled) detail.current = d.samples;
          }),
      )
      .catch(() => {})
      .finally(() => kickRef.current());
    return () => {
      cancelled = true;
    };
  }, [active, set.id]);

  // redraw when this row starts / stops being the deck (also after its height transition)
  useEffect(() => {
    kickRef.current();
  }, [active, playing]);

  useEffect(() => {
    const row = rowRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!row || !canvas || !ctx) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const peaks = set.peaks;
    const N = peaks.length;
    let W = 0;
    let H = 0;
    let dpr = 1;
    let revealAt = -1; // ms; -1 = not on screen yet (a flat line)
    let head = 0; // hover preview, 0..1
    let target = 0;
    let raf = 0;
    let running = false;

    /**
     * A filled, mirrored, smooth waveform through the points `pts` (x, amplitude 0..1 pairs), like a deck's display
     * (not bars). `shape` turns an amplitude into a half-height fraction.
     */
    const fillWave = (pts: number[], mid: number, half: number, shape: (a: number) => number) => {
      const n = pts.length / 2;
      if (n < 2) return;
      const y = (i: number, sign: number) => mid + sign * Math.max(0.5, shape(pts[i * 2 + 1]) * half);
      ctx.beginPath();
      ctx.moveTo(pts[0], y(0, -1));
      for (let i = 1; i < n; i++) {
        ctx.quadraticCurveTo(pts[(i - 1) * 2], y(i - 1, -1), (pts[(i - 1) * 2] + pts[i * 2]) / 2, (y(i - 1, -1) + y(i, -1)) / 2);
      }
      ctx.lineTo(pts[(n - 1) * 2], y(n - 1, -1));
      ctx.lineTo(pts[(n - 1) * 2], y(n - 1, 1));
      for (let i = n - 1; i > 0; i--) {
        ctx.quadraticCurveTo(pts[i * 2], y(i, 1), (pts[(i - 1) * 2] + pts[i * 2]) / 2, (y(i - 1, 1) + y(i, 1)) / 2);
      }
      ctx.lineTo(pts[0], y(0, 1));
      ctx.closePath();
      ctx.fill();
    };
    const same = (a: number) => a;

    /** the whole set as bars (SoundCloud's look), red up to `upTo`; returns true while the reveal is still growing */
    const drawWhole = (now: number, y0: number, h0: number, upTo: number, grow: boolean) => {
      const step = W / N;
      const bw = Math.max(1, step * 0.55);
      let growing = false;
      for (let i = 0; i < N; i++) {
        const t = !grow || reduced ? 1 : revealAt < 0 ? 0 : easeOutCubic((now - revealAt - i * 5) / 650);
        if (t < 1) growing = true;
        const h = Math.max(1, (peaks[i] / 99) * h0 * t);
        ctx.fillStyle = (i + 0.5) / N <= upTo ? BLOOD : BONE_DIM;
        ctx.fillRect(i * step, y0 + (h0 - h) / 2, bw, h);
      }
      if (upTo > 0.002) {
        ctx.fillStyle = BONE;
        ctx.fillRect(Math.min(upTo * W, W - 1), y0, 1, h0);
      }
      return growing;
    };

    const windowS = () => (bands.current ? WINDOW_DETAILED_S : WINDOW_COARSE_S);

    /** deck view: overview on top, zoomed waveform scrolling under a centre playhead */
    const drawDeck = (now: number) => {
      const t = Math.min(positionMs() / 1000, set.seconds);
      drawWhole(now, 0, OVERVIEW_H, Math.max(t / set.seconds, 0.003), false);

      const y0 = OVERVIEW_H + GAP;
      const zh = H - y0;
      const mid = y0 + zh / 2;
      const pxPerS = W / windowS();
      const B = bands.current;
      if (B) {
        // one column per pixel: the peak of each band in the time that pixel covers. Lows are the wide deep-red
        // body, mids orange-red inside it, highs white on top (a deck's blue / orange / white, in the site's colours)
        const total = B.length / 3;
        const colors = [LOW, MID, BONE];
        const cols = Math.ceil(W);
        const heights = new Float32Array(cols * 3);
        for (let x = 0; x < cols; x++) {
          const a = Math.floor((t + (x - W / 2) / pxPerS) * BANDS_PER_SEC);
          const b = Math.max(a + 1, Math.floor((t + (x + 1 - W / 2) / pxPerS) * BANDS_PER_SEC));
          if (b <= 0 || a >= total) continue;
          for (let i = Math.max(0, a); i < Math.min(total, b); i++) {
            for (let k = 0; k < 3; k++) if (B[i * 3 + k] > heights[x * 3 + k]) heights[x * 3 + k] = B[i * 3 + k];
          }
        }
        for (let k = 0; k < 3; k++) {
          ctx.fillStyle = colors[k];
          for (let x = 0; x < cols; x++) {
            const h = (heights[x * 3 + k] / 255) * zh;
            if (h > 0.5) ctx.fillRect(x, mid - h / 2, 1, h);
          }
        }
      } else {
        const data = detail.current ?? peaks;
        const dt = set.seconds / data.length;
        const first = Math.max(0, Math.floor((t - windowS() / 2) / dt) - 1);
        const last = Math.min(data.length - 1, Math.ceil((t + windowS() / 2) / dt) + 1);
        const pts: number[] = [];
        for (let i = first; i <= last; i++) pts.push(W / 2 + (i * dt - t) * pxPerS, data[i] / 99);
        ctx.fillStyle = EMBER;
        fillWave(pts, mid, zh / 2, same);
        ctx.fillStyle = BLOOD;
        fillWave(pts, mid, zh / 2, (a) => 0.72 * a ** 1.4);
        ctx.fillStyle = BONE;
        fillWave(pts, mid, zh / 2, (a) => 0.36 * a ** 3.2);
      }
      // what has played is dimmed
      ctx.fillStyle = "rgba(5, 5, 5, 0.55)";
      ctx.fillRect(0, y0, W / 2, zh);
      ctx.fillStyle = BONE;
      ctx.fillRect(Math.round(W / 2), y0, 1, zh);
      return t;
    };

    const frame = (now: number) => {
      const L = live.current;
      head += (target - head) * (reduced ? 1 : 0.2);
      if (Math.abs(target - head) < 0.0005) head = target;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      let growing = false;
      let label: string;
      if (L.active) {
        label = `${clock(drawDeck(now))} / ${clock(set.seconds)}`;
      } else {
        growing = drawWhole(now, 0, H, head, true);
        label = head > 0.002 ? `${clock(head * set.seconds)} / ${clock(set.seconds)}` : clock(set.seconds);
      }
      if (timeRef.current) timeRef.current.textContent = label;
      if (growing || head !== target || (L.active && L.playing)) raf = requestAnimationFrame(frame);
      else running = false;
    };
    const kick = () => {
      if (running) return;
      running = true;
      raf = requestAnimationFrame(frame);
    };
    kickRef.current = kick;

    const size = () => {
      const r = canvas.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = r.width;
      H = r.height;
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      kick();
    };
    const ro = new ResizeObserver(size);
    ro.observe(canvas);

    // grow in when the row comes into view (the rows below follow a little later)
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        revealAt = performance.now() + index * 140;
        kick();
        io.disconnect();
      },
      { threshold: 0.5 },
    );
    io.observe(row);

    const fracAt = (e: { clientX: number }) => {
      const r = canvas.getBoundingClientRect();
      return clamp((e.clientX - r.left) / r.width);
    };
    const regionAt = (e: { clientY: number }) => (e.clientY - canvas.getBoundingClientRect().top < OVERVIEW_H + GAP / 2 ? "overview" : "zoom");

    // deck view: the overview goes anywhere in the set; dragging the big wave moves it under the playhead
    let drag: { region: "overview" | "zoom"; x0: number; t0: number } | null = null;
    const onDown = (e: PointerEvent) => {
      if (!live.current.active || e.button !== 0) return;
      drag = { region: regionAt(e), x0: e.clientX, t0: positionMs() };
      canvas.setPointerCapture(e.pointerId);
      if (drag.region === "overview") seek(fracAt(e) * set.seconds * 1000);
      canvas.style.cursor = drag.region === "zoom" ? "grabbing" : "pointer";
      kick();
    };
    const onMove = (e: PointerEvent) => {
      if (drag) {
        if (drag.region === "overview") seek(fracAt(e) * set.seconds * 1000);
        else seek(clamp(drag.t0 - ((e.clientX - drag.x0) / (W / windowS())) * 1000, 0, set.seconds * 1000 - 500));
        kick();
        return;
      }
      if (live.current.active) {
        canvas.style.cursor = regionAt(e) === "zoom" ? "grab" : "pointer";
        return;
      }
      canvas.style.cursor = "pointer";
      if (e.pointerType !== "mouse") return;
      target = fracAt(e); // hover preview
      kick();
    };
    const onUp = () => {
      drag = null;
      canvas.style.cursor = "";
    };
    const onLeave = () => {
      target = 0;
      kick();
    };
    // sideways swipe (trackpad) / shift+wheel over the big wave nudges it too; vertical scrolling stays the page's
    const onWheel = (e: WheelEvent) => {
      if (!live.current.active || regionAt(e) !== "zoom") return;
      const d = e.shiftKey && !e.deltaX ? e.deltaY : e.deltaX;
      if (!d || (!e.shiftKey && Math.abs(e.deltaX) <= Math.abs(e.deltaY))) return;
      e.preventDefault();
      seek(clamp(positionMs() + (d / (W / windowS())) * 1000, 0, set.seconds * 1000 - 500));
      kick();
    };
    // a row that isn't playing: click plays it from that point
    const onClick = (e: MouseEvent) => {
      if (live.current.active) return;
      target = head = 0;
      toggleSet(set.url, fracAt(e) * set.seconds * 1000);
    };
    canvas.addEventListener("pointerdown", onDown);
    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerup", onUp);
    canvas.addEventListener("pointercancel", onUp);
    canvas.addEventListener("pointerleave", onLeave);
    canvas.addEventListener("wheel", onWheel, { passive: false });
    canvas.addEventListener("click", onClick);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      canvas.removeEventListener("pointerdown", onDown);
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerup", onUp);
      canvas.removeEventListener("pointercancel", onUp);
      canvas.removeEventListener("pointerleave", onLeave);
      canvas.removeEventListener("wheel", onWheel);
      canvas.removeEventListener("click", onClick);
    };
  }, [set, index]);

  return (
    <li
      ref={rowRef}
      className="group grid grid-cols-[3rem_1fr_auto] items-center gap-x-4 gap-y-4 border-b border-bone/10 py-5 md:grid-cols-[3.5rem_7rem_7rem_minmax(0,1fr)_8.5rem] md:gap-x-8 md:py-6"
    >
      <button
        type="button"
        onClick={() => toggleSet(set.url)}
        aria-label={`${playing ? "Pause" : "Play"} ${set.title}`}
        aria-pressed={playing}
        className="relative size-12 cursor-pointer overflow-hidden bg-neutral-900 md:size-14"
      >
        <Image
          src={set.cover}
          alt=""
          fill
          sizes="56px"
          className={`object-cover transition duration-500 group-hover:scale-110 ${active ? "" : "grayscale group-hover:grayscale-0"}`}
        />
        <span
          aria-hidden="true"
          className={`absolute inset-0 flex items-center justify-center bg-ink/50 transition-opacity duration-200 ${
            active ? "opacity-100" : "opacity-0 group-hover:opacity-100"
          }`}
        >
          {playing ? (
            <span className="flex gap-[4px]">
              <span className="block h-3.5 w-[3px] bg-bone" />
              <span className="block h-3.5 w-[3px] bg-bone" />
            </span>
          ) : (
            <span className="ml-0.5 block border-y-[7px] border-l-[11px] border-y-transparent border-l-bone" />
          )}
        </span>
      </button>

      <a
        href={set.url}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`${set.title} on SoundCloud`}
        className={`project-txt transition-colors hover:text-blood ${active ? "text-blood" : ""}`}
      >
        {set.title}
      </a>
      <span className="para-txt text-bone/60 max-md:hidden">{set.genre}</span>
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className={`col-span-3 w-full cursor-pointer touch-pan-y transition-[height] duration-300 max-md:order-last md:col-span-1 ${
          active ? "h-28 md:h-32" : "h-9 md:h-12"
        }`}
      />
      <span className="para-txt text-right tabular-nums text-bone/70">
        {blocked ? (
          <a href={set.url} target="_blank" rel="noopener noreferrer" className="underline hover:text-bone">
            Play on SoundCloud ↗
          </a>
        ) : loading ? (
          "Loading…"
        ) : (
          <span ref={timeRef}>{clock(set.seconds)}</span>
        )}
      </span>
    </li>
  );
}
