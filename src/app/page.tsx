"use client";

import { initLenis } from "@/lib/lenis";
import Navbar from "@/components/Navbar";
import SkullHero from "@/components/SkullHero";
import Projects from "@/components/Projects";
import Background from "@/components/Vision";
import HorizontalTransition from "@/components/HorizontalTransition";
import PreLoader from "@/components/Preloader";
import Footer from "@/components/Footer";
import { useState, useEffect } from "react";

export default function Home() {
  const [firstLoad, setFirstLoad] = useState(true);

  useEffect(() => {
    const hasLoaded = sessionStorage.getItem("hasLoaded");
    if (hasLoaded) {
      setFirstLoad(false);
    } else {
      sessionStorage.setItem("hasLoaded", "true");
      setFirstLoad(true);
    }

    initLenis();
  }, []);

  return (
    <div className="noise scrollbar-hide ">
      {firstLoad ? (
        <PreLoader>
          <Navbar />
          <main>
            <SkullHero />
            <Background />
            <Projects />
            <Footer />
          </main>
        </PreLoader>
      ) : (
        <HorizontalTransition>
          <Navbar />
          <main>
            <SkullHero />
            <Background />
            <Projects />
            <Footer />
          </main>
        </HorizontalTransition>
      )}
    </div>
  );
}
