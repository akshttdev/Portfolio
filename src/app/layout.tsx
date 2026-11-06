import type { Metadata } from "next";
import "lenis/dist/lenis.css";
import "./globals.css";
import TitleSwitcher from "../components/TitleSwitcher";
import SmoothScroll from "../components/SmoothScroll";
import { Analytics } from "@vercel/analytics/next";

export const metadata: Metadata = {
  title: "Akshat | Software Developer",
  description: "Wired to fixate, break things apart and push them past the obvious. Discomfort drives growth. Persistence until meaning shows up.",
  icons: {
    icon: "/logo.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/logo.png" sizes="any" />
        {/* The two Roobert weights the site actually renders. Preloading lets them download in parallel
            with the HTML instead of only after the CSS is parsed and text is laid out. */}
        <link rel="preload" href="/fonts/RoobertPRO-Bold.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
        <link rel="preload" href="/fonts/RoobertPRO-Medium.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
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
