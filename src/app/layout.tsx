import type { Metadata } from "next";
import type { ReactNode } from "react";
import "lenis/dist/lenis.css";
import "./globals.css";
import TitleSwitcher from "@/components/system/TitleSwitcher";
import SmoothScroll from "@/components/system/SmoothScroll";
import { Analytics } from "@vercel/analytics/next";

export const metadata: Metadata = {
  title: { default: "Akshat | Software Developer", template: "%s | Akshat" },
  description:
    "Wired to fixate, break things apart and push them past the obvious. Discomfort drives growth. Persistence until meaning shows up.",
  icons: { icon: "/logo.png" },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/* Bold is on screen first everywhere (nav, preloader, titles). Preloading it lets it download in
            parallel with the HTML instead of only after the CSS is parsed and text is laid out. */}
        <link rel="preload" href="/fonts/RoobertPRO-Bold.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
      </head>

      <body className="antialiased">
        <TitleSwitcher />
        <SmoothScroll />
        {children}
        <Analytics />
      </body>
    </html>
  );
}
