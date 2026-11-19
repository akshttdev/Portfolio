import RandomLetterReveal from "@/components/text/RandomLetterReveal";

const LINE = "SOFTWARE DEVELOPER BASED IN MUNICH";

/** The hero title, one small line, shared by the WebGPU hero and its fallback. */
export default function HeroHeadline({ className = "" }: { className?: string }) {
  return (
    <h1 className={className}>
      <RandomLetterReveal word={LINE} className="whitespace-nowrap font-semibold tracking-[0.02em] text-[13px] sm:text-[15px] md:text-[17px]" />
    </h1>
  );
}
