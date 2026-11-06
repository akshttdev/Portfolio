import RandomLetterReveal from "@/components/text/RandomLetterReveal";

const LINES = ["SOFTWARE DEVELOPER", "BASED IN MUNICH, GERMANY"];
const BASE = "font-extrabold tracking-tight leading-[0.9] whitespace-nowrap";

type Props = {
  className?: string;
  /** Font sizes for both lines */
  lineClassName: string;
  /** Space under the first line */
  gapClassName: string;
};

/** The two-line hero title, shared by the WebGPU hero and its fallback. */
export default function HeroHeadline({ className, lineClassName, gapClassName }: Props) {
  return (
    <h1 className={className}>
      {LINES.map((line, i) => (
        <span key={line} className="block">
          <RandomLetterReveal word={line} className={`${BASE} ${lineClassName} ${i === 0 ? gapClassName : ""}`} />
        </span>
      ))}
    </h1>
  );
}
