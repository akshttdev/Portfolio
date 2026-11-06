"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

type Props = { word: string; className?: string };
type Phase = "hidden" | "reveal" | "instant";

const MAX_DELAY_MS = 800;

// Stable pseudo-random 0..1 per letter: identical on the server and the client, so hydration matches
const jitter = (i: number) => {
  const x = Math.sin(i * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
};

/**
 * Letters fade in one by one in random order when the text scrolls into view.
 * One state change per reveal: each letter gets a random CSS transition-delay instead of its own timer and
 * re-render (the hero paragraph alone used to schedule ~370 re-renders).
 */
export default function RandomLetterReveal({ word, className = "" }: Props) {
  const ref = useRef<HTMLSpanElement>(null);
  const [phase, setPhase] = useState<Phase>("hidden");

  useEffect(() => {
    const node = ref.current;
    if (!node || phase !== "hidden") return;

    // Already above the viewport (fast scroll or a jump): show it at once instead of animating off-screen
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.boundingClientRect.top < 0) setPhase("instant");
        else if (entry.isIntersecting) setPhase("reveal");
      },
      { threshold: 0.1 },
    );
    // A scroll that jumps right past the text never crosses the observer's threshold
    const onScroll = () => {
      if (node.getBoundingClientRect().top < 0) setPhase("instant");
    };

    io.observe(node);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      io.disconnect();
      window.removeEventListener("scroll", onScroll);
    };
  }, [phase]);

  const renderChar = (char: string, i: number) => (
    <span
      key={i}
      className="transition-opacity duration-500 ease-in-out"
      style={{
        opacity: phase === "hidden" ? 0 : 1,
        transitionDelay: phase === "reveal" ? `${Math.round(jitter(i) * MAX_DELAY_MS)}ms` : undefined,
      }}
    >
      {char}
    </span>
  );

  // Group each word's letters into one unbreakable inline-block. With every letter as its own inline box,
  // the browser may break between ANY two letters ("EXPERIE-NCE") instead of wrapping at a space.
  const nodes: ReactNode[] = [];
  let group: number[] = [];
  const flush = () => {
    if (!group.length) return;
    nodes.push(
      <span key={`w${group[0]}`} className="inline-block whitespace-nowrap">
        {group.map((i) => renderChar(word[i], i))}
      </span>,
    );
    group = [];
  };
  [...word].forEach((char, i) => {
    if (char === " " || char === "\n") {
      flush();
      nodes.push(renderChar(char, i));
    } else {
      group.push(i);
    }
  });
  flush();

  return (
    <span ref={ref} className={`${className} inline-block`}>
      {nodes}
    </span>
  );
}
