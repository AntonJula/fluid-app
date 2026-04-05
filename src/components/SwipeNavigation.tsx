"use client";

import { useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";

const PAGES = ["/stats", "/", "/settings"];

export function SwipeNavigation() {
  const router = useRouter();
  const pathname = usePathname();
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      touchStartRef.current = {
        x: e.targetTouches[0].clientX,
        y: e.targetTouches[0].clientY,
      };
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!touchStartRef.current) return;

      const touchEnd = e.changedTouches[0].clientX;
      const touchEndY = e.changedTouches[0].clientY;
      const distanceX = touchStartRef.current.x - touchEnd;
      const distanceY = Math.abs(touchStartRef.current.y - touchEndY);
      
      const isLeftSwipe = distanceX > 45;
      const isRightSwipe = distanceX < -45;

      // Ensure that the horizontal swipe is dominant
      if (Math.abs(distanceX) > distanceY * 1.5) {
        let currentIndex = PAGES.indexOf(pathname);
        if (currentIndex === -1) currentIndex = 0;

        if (isLeftSwipe && currentIndex < PAGES.length - 1) {
          router.push(PAGES[currentIndex + 1]);
        }
        if (isRightSwipe && currentIndex > 0) {
          router.push(PAGES[currentIndex - 1]);
        }
      }
      
      touchStartRef.current = null;
    };

    window.addEventListener("touchstart", handleTouchStart, { passive: true });
    window.addEventListener("touchend", handleTouchEnd, { passive: true });

    return () => {
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchend", handleTouchEnd);
    };
  }, [pathname, router]);

  return null;
}
