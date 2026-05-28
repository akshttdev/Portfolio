import { useEffect, useState, ReactNode } from "react";
import { AnimatePresence, motion, Variants } from "framer-motion";
import CountUp from "react-countup";
import { skullReadyPromise } from "@/lib/skullReady";

interface PreLoaderProps {
  children: ReactNode;
}

const EASE_OUT = [0.33, 1, 0.68, 1] as [number, number, number, number];
const EASE_IN_OUT = [0.65, 0, 0.35, 1] as [number, number, number, number];

const containerVariants: Variants = {
  initial: { y: "150%" },
  animate: {
    y: "0%",
    transition: { duration: 0.5, ease: EASE_OUT },
  },
  exit: {
    y: "-150%",
    transition: { duration: 0.5, ease: EASE_IN_OUT },
  },
};

const overlayVariants: Variants = {
  initial: { opacity: 1 },
  animate: { opacity: 1 },
  exit: {
    opacity: 0,
    transition: { duration: 0.6, ease: EASE_IN_OUT },
  },
};

function PreLoader({ children }: PreLoaderProps) {
  const [hideOverlay, setHideOverlay] = useState<boolean>(false);
  const [countDone, setCountDone] = useState<boolean>(false);
  const [skullDone, setSkullDone] = useState<boolean>(false);
  const [returnAnimation, setReturnAnimation] = useState<boolean>(false);
  const currentYear = new Date().getFullYear();

  const loadingComplete = countDone && skullDone;

  useEffect(() => {
    let cancelled = false;
    skullReadyPromise.then(() => {
      if (!cancelled) setSkullDone(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (loadingComplete) {
      const t1 = setTimeout(() => setReturnAnimation(true), 900);
      const t2 = setTimeout(() => setHideOverlay(true), 1500);
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
      };
    }
  }, [loadingComplete]);

  return (
    <>
      {children}
      <AnimatePresence>
        {!hideOverlay && (
          <motion.div
            key="preloader-overlay"
            variants={overlayVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="fixed inset-0 z-[2000] page stairs noise scrollbar-hide"
          >
            <div className="transition-container !bg-[#020202] h-screen flex items-center justify-center px-6">
              <div className="size-full flex items-center">
                <div className="w-full !h-[150px] flex items-center justify-between overflow-hidden">
                  <AnimatePresence>
                    {!returnAnimation && (
                      <motion.div
                        key="preloader-counter"
                        variants={containerVariants}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        className="w-full flex items-center justify-between"
                      >
                        <p className="hero-txt !text-s">
                          <CountUp
                            start={0}
                            end={100}
                            duration={2.2}
                            delay={0.25}
                            easingFn={(t, b, c, d) => {
                              t /= d;
                              return -c * t * (t - 2) + b;
                            }}
                            onEnd={() => setCountDone(true)}
                          />
                        </p>
                        <p className="hero-txt !text-s">{currentYear}©</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export default PreLoader;
