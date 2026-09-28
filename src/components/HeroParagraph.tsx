"use client";

import RandomLetterReveal from "./RandomLetterReveal";

const PARAGRAPH_TEXT =
  "I DESIGN AND BUILD SMOOTH, INTERACTIVE, AND VISUALLY ENGAGING DIGITAL EXPERIENCES. I BLEND UI/UX, MOTION, AND CLEAN ENGINEERING TO CREATE PRODUCTS THAT FEEL FAST, MODERN, AND HUMAN. I LOVE EXPERIMENTING WITH MOTION, INTERACTION, AND MICRO DETAILS THAT MAKE INTERFACES FEEL ALIVE. ALWAYS EXPLORING, ALWAYS LEARNING CRAFTING DIGITAL WORK THAT FEELS EXPRESSIVE, INTENTIONAL AND REALLY COOL.";

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
