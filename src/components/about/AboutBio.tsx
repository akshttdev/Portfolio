import FadeUp from "./FadeUp";
import HoverImageReveal from "@/components/text/HoverImageReveal";

const P = "max-sm:text-s text-[1.1rem] opacity-95 leading-relaxed font-semibold uppercase";

/** The bio text on the right. Server-rendered; only the fade and the hover photo run on the client. */
export default function AboutBio() {
  return (
    <main className="w-full min-h-screen flex items-center justify-end md:px-20 relative z-20 pt-60 max-sm:justify-center max-sm:pt-40">
      <FadeUp className="max-w-xl space-y-8 text-left max-sm:max-w-sm max-sm:text-left max-sm:pt-10">
        <p className={P}>
          <HoverImageReveal label="Akshat" image="/images/about/home.jpg" /> is someone who runs on curiosity,
          instinct, and a slightly obsessive need to make things feel intentional. He digs deep into ideas, takes
          them apart, questions the obvious, and rebuilds them with cleaner structure and sharper personality.
        </p>

        <p className={P}>
          He learns fast, experiments without fear, and pushes visuals until they stop feeling random. Whether
          it&apos;s code, motion, product logic, or design systems, the goal is always the same: make it feel alive
          and make it feel right.
        </p>

        <p className={P}>
          Away from the monitor, he’s still restless: traveling whenever he can, playing guitar, running long
          distances, obsessing over football, blasting metal or Bollywood..
        </p>
      </FadeUp>
    </main>
  );
}
