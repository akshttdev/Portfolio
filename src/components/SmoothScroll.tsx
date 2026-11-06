"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { getLenis, initLenis } from "@/lib/lenis";

/** Starts Lenis for every page, and resets it on client-side navigation. */
export default function SmoothScroll() {
  const pathname = usePathname();
  const first = useRef(true);

  useEffect(() => {
    initLenis();
  }, []);

  // Next.js jumps the window to the top on navigation, but Lenis keeps its own target scroll position and
  // would glide back toward the previous page's offset. Snap it to the top when the route changes.
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    getLenis()?.scrollTo(0, { immediate: true, force: true });
  }, [pathname]);

  return null;
}
