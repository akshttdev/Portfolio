"use client";

import { useEffect, useRef, useState, type MouseEvent } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";

/** width/height: size the photo is shown at, in px (keep the photo's own aspect ratio so nothing is cropped) */
type Props = { label: string; image: string; width?: number; height?: number };

const OFFSET = 20; // px from the cursor
const EASE = "cubic-bezier(0.215, 0.61, 0.355, 1)";
const FADE = `opacity 0.25s ${EASE}, visibility 0.25s`;
const FOLLOW = `${FADE}, transform 0.15s ${EASE}`;

/**
 * A label that shows a photo following the cursor while hovered.
 * Plain CSS transitions (previously GSAP, which shipped ~70 KB of JS for this one effect).
 */
export default function HoverImageReveal({ label, image, width = 380, height = 380 }: Props) {
  const imgRef = useRef<HTMLImageElement>(null);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const moveTo = (e: MouseEvent) => {
    const img = imgRef.current;
    if (!img) return;
    // Follow the cursor, but keep the whole photo on screen (a tall one would otherwise run off the bottom)
    const x = Math.min(e.clientX + OFFSET, window.innerWidth - width - OFFSET);
    const y = Math.min(e.clientY + OFFSET, window.innerHeight - height - OFFSET);
    img.style.transform = `translate3d(${x}px, ${y}px, 0)`;
  };

  const show = (e: MouseEvent) => {
    const img = imgRef.current;
    if (!img) return;
    // Jump to the cursor first, so the photo doesn't fly in from where it was last shown
    img.style.transition = FADE;
    moveTo(e);
    void img.offsetWidth;
    img.style.transition = FOLLOW;
    img.style.opacity = "1";
    img.style.visibility = "visible";
  };

  const hide = () => {
    const img = imgRef.current;
    if (!img) return;
    img.style.opacity = "0";
    img.style.visibility = "hidden";
  };

  return (
    <>
      <span
        onMouseEnter={show}
        onMouseMove={moveTo}
        onMouseLeave={hide}
        className="relative inline-block underline z-[10] cursor-pointer font-semibold uppercase select-none text-white transition-colors duration-200"
      >
        {label}
      </span>
      {mounted &&
        createPortal(
          <div className="pointer-events-none fixed top-0 left-0 z-[9999] w-0 h-0 overflow-visible">
            <Image
              ref={imgRef}
              src={image}
              alt=""
              width={width}
              height={height}
              style={{ width, height }}
              // max-w-none: Tailwind's base `img { max-width: 100% }` would squash it to the 0-wide anchor
              className="pointer-events-none absolute top-0 left-0 opacity-0 invisible object-cover rounded max-w-none"
            />
          </div>,
          document.body,
        )}
    </>
  );
}
