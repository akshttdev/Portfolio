"use client";

import { getLenis } from "@/lib/lenis";

export default function Footer() {
  const scrollToTop = () => {
    const lenis = getLenis();
    if (lenis) {
      lenis.scrollTo(0, { duration: 1.4 });
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <footer
      className="
        relative w-full min-h-screen text-white 
        flex flex-col justify-between px-8 md:px-20 py-12
        overflow-hidden
      "
    >
      {/* LIGHT NOISE OVERLAY */}
      <div className="absolute inset-0 pointer-events-none -z-10 opacity-[0.08] bg-[url('/noise.png')] bg-repeat"></div>

      {/* BIG BACKGROUND TEXT */}
      <div className="absolute inset-0 flex items-center justify-center select-none pointer-events-none opacity-[0.05]">
        <p className="text-[15vw] font-extrabold uppercase tracking-tighter leading-none">
          GET IN TOUCH
        </p>
      </div>

      {/* MAIN SECTION - LEFT ALIGNED */}
      <div className="relative z-10 flex flex-col mt-30 justify-center h-full">
        <div className="max-w-2xl">
          <h1 className="text-5xl md:text-7xl font-extrabold uppercase leading-[0.9]">
            LET'S MAKE
            <br /> SOMETHING
            <br /> THAT FEELS ALIVE.
          </h1>

          <p className="mt-6 text-sm opacity-70 uppercase tracking-wide">
            [ available for selected projects ]
          </p>
        </div>

        {/* CONTACT LINKS — HORIZONTAL WITH PROPER SPACING */}
        <div className="flex flex-wrap items-center gap-6 md:gap-8 mt-12 text-3xl md:text-4xl max-sm:pt-10 pt-60 font-bold uppercase">
          <a
            href="mailto:akshttt.dev@gmail.com"
            className="text-white/60 hover:text-white transition-colors duration-200 block"
          >
            mail
          </a>
          <a
            href="https://www.linkedin.com/in/akshatdhami/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-white/60 hover:text-white transition-colors duration-200 block"
          >
            linkedin
          </a>

          <a
            href="https://x.com/akshttdev"
            target="_blank"
            rel="noopener noreferrer"
            className="text-white/60 hover:text-white transition-colors duration-200 block"
          >
            twitter
          </a>

          <a
            href="https://github.com/akshttdev"
            target="_blank"
            rel="noopener noreferrer"
            className="text-white/60 hover:text-white transition-colors duration-200 block"
          >
            github
          </a>

          <a
            href="https://cal.com/akshtt/meeting-with-akshat"
            target="_blank"
            rel="noopener noreferrer"
            className="text-white/60 hover:text-white transition-colors duration-200 block"
          >
            meeting
          </a>
        </div>
      </div>

      {/* HORIZONTAL LINE */}
      <div className="w-full h-px bg-white/10 mt-0"></div>

      {/* BOTTOM BAR */}
      <div className="relative z-10 pt-4 pb-4 flex justify-between items-end flex-wrap gap-6">
        <div className="text-sm md:text-base opacity-70 leading-relaxed max-w-md font-medium uppercase">
          because great work isn't luck — it's obsession, patience, and a
          refusal to ship anything mid.
        </div>

        <div className="text-xs opacity-70 text-right space-y-1">
          <button
            onClick={scrollToTop}
            className="text-white/60 hover:text-white transition-colors duration-200 underline font-semibold uppercase cursor-pointer"
          >
            back to top
          </button>
        </div>
      </div>
    </footer>
  );
}
