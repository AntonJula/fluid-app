"use client";

import React, { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { motion, AnimatePresence, PanInfo } from "framer-motion";

const PAGES = ["/stats", "/", "/settings"];

export function PageTransitionProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [prevPath, setPrevPath] = useState(pathname);
  const [direction, setDirection] = useState(0);

  useEffect(() => {
    if (pathname !== prevPath) {
      const currentIndex = PAGES.indexOf(pathname);
      const prevIndex = PAGES.indexOf(prevPath);
      
      // Dacă prevIndex e -1 înseamnă că venim de pe o rută neînregistrată, dăm default spre stânga.
      if (currentIndex > prevIndex && prevIndex !== -1) {
        setDirection(1);
      } else if (currentIndex < prevIndex && prevIndex !== -1) {
        setDirection(-1);
      } else {
        setDirection(1);
      }
      
      setPrevPath(pathname);
    }
  }, [pathname, prevPath]);

  const swipeConfidenceThreshold = 10000;
  const swipePower = (offset: number, velocity: number) => {
    return Math.abs(offset) * velocity;
  };

  const handleDragEnd = (e: any, { offset, velocity }: PanInfo) => {
    const swipe = swipePower(offset.x, velocity.x);
    const currentIndex = PAGES.indexOf(pathname);
    
    // Swipe left (spre stânga pe ecran, degetul de la dreapta la stânga) -> Pagina următoare
    if (swipe < -swipeConfidenceThreshold && offset.x < -30) {
      if (currentIndex < PAGES.length - 1) {
        router.push(PAGES[currentIndex + 1]);
      }
    } 
    // Swipe right (spre dreapta pe ecran, degetul de la stânga la dreapta) -> Pagina anterioară
    else if (swipe > swipeConfidenceThreshold && offset.x > 30) {
      if (currentIndex > 0) {
        router.push(PAGES[currentIndex - 1]);
      }
    }
  };

  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? "100%" : "-100%",
      opacity: 1,
      zIndex: 2,
      boxShadow: direction > 0 ? "-20px 0 40px rgba(0,0,0,0.3)" : "20px 0 40px rgba(0,0,0,0.3)"
    }),
    center: {
      x: 0,
      zIndex: 1,
      opacity: 1,
      boxShadow: "0px 0 0px rgba(0,0,0,0)"
    },
    exit: (direction: number) => ({
      x: direction < 0 ? "30%" : "-30%",
      opacity: 0.6,
      zIndex: 0,
    })
  };

  // Evităm animația de slide in la prima încărcare (când prevPath și pathname sunt la fel)
  const isInitialRender = prevPath === pathname && direction === 0;

  return (
    <div className="flex-1 relative w-full h-full overflow-hidden bg-background">
      <AnimatePresence initial={false} custom={direction} mode="popLayout">
        <motion.div
          key={pathname}
          custom={direction}
          variants={isInitialRender ? {} : variants}
          initial={isInitialRender ? "center" : "enter"}
          animate="center"
          exit="exit"
          transition={{
            x: { type: "spring", stiffness: 300, damping: 30 },
            opacity: { duration: 0.2 }
          }}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.8}
          onDragEnd={handleDragEnd}
          className="absolute inset-0 w-full h-full overflow-y-auto overflow-x-hidden will-change-transform [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
        >
          <div className="pb-28 w-full min-h-full flex flex-col">
            {children}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
