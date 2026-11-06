import IntroGate from "@/components/transitions/IntroGate";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import SkullHero from "@/components/hero/SkullHero";
import Vision from "@/components/vision/Vision";
import Projects from "@/components/projects/Projects";

export default function Home() {
  return (
    <IntroGate>
      <Navbar />
      <main>
        <SkullHero />
        <Vision />
        <Projects />
      </main>
      <Footer />
    </IntroGate>
  );
}
