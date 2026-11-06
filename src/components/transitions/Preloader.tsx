"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, type Variants } from "framer-motion";
import Counter from "./Counter";
import { skullReadyPromise } from "@/lib/skullReady";
import { EASE_IN_OUT, EASE_OUT } from "@/animations/anim";
import { YEAR } from "@/lib/site";

// Safety net: never let the preloader block the site indefinitely
const MAX_WAIT_MS = 12000;

const counterVariants: Variants = {
  initial: { y: "150%" },
  animate: { y: "0%", transition: { duration: 0.5, ease: EASE_OUT } },
  exit: { y: "-150%", transition: { duration: 0.5, ease: EASE_IN_OUT } },
};

const overlayVariants: Variants = {
  initial: { opacity: 1 },
  animate: { opacity: 1 },
  exit: { opacity: 0, transition: { duration: 0.6, ease: EASE_IN_OUT } },
};

/** First-visit overlay: counts to 100 while the 3D hero loads, then slides away. */
export default function Preloader() {
  const [countDone, setCountDone] = useState(false);
  const [skullDone, setSkullDone] = useState(false);
  const [counterOut, setCounterOut] = useState(false);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const done = () => !cancelled && setSkullDone(true);
    skullReadyPromise.then(done);
    const fallback = setTimeout(done, MAX_WAIT_MS);
    return () => {
      cancelled = true;
      clearTimeout(fallback);
    };
  }, []);

  useEffect(() => {
    if (!countDone || !skullDone) return;
    const t1 = setTimeout(() => setCounterOut(true), 350);
    const t2 = setTimeout(() => setHidden(true), 850);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [countDone, skullDone]);

  return (
    <AnimatePresence>
      {!hidden && (
        <motion.div
          key="preloader-overlay"
          variants={overlayVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          className="fixed inset-0 z-[2000] noise"
        >
          <div className="bg-[#020202] h-screen flex items-center justify-center px-6">
            <div className="size-full flex items-center">
              <div className="w-full h-[150px] flex items-center justify-between overflow-hidden">
                <AnimatePresence>
                  {!counterOut && (
                    <motion.div
                      key="preloader-counter"
                      variants={counterVariants}
                      initial="initial"
                      animate="animate"
                      exit="exit"
                      className="w-full flex items-center justify-between"
                    >
                      <p className="hero-txt">
                        <Counter to={100} duration={1.1} delay={0.1} onEnd={() => setCountDone(true)} />
                      </p>
                      <p className="hero-txt">{YEAR}©</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
