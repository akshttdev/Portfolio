"use client";

import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import Preloader from "./Preloader";
import ColumnWipe from "./ColumnWipe";

const SEEN_KEY = "hasLoaded";

// Layout effect on the client, so the choice is made before the first paint on client-side navigation
const useIsoLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

/** True the first time this session sees the page (also writes the flag). Blocked storage counts as first. */
function readFirstVisit(): boolean {
  try {
    const first = !sessionStorage.getItem(SEEN_KEY);
    sessionStorage.setItem(SEEN_KEY, "true");
    return first;
  } catch {
    return true;
  }
}

/**
 * Full preloader on the first visit of the session, the quick column wipe after that.
 * The page content is a stable sibling of the intro, so switching between the two never remounts it
 * (previously the whole page, 3D hero included, was torn down and rebuilt when returning to it).
 */
export default function IntroGate({ children }: { children: ReactNode }) {
  const [firstVisit, setFirstVisit] = useState(true); // matches the server render
  const decided = useRef<boolean | null>(null); // survives StrictMode's effect re-run

  useIsoLayoutEffect(() => {
    decided.current ??= readFirstVisit();
    setFirstVisit(decided.current);
  }, []);

  return (
    <>
      {firstVisit ? <Preloader /> : <ColumnWipe />}
      <div className="noise relative z-10">{children}</div>
    </>
  );
}
