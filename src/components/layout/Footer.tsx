"use client";

import SocialLink from "./SocialLink";
import { FOOTER_LINKS } from "@/data/links";
import { scrollToTop } from "@/lib/lenis";

const LINK_CLASS = "text-bone/60 hover:text-bone transition-colors duration-200 block";
// the headline steps down the page diagonally, one line at a time
const LINES = ["Let's make", "something", "that feels alive."];

export default function Footer() {
  return (
    <footer className="relative w-full min-h-screen text-bone flex flex-col justify-between px-6 md:px-20 py-12 overflow-hidden">
      <div className="relative z-10 flex flex-col mt-30 justify-center h-full">
        {/* the section heading, same size as PROJECTS (n), on the right */}
        <div className="self-end text-right">
          <p className="project-txt">Get in touch</p>
          <p className="para-txt mt-2 text-bone/60">[ available for selected projects ]</p>
        </div>

        <h2 className="mt-16 md:mt-24 font-semibold uppercase tracking-[0.02em] text-[15px] md:text-[17px] leading-none">
          {LINES.map((line, i) => (
            <span key={line} className="block mt-8 first:mt-0 md:mt-14" style={{ marginLeft: `${i * 28}%` }}>
              {line}
            </span>
          ))}
        </h2>

        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-24 md:mt-40 font-semibold uppercase tracking-[0.02em] text-[15px] md:text-[17px]">
          {FOOTER_LINKS.map((link) => (
            <SocialLink key={link.label} {...link} className={LINK_CLASS} />
          ))}
        </div>
      </div>

      <div className="w-full h-px bg-white/10" />

      <div className="relative z-10 pt-4 pb-4 flex justify-between items-end flex-wrap gap-6">
        <p className="para-txt max-w-md text-bone/60">
          because great work isn&apos;t luck. It&apos;s obsession, patience, and a refusal to ship anything mid.
        </p>

        <button
          type="button"
          onClick={() => scrollToTop()}
          className="para-txt text-bone/60 hover:text-bone transition-colors duration-200 underline cursor-pointer"
        >
          back to top
        </button>
      </div>
    </footer>
  );
}
