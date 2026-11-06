"use client";

import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import HorizontalTransition from "@/components/HorizontalTransition";
import HoverImageReveal from "@/components/HoverImage";
import Footer from "@/components/Footer";
import DepthMorph, { type DepthSlide } from "@/components/DepthMorph";
import { preload } from "react-dom";

// Each photo needs a matching depth map (white = near), same framing.
// Optional per slide: focus/zoom to adjust the crop, or face + anchor to auto-align faces across slides
// (see DepthSlide in components/DepthMorph.tsx). Measured faces, if needed again:
//   home   { x: 0.585, y: 0.595, h: 0.145 }   studio { x: 0.39, y: 0.395, h: 0.2 }   kurta { x: 0.485, y: 0.593, h: 0.086 }
const aboutSlides: DepthSlide[] = [
  { image: "/images/about/fishing.webp", depth: "/images/about/fishing-depth.webp", label: "First catch", focus: [0.45, 0.36] },
  // studio-wide = studio.jpg with AI-extended background (LaMa) so the face is smaller and centred
  { image: "/images/about/studio-wide.webp", depth: "/images/about/studio-wide-depth.webp", label: "Digital Product School" },
  { image: "/images/about/kurta.webp", depth: "/images/about/kurta-depth.webp", label: "Nights out", focus: [0.5, 0.58] },
];

// Other photos, still in /public/images/about — swap in by replacing entries above
// (each photo also has a lighter .webp next to the .jpg; prefer the .webp):
// { image: "/images/about/home.jpg", depth: "/images/about/home-depth.webp", label: "Off hours" },
// { image: "/images/about/flowers.jpg", depth: "/images/about/flowers-depth.webp", label: "Flower show" },
// Card versions (whole photo over a blurred copy of itself): fishing-card.jpg, flowers-card.jpg (+ -depth.webp)
// { image: "/images/about/car.jpg", depth: "/images/about/car-depth.webp", label: "Weekends", face: { x: 0.585, y: 0.425, h: 0.1 } },
// { image: "/images/about/portrait.jpg", depth: "/images/about/portrait-depth.webp", label: "Munich", face: { x: 0.51, y: 0.34, h: 0.195 } },

const bgWords = [
  "UI/UX",
  "REACT",
  "NEXT.JS",
  "TYPESCRIPT",
  "ANIMATION",
  "FRAMER",
  "GSAP",
  "DESIGN",
  "SYSTEMS",
  "ARCHITECTURE",
  "PERFORMANCE",
];

export default function AboutPage() {
  // Start downloading the first photo + depth map with the HTML, not after the JS boots — it's the first
  // thing a visitor sees on this page.
  preload(aboutSlides[0].image, { as: "image", fetchPriority: "high" });
  preload(aboutSlides[0].depth, { as: "image", fetchPriority: "high" });

  return (
    <HorizontalTransition>
      {/* Lives outside the overflow-hidden wrapper below, which would break its sticky stage */}
      <DepthMorph slides={aboutSlides} title="Akshat" />

      <div className="noise relative w-screen min-h-screen overflow-hidden text-white bg-black">
        <Navbar />

        {/* INTRO LINE */}
        <div
          className="
            absolute 
            z-20
            font-semibold
            text-sm md:text-base
            uppercase tracking-wide
            whitespace-pre-line
            select-none pointer-events-none
            max-sm:item-left 
            max-sm:justify-left
            max-sm:left-0
            top-24 left-8
            md:top-44 md:left-48
            text-[1rem]
          "
        >
          {"I could oversell myself here,\nbut I bet GPT-5.1 could do better."}
        </div>

        {/* BG WORDS */}
        <div
          className="
            absolute 
            left-4 
            top-1/2 
            -translate-y-1/2 
            flex flex-col 
            opacity-[0.045]
            leading-[0.8]
            select-none 
            pointer-events-none 
            space-y-[-1rem]

            max-sm:hidden
          "
        >
          {bgWords.map((w, i) => (
            <p
              key={i}
              className="
                uppercase 
                font-extrabold 
                tracking-tighter 
                whitespace-nowrap
                text-[6rem] sm:text-[8rem] md:text-[10rem] lg:text-[12rem]
              "
            >
              {w}
            </p>
          ))}
        </div>

        {/* RIGHT SIDE CONTENT */}
        <main
          className="
            w-full min-h-screen 
            flex items-center 
            justify-end 

             md:px-20 
            relative 
            z-20
            pt-60
            max-sm:justify-center 
            max-sm:pt-40
          "
        >
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="
              max-w-xl 
              space-y-8 
              text-left

              max-sm:max-w-sm
              max-sm:text-left
              max-sm:pt-10
              
            "
          >
            {/* FIRST LINE WITH HOVER IMAGE */}
            <p className="max-sm:text-s text-[1.1rem] opacity-95 leading-relaxed font-semibold uppercase">
              <HoverImageReveal label="Akshat" image="/images/about/home.jpg" /> is
              someone who runs on curiosity, instinct, and a slightly obsessive
              need to make things feel intentional. He digs deep into ideas,
              takes them apart, questions the obvious, and rebuilds them with
              cleaner structure and sharper personality.
            </p>

            <p className="max-sm:text-s text-[1.1rem] opacity-95 leading-relaxed font-semibold uppercase">
              He learns fast, experiments without fear, and pushes visuals until
              they stop feeling random. Whether it's code, motion, product
              logic, or design systems — the goal is always the same: make it
              feel alive and make it feel right.
            </p>

            <p className="max-sm:text-s text-[1.1rem] opacity-95 leading-relaxed font-semibold uppercase">
              Away from the monitor, he’s still restless — traveling whenever he
              can, playing guitar, running long distances, obsessing over
              football, blasting metal or Bollywood..
            </p>
          </motion.div>
        </main>
      </div>

      <Footer />
    </HorizontalTransition>
  );
}
