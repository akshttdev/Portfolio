"use client";

import SocialLink from "./SocialLink";
import { FOOTER_LINKS } from "@/data/links";
import { scrollToTop } from "@/lib/lenis";

const LINK_CLASS = "text-white/60 hover:text-white transition-colors duration-200 block";

export default function Footer() {
  return (
    <footer className="relative w-full min-h-screen text-white flex flex-col justify-between px-8 md:px-20 py-12 overflow-hidden">
      {/* Big background text */}
      <div className="absolute inset-0 flex items-center justify-center select-none pointer-events-none opacity-[0.05]">
        <p className="text-[15vw] font-extrabold uppercase tracking-tighter leading-none">GET IN TOUCH</p>
      </div>

      <div className="relative z-10 flex flex-col mt-30 justify-center h-full">
        <div className="max-w-2xl">
          <h2 className="text-5xl md:text-7xl font-extrabold uppercase leading-[0.9]">
            LET&apos;S MAKE
            <br /> SOMETHING
            <br /> THAT FEELS ALIVE.
          </h2>
          <p className="mt-6 text-sm opacity-70 uppercase tracking-wide">[ available for selected projects ]</p>
        </div>

        <div className="flex flex-wrap items-center gap-6 md:gap-8 mt-12 text-3xl md:text-4xl max-sm:pt-10 pt-60 font-bold uppercase">
          {FOOTER_LINKS.map((link) => (
            <SocialLink key={link.label} {...link} className={LINK_CLASS} />
          ))}
        </div>
      </div>

      <div className="w-full h-px bg-white/10" />

      <div className="relative z-10 pt-4 pb-4 flex justify-between items-end flex-wrap gap-6">
        <div className="text-sm md:text-base opacity-70 leading-relaxed max-w-md font-medium uppercase">
          because great work isn&apos;t luck. It&apos;s obsession, patience, and a refusal to ship anything mid.
        </div>

        <div className="text-xs opacity-70 text-right space-y-1">
          <button
            type="button"
            onClick={() => scrollToTop()}
            className="text-white/60 hover:text-white transition-colors duration-200 underline font-semibold uppercase cursor-pointer"
          >
            back to top
          </button>
        </div>
      </div>
    </footer>
  );
}
