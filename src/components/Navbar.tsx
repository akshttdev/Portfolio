"use client";
import Link from "next/link";
import TextScramble from "./TextScramble";
import { animate } from "framer-motion";
import { usePathname, useRouter } from "next/navigation";

const Navbar = () => {
  const currentYear = new Date().getFullYear();
  const router = useRouter();
  const pathname = usePathname();

  const handleHomeClick = () => {
    if (pathname === "/") {
      animate(window.scrollY, 0, {
        duration: 1,
        onUpdate: (latest) => window.scrollTo(0, latest),
      });
    } else {
      router.push("/");
    }
  };

  return (
    <nav className="fixed top-0 w-full z-[1001] px-6 py-6 select-none mix-blend-exclusion">
      {/* ================= MOBILE NAV (single line) ================= */}
      <div className="md:hidden w-full flex items-center justify-between whitespace-nowrap px-2">
        {/* Left — AKSHAT */}
        <span onClick={handleHomeClick} className="nav-txt cursor-pointer">
          <TextScramble enterText="AKSHAT" />
        </span>

        {/* Center — ABOUT + YEAR */}
        <div className="flex items-center gap-x-4">
          <Link href="/about" className="nav-txt">
            <TextScramble enterText="ABOUT" />
          </Link>
          <span className="nav-txt">@{currentYear}</span>
        </div>

        {/* Right — SOCIALS */}
        <div className="flex items-center gap-x-4">
          <a
            href="https://x.com/akshttdev"
            target="_blank"
            rel="noopener noreferrer"
            className="nav-txt"
          >
            X
          </a>
          <a
            href="https://www.linkedin.com/in/akshatdhami/"
            target="_blank"
            rel="noopener noreferrer"
            className="nav-txt"
          >
            LN
          </a>
          <a href="mailto:akshttt.dev@gmail.com" className="nav-txt">
            <TextScramble enterText="MAIL" />
          </a>
          <a
            href="https://cal.com/akshtt/meeting-with-akshat"
            target="_blank"
            rel="noopener noreferrer"
            className="nav-txt"
          >
            <TextScramble enterText="CAL" />
          </a>
          <a
            href="https://drive.google.com/drive/folders/1jZGznxWpaR7PZEiohbVRxG_3Sn1WAIGg?dmr=1&ec=wgc-drive-hero-goto"
            className="nav-txt"
          >
            <TextScramble enterText="RESUME" />
          </a>
        </div>
      </div>

      {/* ================= DESKTOP NAV (unchanged) ================= */}
      <ul className="relative w-full h-full hidden md:block">
        {/* LEFT — AKSHAT */}
        <li className="absolute left-0 top-1/2 -translate-y-1/2">
          <span onClick={handleHomeClick} className="nav-txt cursor-pointer">
            <TextScramble enterText="AKSHAT" />
          </span>
        </li>

        {/* CENTER — ABOUT + YEAR */}
        <li className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <div className="flex items-center gap-x-18">
            <div className="w-[5rem] text-left">
              <Link href="/about" className="nav-txt">
                <TextScramble enterText="ABOUT" />
              </Link>
            </div>
            <span className="nav-txt">@{currentYear}</span>
          </div>
        </li>

        {/* RIGHT — SOCIALS */}
        <li className="absolute right-0 top-1/2 -translate-y-1/2">
          <div className="flex items-center gap-x-6">
            <div className=" w-[1.8rem] text-left">
              <a
                href="https://x.com/akshttdev"
                target="_blank"
                rel="noopener noreferrer"
                className="nav-txt"
              >
                X
              </a>
            </div>

            <div className=" w-[2rem] text-left">
              <a
                href="https://www.linkedin.com/in/akshatdhami/"
                target="_blank"
                rel="noopener noreferrer"
                className="nav-txt"
              >
                LN
              </a>
            </div>
            <div className=" w-[2.7rem] text-left">
              <a href="mailto:akshttt.dev@gmail.com" className="nav-txt">
                <TextScramble enterText="MAIL" />
              </a>
            </div>
            <div className="w-[2.2rem] text-left">
              <a
                href="https://cal.com/akshtt/meeting-with-akshat"
                target="_blank"
                rel="noopener noreferrer"
                className="nav-txt"
              >
                <TextScramble enterText="CAL" />
              </a>
            </div>
            <div className="w-[3.7rem] text-left">
              <a
                href="https://drive.google.com/drive/folders/1jZGznxWpaR7PZEiohbVRxG_3Sn1WAIGg?dmr=1&ec=wgc-drive-hero-goto"
                className="nav-txt"
              >
                <TextScramble enterText="RESUME" />
              </a>
            </div>
          </div>
        </li>
      </ul>
    </nav>
  );
};

export default Navbar;
