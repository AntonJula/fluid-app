"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

// Global map to store scroll positions across route changes
const scrollMap = new Map<string, number>();

export function getScrollPosition(path: string): number {
  return scrollMap.get(path) || 0;
}

export function saveScrollPosition(
  path: string,
  position = typeof window !== "undefined" ? window.scrollY : 0
): void {
  scrollMap.set(path, position);
}

export function useScrollPreservation() {
  const pathname = usePathname();
  const pathnameRef = useRef(pathname);

  // Restore scroll when pathname changes
  useEffect(() => {
    const previousPath = pathnameRef.current;
    const newPath = pathname;

    saveScrollPosition(previousPath);
    pathnameRef.current = newPath;

    // Wait for the new page to be properly inserted into the DOM
    requestAnimationFrame(() => {
      const savedScroll = getScrollPosition(newPath);
      window.scrollTo(0, savedScroll);
    });
  }, [pathname]);

  // Track scroll positions for the current path
  useEffect(() => {
    const handleScroll = () => {
      saveScrollPosition(pathnameRef.current);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });

    // Also save current scroll before unmount/route-change
    return () => {
      window.removeEventListener("scroll", handleScroll);
      saveScrollPosition(pathnameRef.current);
    };
  }, []);
}

export function ScrollPreserver() {
  useScrollPreservation();
  return null;
}
