"use client";

import RandomLetterReveal from "./RandomLetterReveal";

const PARAGRAPH_TEXT =
  "I ENGINEER RELIABLE, SCALABLE SOFTWARE ACROSS THE FULL STACK. FROM SYSTEM DESIGN AND APIS TO DATABASES, INFRASTRUCTURE AND THE INTERFACES ON TOP, I CARE ABOUT CLEAN ARCHITECTURE, PERFORMANCE, AND CODE THAT HOLDS UP IN PRODUCTION. I LIKE BREAKING DOWN HARD PROBLEMS, MEASURING WHAT MATTERS, AND SHIPPING SYSTEMS THAT ARE FAST, MAINTAINABLE AND BUILT TO LAST. ALWAYS BUILDING, ALWAYS LEARNING.";

type Props = {
  className: string;
};

export default function HeroParagraph({ className }: Props) {
  return (
    <div className="min-w-0 max-w-[90%] sm:max-w-[80%] md:max-w-md text-left md:text-right">
      <RandomLetterReveal word={PARAGRAPH_TEXT} className={className} />
    </div>
  );
}
