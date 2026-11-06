import TextScramble from "@/components/text/TextScramble";
import type { SocialLinkData } from "@/data/links";

type Props = Pick<SocialLinkData, "href" | "label" | "scramble"> & { className?: string };

/** A contact/social link. Web links open in a new tab; mailto links don't. */
export default function SocialLink({ href, label, scramble, className }: Props) {
  const external = /^https?:/.test(href);
  return (
    <a
      href={href}
      className={className}
      {...(external && { target: "_blank", rel: "noopener noreferrer" })}
    >
      {scramble ? <TextScramble text={label} /> : label}
    </a>
  );
}
