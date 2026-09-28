"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  word: string;
  className?: string;
};

const RandomLetterReveal = ({ word, className }: Props) => {
  const containerRef = useRef<HTMLSpanElement>(null);

  const [revealedIndices, setRevealedIndices] = useState<Set<number>>(
    new Set(),
  );
  const [isInView, setIsInView] = useState(false);

  // Prevents re-running the animation
  const hasAnimatedRef = useRef(false);

  // NEW: Instantly reveal if scrolled past
  const forceReveal = () => {
    setRevealedIndices(new Set(word.split("").map((_, i) => i)));
    hasAnimatedRef.current = true;
  };

  // Intersection Observer — detect when visible
  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsInView(entry.isIntersecting);

        // If the top of the text is above the viewport → instantly reveal
        if (entry.boundingClientRect.top < 0) {
          forceReveal();
        }
      },
      { threshold: 0.1 },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  // Watch scroll — if user scrolls fast past it, force reveal
  useEffect(() => {
    const onScroll = () => {
      const node = containerRef.current;
      if (!node || hasAnimatedRef.current) return;

      const rect = node.getBoundingClientRect();

      // If the component is ABOVE viewport → instantly reveal
      if (rect.top < 0) {
        forceReveal();
      }
    };

    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, [word]);

  // Main animation logic
  useEffect(() => {
    if (hasAnimatedRef.current) return;

    if (isInView) {
      const timers = word.split("").map((_, i) => {
        const delay = Math.random() * 800;
        return setTimeout(() => {
          setRevealedIndices((prev) => new Set(prev).add(i));
        }, delay);
      });

      hasAnimatedRef.current = true;

      return () => timers.forEach(clearTimeout);
    }
  }, [isInView, word]);

  // Render each space/newline as its own span, but group the letters of each
  // word into one atomic inline-block. Splitting every letter into an
  // independent inline box (the old behavior) gives the browser a break
  // opportunity between ANY two letters once a line runs out of room, which
  // produces ugly mid-word breaks ("EXPERIE-NCE") instead of wrapping at the
  // nearest space. Grouping by word guarantees wraps only ever happen there.
  const renderChar = (char: string, i: number) => (
    <span
      key={i}
      className="transition-opacity duration-500 ease-in-out"
      style={{ opacity: revealedIndices.has(i) ? 1 : 0 }}
    >
      {char}
    </span>
  );

  const nodes: React.ReactNode[] = [];
  let wordGroup: number[] = [];
  const flushWord = () => {
    if (wordGroup.length === 0) return;
    nodes.push(
      <span key={`w${wordGroup[0]}`} className="inline-block whitespace-nowrap">
        {wordGroup.map((i) => renderChar(word[i], i))}
      </span>,
    );
    wordGroup = [];
  };

  word.split("").forEach((char, i) => {
    if (char === " " || char === "\n") {
      flushWord();
      nodes.push(renderChar(char, i));
    } else {
      wordGroup.push(i);
    }
  });
  flushWord();

  return (
    <span ref={containerRef} className={`${className} inline-block`}>
      {nodes}
    </span>
  );
};

export default RandomLetterReveal;
