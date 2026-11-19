"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { MouseEvent } from "react";
import { scrollToTop } from "@/lib/lenis";
import { LINKS } from "@/data/links";

/** Top bar: name, About, résumé. */
export default function Navbar() {
  const pathname = usePathname();
  // Already home: glide back to the top instead of reloading the route
  const onHomeClick = (e: MouseEvent) => {
    if (pathname !== "/") return;
    e.preventDefault();
    scrollToTop(1);
  };

  const link = (href: string, label: string) => (
    <Link
      href={href}
      className={`transition-colors hover:text-blood ${pathname === href ? "underline decoration-1 underline-offset-[3px]" : ""}`}
    >
      {label}
    </Link>
  );

  return (
    <nav className="ui-txt pointer-events-none fixed inset-x-0 top-0 z-[1001] flex items-start justify-between gap-4 px-5 py-4 mix-blend-difference md:px-8 md:py-6">
      <div className="pointer-events-auto">
        <Link href="/" onClick={onHomeClick} className="transition-colors hover:text-blood">
          Akshat™
        </Link>
      </div>
      <div className="pointer-events-auto absolute left-1/2 -translate-x-1/2">{link("/about", "About")}</div>
      {/* (the Sound on/off button, components/layout/SoundToggle + lib/music, is off for now) */}
      <div className="pointer-events-auto">
        <a href={LINKS.resume} target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-blood">
          Resume
        </a>
      </div>
    </nav>
  );
}
