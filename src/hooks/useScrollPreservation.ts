"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

// Global map to store scroll positions across route changes
const scrollMap = new Map<string, number>();

export function getScrollPosition(path: string): number {
  return scrollMap.get(path) || 0;
}

export function useScrollPreservation() {
  const pathname = usePathname();
  const pathnameRef = useRef(pathname);

  // Restore scroll when pathname changes
  useEffect(() => {
    const newPath = pathname;
    
    // Wait for the new page to be properly inserted into the DOM
    requestAnimationFrame(() => {
      const savedScroll = scrollMap.get(newPath) || 0;
      window.scrollTo(0, savedScroll);
    });
    
    pathnameRef.current = newPath;
  }, [pathname]);

  // Track scroll positions for the current path
  useEffect(() => {
    let timeoutId: number;
    
    const handleScroll = () => {
      if (timeoutId) window.clearTimeout(timeoutId);
      
      timeoutId = window.setTimeout(() => {
        // Record precise scroll of the CURRENT path when scroll happens
        scrollMap.set(pathnameRef.current, window.scrollY);
      }, 30);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    
    // Also save current scroll before unmount/route-change
    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (timeoutId) window.clearTimeout(timeoutId);
      scrollMap.set(pathnameRef.current, window.scrollY);
    };
  }, []);
}

export function ScrollPreserver() {
  useScrollPreservation();
  return null;
}
