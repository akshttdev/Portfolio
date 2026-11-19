import FadeUp from "./FadeUp";
import HoverImageReveal from "@/components/text/HoverImageReveal";
import { AWAY_FROM_THE_MONITOR } from "@/data/music";

const P = "para-txt";

/** The bio text on the right. Server-rendered; only the fade and the hover photo run on the client. */
export default function AboutBio() {
  return (
    <main className="relative z-20 flex min-h-screen w-full items-center justify-end px-5 pb-24 pt-48 md:px-20 max-sm:justify-center max-sm:pt-36">
      <FadeUp className="max-w-xl space-y-7 text-left">
        <p className="ui-txt text-blood">(About)</p>
        <p className={P}>
          <HoverImageReveal label="Akshat" image="/images/about/cat.jpg" width={320} height={320} /> is someone who runs on curiosity,
          instinct, and a slightly obsessive need to make things feel intentional. He digs deep into ideas, takes
          them apart, questions the obvious, and rebuilds them with cleaner structure and sharper personality.
        </p>

        <p className={P}>
          He learns fast, experiments without fear, and pushes visuals until they stop feeling random. Whether
          it&apos;s code, motion, product logic, or design systems, the goal is always the same: make it feel alive
          and make it feel right.
        </p>

        <p className={P}>
          Away from the monitor he&apos;s still restless, and most nights he&apos;s behind the decks.
        </p>

        <ul className="ui-txt grid grid-cols-2 gap-x-6 gap-y-3 border-t border-bone/15 pt-5 sm:grid-cols-3">
          {AWAY_FROM_THE_MONITOR.map((item) => (
            <li key={item.label}>
              <span className="block">{item.label}</span>
              <span className="block text-bone/50">{item.note}</span>
            </li>
          ))}
        </ul>
      </FadeUp>
    </main>
  );
}
