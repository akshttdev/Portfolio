"use client";

import { useRef } from "react";
import Image from "next/image";
import { motion, useInView, useScroll, useTransform } from "framer-motion";

/** "My Vision": a full-screen photo with scroll parallax, revealed through this section's clip-path. */
export default function Vision() {
  const container = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: container, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], ["-15%", "15%"]);

  // The photo is a fixed, full-screen layer. Without this the browser keeps compositing it the whole time
  // (e.g. while the hero is on screen); only show it when the section is near.
  const isNear = useInView(container, { margin: "25% 0px 25% 0px" });

  return (
    <section
      ref={container}
      className="relative px-6 flex items-center justify-center h-screen overflow-hidden max-md:px-3 isolate"
      style={{ clipPath: "polygon(0% 0, 100% 0%, 100% 100%, 0 100%)" }}
    >
      <div
        className="fixed top-[-10vh] left-0 w-full h-[120vh] md:h-[130vh]"
        style={{ visibility: isNear ? "visible" : "hidden" }}
      >
        <motion.div style={{ y }} className="relative w-full h-full will-change-transform">
          {/* Below the fold: lazy, so it doesn't compete with the hero for first-load bandwidth */}
          <Image src="/images/2.jpeg" alt="" width={3000} height={3000} sizes="100vw" className="w-full h-full object-cover" />
          {/* darkened to sit with the rest of the site (no colour change) */}
          <div className="absolute inset-0 bg-ink/55" />
        </motion.div>
      </div>

      <div className="absolute top-32 left-1/2 -translate-x-1/2 z-20 pointer-events-none select-none">
        <p className="ui-txt text-bone">
          Discomfort Drives Growth
        </p>
      </div>

      <div className="absolute bottom-1 left-6 md:left-10 z-20 pointer-events-none select-none">
        <h2 className="pb-6 text-bone font-semibold uppercase tracking-[0.02em] text-[15px] md:text-[17px]">My vision</h2>
      </div>

      <div className="mt-6 md:mt-10 w-full md:flex md:justify-end md:pr-5 z-20">
        <div className="max-w-[90%] sm:max-w-[80%] md:max-w-md text-left md:text-right pointer-events-none select-none">
          <p className="para-txt whitespace-pre-line relative text-left">
            &quot; I’m wired to fixate, break things apart, and push them past the obvious. It’s never clean, never
            linear, just persistence until meaning shows up. Nothing extravagant. &quot;
          </p>
        </div>
      </div>
    </section>
  );
}
