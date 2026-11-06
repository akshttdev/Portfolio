"use client";

import { useEffect } from "react";

const AWAY_TITLE = "❓ is it not badass?";

/** Swaps the tab title while the visitor is on another tab. */
export default function TitleSwitcher() {
  useEffect(() => {
    // Read the title when the tab is hidden (not once on mount): each page can have its own title.
    let pageTitle = document.title;
    const onVisibilityChange = () => {
      if (document.hidden) {
        pageTitle = document.title;
        document.title = AWAY_TITLE;
      } else {
        document.title = pageTitle;
      }
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => document.removeEventListener("visibilitychange", onVisibilityChange);
  }, []);

  return null;
}
