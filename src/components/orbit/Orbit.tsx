"use client";

/**
 * A ring of small thumbnails around the centre of the screen, over a horizontal filmstrip of big images.
 * The ring ticks from slot to slot like a clock hand (a quick snap, not a glide). The thumbnail at the top (or the last one hovered) is
 * active: the strip slides so its image sits in the middle, with its neighbours coming in from the left and right (zoomed in and darker the further out they are,
 * which gives the strip some depth). The centre line names it.
 *
 *  - mode "wheel": the ring is the whole page; the wheel, a drag or the arrow keys spin it (it snaps to items)
 *  - mode "scroll": the ring sits in a sticky stage and the page scroll spins it (`progress`, 0..1)
 *
 * Positions are written straight to the DOM every frame (no React render per frame); React only re-renders
 * when the active item changes.
 */

import Image from "next/image";
import { useEffect, useMemo, useRef, type ReactNode, type RefObject } from "react";
import { clamp, easeOutCubic } from "@/lib/math";

export type OrbitItem = {
  id: string;
  title: string;
  /** small image for the ring */
  thumb: string;
  /** big image for the strip */
  image: string;
};

type Props = {
  items: OrbitItem[];
  /** how many times the items go round the ring (a few items look lonely on a big ring) */
  repeat?: number;
  mode: "wheel" | "scroll";
  /** scroll mode: 0..1, read every frame */
  progress?: RefObject<number>;
  /** thumbnail size on desktop, px */
  thumb: { w: number; h: number };
  activeId: string | null;
  onActive: (id: string) => void;
  /** click / Enter on a thumbnail */
  onPick?: (id: string, index: number) => void;
  /** false: the ring glides instead of ticking from slot to slot, and settles on an item quickly (a magnet) */
  tick?: boolean;
  /** start the fly-out intro */
  revealed: boolean;
  label: string;
  /** the centre line */
  children?: ReactNode;
  /** extra UI on the stage (corners) */
  overlay?: ReactNode;
};

const TAU = Math.PI * 2;
const mod = (a: number, n: number) => ((a % n) + n) % n;
/** a - b on a circle of n, in [-n/2, n/2) */
const wrapDiff = (a: number, b: number, n: number) => mod(a - b + n / 2, n) - n / 2;

