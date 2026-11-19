import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Inter_Tight } from "next/font/google";
import "lenis/dist/lenis.css";
import "./globals.css";
import TitleSwitcher from "@/components/system/TitleSwitcher";
import SmoothScroll from "@/components/system/SmoothScroll";
import { Analytics } from "@vercel/analytics/next";
import { SITE_URL } from "@/lib/site";

// A free stand-in for Neue Haas Grotesk Display: tight, neutral, good small and bold
const grotesk = Inter_Tight({ subsets: ["latin"], variable: "--font-grotesk", display: "swap" });

const TITLE = "Akshat | Software Developer";
const DESCRIPTION =
  "Wired to fixate, break things apart and push them past the obvious. Discomfort drives growth. Persistence until meaning shows up.";

// The preview image itself is app/opengraph-image.jpg (+ .alt.txt): Next adds the og:image tags for it
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: TITLE, template: "%s | Akshat" },
  description: DESCRIPTION,
  // favicon: app/icon.png + app/apple-icon.png (made by scripts/favicon.mjs)
  // No og:url here: every page inherits this block, and "/" would label /about links as the home page
  openGraph: { title: TITLE, description: DESCRIPTION, siteName: "Akshat", type: "website", locale: "en_US" },
  twitter: { card: "summary_large_image", title: TITLE, description: DESCRIPTION },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={grotesk.variable}>
      {/* film grain over everything (.noise in globals.css) */}
      <body className="noise bg-ink font-sans text-bone antialiased">
        <TitleSwitcher />
        <SmoothScroll />
        {children}
        <Analytics />
      </body>
    </html>
  );
}
