import type { Metadata } from "next";
import HorizontalTransition from "@/components/transitions/HorizontalTransition";
import Navbar from "@/components/layout/Navbar";
import MusicOrbit from "@/components/about/MusicOrbit";

export const metadata: Metadata = { title: "On rotation" };

/** The ring of favourite tracks. Only linked from under the sets on the home page ("Tracks on rotation"). */
export default function RotationPage() {
  return (
    <HorizontalTransition>
      <Navbar />
      <main>
        <MusicOrbit />
      </main>
    </HorizontalTransition>
  );
}
