"use client";

import { useEffect, useRef, useState } from "react";

const CHARS = "!@#$%&*)_+-]{}<>?";
const TICK_MS = 50; // how often the letters change
const STEP = 1 / 3; // letters revealed per tick; smaller is slower

/** Scrambles the text on hover, then settles it back one letter at a time. */
export default function TextScramble({ text }: { text: string }) {
  const [shown, setShown] = useState(text);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const stop = () => {
    if (timer.current) clearInterval(timer.current);
    timer.current = null;
  };
  useEffect(() => stop, []);

  const scramble = () => {
    stop();
    let revealed = 0;
    timer.current = setInterval(() => {
      setShown(
        [...text]
          .map((ch, i) => (i < revealed ? ch : CHARS[Math.floor(Math.random() * CHARS.length)]))
          .join(""),
      );
      if (revealed >= text.length) stop();
      revealed += STEP;
    }, TICK_MS);
  };

  return <span onMouseEnter={scramble}>{shown}</span>;
}
