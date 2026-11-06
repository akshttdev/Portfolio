"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { MouseEvent } from "react";
import TextScramble from "@/components/text/TextScramble";
import SocialLink from "./SocialLink";
import { NAV_SOCIALS } from "@/data/links";
import { scrollToTop } from "@/lib/lenis";
import { YEAR } from "@/lib/site";

export default function Navbar() {
  const pathname = usePathname();

  // Already home: glide back to the top instead of reloading the route
  const onHomeClick = (e: MouseEvent) => {
    if (pathname !== "/") return;
    e.preventDefault();
    scrollToTop(1);
  };

  const home = (
    <Link href="/" onClick={onHomeClick} className="nav-txt">
      <TextScramble text="AKSHAT" />
    </Link>
  );
  const about = (
    <Link href="/about" className="nav-txt">
      <TextScramble text="ABOUT" />
    </Link>
  );

  return (
    <nav className="fixed top-0 w-full z-[1001] px-6 py-6 select-none mix-blend-exclusion">
      {/* Mobile: a single line (no year, so the bar doesn't collapse) */}
      <div className="md:hidden w-full flex items-center justify-between whitespace-nowrap gap-x-3 px-1">
        {home}
        <div className="flex items-center gap-x-3">{about}</div>
        <div className="flex items-center gap-x-3">
          {NAV_SOCIALS.map((s) => (
            <SocialLink key={s.label} {...s} className="nav-txt" />
          ))}
        </div>
      </div>

      {/* Desktop: name left, about + year centred, socials right */}
      <ul className="relative w-full h-full hidden md:block">
        <li className="absolute left-0 top-1/2 -translate-y-1/2">{home}</li>

        <li className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <div className="flex items-center gap-x-18">
            <div className="w-[5rem] text-left">{about}</div>
            <span className="nav-txt">@{YEAR}</span>
          </div>
        </li>

        <li className="absolute right-0 top-1/2 -translate-y-1/2">
          <div className="flex items-center gap-x-6">
            {NAV_SOCIALS.map((s) => (
              <div key={s.label} className={`${s.width} text-left`}>
                <SocialLink {...s} className="nav-txt" />
              </div>
            ))}
          </div>
        </li>
      </ul>
    </nav>
  );
}
