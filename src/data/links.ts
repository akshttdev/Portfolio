export const LINKS = {
  mail: "mailto:akshttt.dev@gmail.com",
  x: "https://x.com/akshttdev",
  linkedin: "https://www.linkedin.com/in/akshatdhami/",
  github: "https://github.com/akshttdev",
  cal: "https://cal.com/akshtt/meeting-with-akshat",
  resume:
    "https://drive.google.com/drive/folders/1jZGznxWpaR7PZEiohbVRxG_3Sn1WAIGg?dmr=1&ec=wgc-drive-hero-goto",
} as const;

export type SocialLinkData = {
  label: string;
  href: string;
  /** Scramble the label on hover */
  scramble?: boolean;
  /** Fixed width on desktop, so the row doesn't shift while a label scrambles */
  width?: string;
};

export const NAV_SOCIALS: SocialLinkData[] = [
  { label: "X", href: LINKS.x, width: "w-[1.8rem]" },
  { label: "LN", href: LINKS.linkedin, width: "w-[2rem]" },
  { label: "MAIL", href: LINKS.mail, width: "w-[2.7rem]", scramble: true },
  { label: "CAL", href: LINKS.cal, width: "w-[2.2rem]", scramble: true },
  { label: "RESUME", href: LINKS.resume, width: "w-[3.7rem]", scramble: true },
];

export const FOOTER_LINKS: SocialLinkData[] = [
  { label: "mail", href: LINKS.mail },
  { label: "linkedin", href: LINKS.linkedin },
  { label: "twitter", href: LINKS.x },
  { label: "github", href: LINKS.github },
  { label: "meeting", href: LINKS.cal },
];
