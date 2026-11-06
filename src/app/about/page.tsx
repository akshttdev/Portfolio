import type { Metadata } from "next";
import { preload } from "react-dom";
import HorizontalTransition from "@/components/transitions/HorizontalTransition";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import DepthMorph from "@/components/depth-morph/DepthMorph";
import AboutBackdrop from "@/components/about/AboutBackdrop";
import AboutBio from "@/components/about/AboutBio";
import { aboutSlides } from "@/data/aboutSlides";

export const metadata: Metadata = { title: "About" };

export default function AboutPage() {
  // Start downloading the first photo + depth map with the HTML, not after the JS boots: it's the first
  // thing a visitor sees on this page.
  preload(aboutSlides[0].image, { as: "image", fetchPriority: "high" });
  preload(aboutSlides[0].depth, { as: "image", fetchPriority: "high" });

  return (
    <HorizontalTransition>
      {/* Lives outside the overflow-hidden wrapper below, which would break its sticky stage */}
      <DepthMorph slides={aboutSlides} title="Akshat" />

      <div className="noise relative w-screen min-h-screen overflow-hidden text-white bg-black">
        <Navbar />
        <AboutBackdrop />
        <AboutBio />
      </div>

      <Footer />
    </HorizontalTransition>
  );
}