export default function Orbit({ items, repeat = 1, mode, progress, thumb, activeId, onActive, onPick, tick = true, revealed, label, children, overlay }: Props) {
  const stageRef = useRef<HTMLDivElement>(null);
  const thumbRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const panelRefs = useRef<(HTMLDivElement | null)[]>([]);
  const imgRefs = useRef<(HTMLDivElement | null)[]>([]);
  const shadeRefs = useRef<(HTMLDivElement | null)[]>([]);
  const toneRefs = useRef<(HTMLDivElement | null)[]>([]);
  const all = useMemo(() => Array.from({ length: items.length * repeat }, (_, i) => items[i % items.length]), [items, repeat]);
  const N = all.length;
  const step = TAU / N;

  // latest props for the animation loop
  const live = useRef({ activeId, onActive, mode, revealed, tick });
  live.current = { activeId, onActive, mode, revealed, tick };

  const st = useRef({
    rot: 0,
    target: 0,
    /** strip position, in items (follows the ring, or the hovered item) */
    strip: 0,
    hoverIndex: -1,
    interacted: mode === "scroll",
    activeIndex: -1,
    lastActiveId: null as string | null,
    /** spinning to an item chosen elsewhere: don't activate the items passing the top on the way */
    programmatic: false,
    lastTop: -1,
    revealAt: -1,
    radius: 300,
    scale: 1,
    width: 1000,
    small: false,
    dragging: false,
    dragged: false,
    /** last real mouse movement over the stage, ms */
    lastMouseMove: -1e9,
    /** the ring's shown slot: steps to the next slot with a quick snap, like a clock hand */
    tick: 0,
  });

  // wheel / drag / keys (wheel mode)
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage || mode !== "wheel") return;
    const m = st.current;
    let snapTimer: ReturnType<typeof setTimeout> | undefined;
    const snap = () => {
      clearTimeout(snapTimer);
      snapTimer = setTimeout(() => (m.target = Math.round(m.target / step) * step), live.current.tick ? 320 : 110);
    };
    const takeOver = () => {
      m.interacted = true;
      m.programmatic = false;
      m.hoverIndex = -1;
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      takeOver();
      const d = Math.abs(e.deltaY) > Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
      const px = e.deltaMode === 1 ? d * 16 : d;
      m.target -= clamp(px, -120, 120) * (step / 110);
      snap();
    };

    let start = { a: 0, target: 0, x: 0, y: 0 };
    let pointerId = -1;
    const angleAt = (x: number, y: number) => {
      const r = stage.getBoundingClientRect();
      return Math.atan2(y - (r.top + r.height / 2), x - (r.left + r.width / 2));
    };
    const onDown = (e: PointerEvent) => {
      if (e.button !== 0) return;
      pointerId = e.pointerId;
      m.dragged = false;
      start = { a: angleAt(e.clientX, e.clientY), target: m.target, x: e.clientX, y: e.clientY };
    };
    const onMove = (e: PointerEvent) => {
      if (e.pointerId !== pointerId) return;
      if (!m.dragging) {
        if (Math.hypot(e.clientX - start.x, e.clientY - start.y) < 6) return;
        m.dragging = m.dragged = true;
        takeOver();
        stage.setPointerCapture(e.pointerId);
      }
      m.target = start.target + wrapDiff(angleAt(e.clientX, e.clientY), start.a, TAU);
    };
    const onUp = (e: PointerEvent) => {
      if (e.pointerId !== pointerId) return;
      pointerId = -1;
      if (m.dragging) {
        m.dragging = false;
        m.target = Math.round(m.target / step) * step;
      }
    };
    // a drag that ends on a thumbnail is not a click
    const onClickCapture = (e: MouseEvent) => {
      if (!m.dragged) return;
      e.stopPropagation();
      e.preventDefault();
      m.dragged = false;
    };
    const onKey = (e: KeyboardEvent) => {
      if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(e.key)) return;
      e.preventDefault();
      takeOver();
      const dir = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : -1;
      m.target = Math.round(m.target / step) * step - dir * step;
    };

    stage.addEventListener("wheel", onWheel, { passive: false });
    stage.addEventListener("pointerdown", onDown);
    stage.addEventListener("pointermove", onMove);
    stage.addEventListener("pointerup", onUp);
    stage.addEventListener("pointercancel", onUp);
    stage.addEventListener("click", onClickCapture, true);
    stage.addEventListener("keydown", onKey);
    return () => {
      clearTimeout(snapTimer);
      stage.removeEventListener("wheel", onWheel);
      stage.removeEventListener("pointerdown", onDown);
      stage.removeEventListener("pointermove", onMove);
      stage.removeEventListener("pointerup", onUp);
      stage.removeEventListener("pointercancel", onUp);
      stage.removeEventListener("click", onClickCapture, true);
      stage.removeEventListener("keydown", onKey);
    };
  }, [mode, step]);

  // size
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const m = st.current;
    const measure = () => {
      const { width: w, height: h } = stage.getBoundingClientRect();
      m.small = w < 768;
      m.width = w;
      m.radius = m.small ? Math.min(w * 0.4, h * 0.34) : Math.min(w * 0.42, h * 0.4);
      m.scale = m.small ? 0.8 : 1;
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(stage);
    return () => ro.disconnect();
  }, []);

  // the frame loop, only while the stage is on screen
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const m = st.current;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;
    let visible = false;

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      const L = live.current;
      if (L.revealed && m.revealAt < 0) m.revealAt = now;

      if (L.mode === "scroll" && progress) {
        m.target = -clamp(progress.current ?? 0) * step * (N - 1);
      } else if (!m.interacted && !reduced && m.revealAt >= 0) {
        m.target -= 0.0006; // slow drift until the visitor takes over
        m.rot = m.target;
      }
      // wheel mode eases toward the target; scroll mode follows the (already smoothed) page scroll directly
      m.rot += (m.target - m.rot) * (reduced || L.mode === "scroll" ? 1 : L.tick ? 0.14 : 0.09);
      const ringPos = -m.rot / step; // continuous index at the top

      // which item sits at the top
      const top = mod(Math.round(ringPos), N);
      if (m.programmatic && Math.abs(m.target - m.rot) < 0.002) m.programmatic = false;
      if (top !== m.lastTop) {
        m.lastTop = top;
        if (m.interacted && !m.programmatic) {
          m.activeIndex = top;
          m.hoverIndex = -1;
          if (all[top].id !== L.activeId) L.onActive(all[top].id);
        }
      }
      // The active item changed from outside (e.g. Prev/Next): bring its nearest copy to the top
      if (L.activeId !== m.lastActiveId) {
        m.lastActiveId = L.activeId;
        if (L.activeId && all[m.activeIndex]?.id !== L.activeId) {
          let best = -1;
          let bestD = Infinity;
          all.forEach((it, j) => {
            if (it.id !== L.activeId) return;
            const d = Math.abs(wrapDiff(j, ringPos, N));
            if (d < bestD) (bestD = d), (best = j);
          });
          m.activeIndex = best;
          m.hoverIndex = -1;
          if (L.mode === "wheel" && best >= 0) {
            m.interacted = true;
            m.target = m.rot - wrapDiff(best, ringPos, N) * step;
            m.programmatic = true;
          }
        }
      }

      // the strip follows the ring, or slides to the hovered item
      const toward = m.hoverIndex >= 0 ? m.hoverIndex : ringPos;
      m.strip += wrapDiff(toward, m.strip, N) * (reduced || m.hoverIndex < 0 ? 1 : 0.12);
      const W = m.small ? m.width : m.width / 2;
      for (let i = 0; i < N; i++) {
        const panel = panelRefs.current[i];
        if (!panel) continue;
        const d = wrapDiff(i, m.strip, N);
        const ad = Math.abs(d);
        if (ad > 1.75) {
          if (panel.style.visibility !== "hidden") panel.style.visibility = "hidden";
          continue;
        }
        panel.style.visibility = "visible";
        panel.style.transform = `translate3d(${-W / 2 + d * W}px, 0, 0)`;
        const img = imgRefs.current[i];
        if (img) img.style.transform = `translate3d(${-d * W * 0.28}px, 0, 0) scale(${1.04 + 0.32 * Math.min(1.5, ad)})`;
        // off-centre, the image turns red/black (a grayscale copy under a red multiply) and darker
        const tone = toneRefs.current[i];
        if (tone) tone.style.opacity = String(Math.min(1, ad * 1.4));
        const shade = shadeRefs.current[i];
        if (shade) shade.style.opacity = String(Math.min(0.45, ad * 0.4));
      }

      const slot = Math.round(ringPos);
      if (!L.tick) m.tick = ringPos;
      else {
        m.tick += wrapDiff(slot, m.tick, N) * (reduced ? 1 : 0.38);
        if (Math.abs(wrapDiff(slot, m.tick, N)) < 0.002) m.tick = slot;
      }

      for (let i = 0; i < N; i++) {
        const el = thumbRefs.current[i];
        if (!el) continue;
        const intro = reduced ? 1 : m.revealAt < 0 ? 0 : easeOutCubic((now - m.revealAt - i * 22) / 1100);
        const r = m.radius * (0.15 + 0.85 * intro);
        const a = -Math.PI / 2 + (i - m.tick) * step - (1 - intro) * 1.2;
        const isActive = i === m.activeIndex && all[i].id === L.activeId;
        const s = m.scale * (isActive ? 1.5 : 1);
        el.style.transform = `translate3d(${Math.cos(a) * r}px, ${Math.sin(a) * r}px, 0) translate(-50%, -50%) scale(${s})`;
        el.style.opacity = String(intro);
        el.dataset.active = isActive ? "true" : "false";
      }
    };

    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !visible) {
        visible = true;
        raf = requestAnimationFrame(frame);
      } else if (!entry.isIntersecting && visible) {
        visible = false;
        cancelAnimationFrame(raf);
      }
    });
    io.observe(stage);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [N, step, all, progress]);

  return (
    <div
      ref={stageRef}
      role="region"
      aria-label={label}
      tabIndex={mode === "wheel" ? 0 : -1}
      onPointerMove={(e) => {
        if (e.pointerType === "mouse" && (e.movementX || e.movementY)) st.current.lastMouseMove = performance.now();
      }}
      className={`relative h-svh w-full overflow-hidden bg-ink outline-none select-none ${mode === "wheel" ? "touch-none" : ""}`}
    >
      {/* the filmstrip (mounted once the stage is revealed, so its images only load then) */}
      <div
        aria-hidden="true"
        className={`pointer-events-none absolute inset-0 transition-opacity duration-700 ${activeId ? "opacity-100" : "opacity-0"}`}
      >
        {revealed &&
          all.map((it, i) => (
            <div
              key={`${it.id}-${i}`}
              ref={(el) => {
                panelRefs.current[i] = el;
              }}
              className="absolute inset-y-0 left-1/2 w-1/2 overflow-hidden bg-ink max-md:w-full"
              style={{ visibility: "hidden" }}
            >
              {/* zoomed and shifted as a whole: the photo, plus its red/black version faded in off-centre */}
              <div
                ref={(el) => {
                  imgRefs.current[i] = el;
                }}
                className="absolute inset-0 will-change-transform"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={it.image} alt="" decoding="async" className="absolute inset-0 size-full object-cover" />
                <div
                  ref={(el) => {
                    toneRefs.current[i] = el;
                  }}
                  className="absolute inset-0 opacity-0"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={it.image} alt="" decoding="async" className="absolute inset-0 size-full object-cover grayscale contrast-150" />
                  <div className="absolute inset-0 bg-blood mix-blend-multiply" />
                </div>
              </div>
              <div
                ref={(el) => {
                  shadeRefs.current[i] = el;
                }}
                className="absolute inset-0 bg-ink"
              />
            </div>
          ))}
        <div className="absolute inset-0 bg-gradient-to-b from-black/35 via-black/5 to-black/55" />
      </div>

      <div className="absolute left-1/2 top-1/2 size-0">
        {all.map((it, i) => (
          <button
            key={`${it.id}-${i}`}
            ref={(el) => {
              thumbRefs.current[i] = el;
            }}
            type="button"
            aria-label={it.title}
            tabIndex={i < items.length ? 0 : -1}
            onPointerEnter={(e) => {
              const m = st.current;
              if (e.pointerType !== "mouse" || performance.now() - m.lastMouseMove > 120) return;
              m.interacted = true;
              m.activeIndex = i;
              m.hoverIndex = i;
              if (it.id !== activeId) onActive(it.id);
            }}
            onFocus={() => {
              st.current.activeIndex = i;
              st.current.hoverIndex = i;
              if (it.id !== activeId) onActive(it.id);
            }}
            onClick={() => {
              // wheel mode: the clicked item comes round to the top
              const m = st.current;
              if (mode === "wheel") {
                m.interacted = true;
                m.hoverIndex = -1;
                m.activeIndex = i;
                m.target = m.rot - wrapDiff(i, -m.rot / step, N) * step;
                m.programmatic = true;
              }
              onPick?.(it.id, i);
            }}
            style={{ width: thumb.w, height: thumb.h, opacity: 0 }}
            className="orbit-thumb absolute left-0 top-0 cursor-pointer overflow-hidden bg-neutral-900 will-change-transform"
          >
            <Image src={it.thumb} alt="" fill sizes={`${thumb.w * 2}px`} className="pointer-events-none object-cover" />
          </button>
        ))}
      </div>

      <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center px-6">
        <div className="pointer-events-auto">{children}</div>
      </div>
      {overlay}
    </div>
  );
}
