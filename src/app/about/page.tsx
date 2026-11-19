import type { Metadata } from "next";
import { preload } from "react-dom";
import IntroGate from "@/components/transitions/IntroGate";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import DepthMorph from "@/components/depth-morph/DepthMorph";
import AboutBackdrop from "@/components/about/AboutBackdrop";
import AboutBio from "@/components/about/AboutBio";
// The music ring now lives on its own page, /rotation (linked under the sets on the home page). (It is a full-page
// wheel there, so it no longer fits in the middle of this page.)
// import MusicOrbit from "@/components/about/MusicOrbit";
import { aboutSlides } from "@/data/aboutSlides";
// Hidden for now: the "Nice to meet you" scroll clip. To bring it back, uncomment these two imports and the
// <ScrollSequence> line below (components/scroll-sequence and the frames in /images/about/clip are untouched).
// import ScrollSequence from "@/components/scroll-sequence/ScrollSequence";
// import { aboutClip } from "@/data/aboutClip";

export const metadata: Metadata = { title: "About" };

export default function AboutPage() {
  // Start downloading the first photo + depth map with the HTML, not after the JS boots: it's the first
  // thing a visitor sees on this page.
  preload(aboutSlides[0].image, { as: "image", fetchPriority: "high" });
  preload(aboutSlides[0].depth, { as: "image", fetchPriority: "high" });
  // The others at low priority. Otherwise they only start once the JS has booted and the first photo is in,
  // and on a slow connection scrolling early morphed the first photo into itself until the second arrived.
  for (const s of aboutSlides.slice(1)) {
    preload(s.image, { as: "image", fetchPriority: "low" });
    preload(s.depth, { as: "image", fetchPriority: "low" });
  }

  return (
    <IntroGate>
      {/* Lives outside the overflow-hidden wrapper below, which would break its sticky stage */}
      <DepthMorph slides={aboutSlides} title="Akshat" />

      <Navbar />
      <div className="relative w-screen min-h-screen overflow-hidden bg-ink text-bone">
        <AboutBackdrop />
        <AboutBio />
      </div>

      {/* Also outside the overflow-hidden wrapper, for the same reason as DepthMorph */}
      {/* <ScrollSequence seq={aboutClip} text="Nice to meet you" /> */}

      {/* Also outside the overflow-hidden wrapper: its stage is sticky too */}
      {/* <MusicOrbit /> */}

      <Footer />
    </IntroGate>
  );
}
