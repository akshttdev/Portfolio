const BG_WORDS = [
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

/** Intro line top-left, plus the faint stack of skill words behind the bio. */
export default function AboutBackdrop() {
  return (
    <>
      <div className="absolute z-20 font-semibold text-sm md:text-base uppercase tracking-wide whitespace-pre-line select-none pointer-events-none max-sm:left-0 top-24 left-8 md:top-44 md:left-48 text-[1rem]">
        {"I could oversell myself here,\nbut I bet GPT-5.1 could do better."}
      </div>

      <div
        aria-hidden="true"
        className="absolute left-4 top-1/2 -translate-y-1/2 flex flex-col opacity-[0.045] leading-[0.8] select-none pointer-events-none space-y-[-1rem] max-sm:hidden"
      >
        {BG_WORDS.map((w) => (
          <p
            key={w}
            className="uppercase font-extrabold tracking-tighter whitespace-nowrap text-[6rem] sm:text-[8rem] md:text-[10rem] lg:text-[12rem]"
          >
            {w}
          </p>
        ))}
      </div>
    </>
  );
}
