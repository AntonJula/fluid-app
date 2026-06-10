"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { getAppScrollElement, getAppScrollY, scrollAppTo } from "@/utils/appScroll";

// Global map to store scroll positions across route changes
const scrollMap = new Map<string, number>();

export function getScrollPosition(path: string): number {
  return scrollMap.get(path) || 0;
}

export function saveScrollPosition(
  path: string,
  position = getAppScrollY()
): void {
  scrollMap.set(path, position);
}

export function useScrollPreservation() {
  const pathname = usePathname();
  const pathnameRef = useRef(pathname);
  const restoreFrameRef = useRef<number | null>(null);
  const restoreTimerRef = useRef<number | null>(null);

  const restoreScroll = (path: string) => {
    const savedScroll = getScrollPosition(path);

    scrollAppTo(savedScroll);

    restoreFrameRef.current = requestAnimationFrame(() => {
      scrollAppTo(savedScroll);
    });

    restoreTimerRef.current = window.setTimeout(() => {
      scrollAppTo(savedScroll);
      restoreTimerRef.current = null;
    }, 90);
  };

  // Restore scroll when pathname changes
  useEffect(() => {
    const previousPath = pathnameRef.current;
    const newPath = pathname;

    saveScrollPosition(previousPath);
    pathnameRef.current = newPath;

    if (restoreFrameRef.current !== null) {
      cancelAnimationFrame(restoreFrameRef.current);
    }

    if (restoreTimerRef.current !== null) {
      window.clearTimeout(restoreTimerRef.current);
    }

    restoreFrameRef.current = requestAnimationFrame(() => restoreScroll(newPath));
  }, [pathname]);

  // Track scroll positions for the current path
  useEffect(() => {
    const handleScroll = () => {
      saveScrollPosition(pathnameRef.current);
    };

    handleScroll();
    const scrollElement = getAppScrollElement();
    const target = scrollElement ?? window;
    target.addEventListener("scroll", handleScroll, { passive: true });

    // Also save current scroll before unmount/route-change
    return () => {
      target.removeEventListener("scroll", handleScroll);
      if (restoreFrameRef.current !== null) {
        cancelAnimationFrame(restoreFrameRef.current);
      }
      if (restoreTimerRef.current !== null) {
        window.clearTimeout(restoreTimerRef.current);
      }
      saveScrollPosition(pathnameRef.current);
    };
  }, []);
}

export function ScrollPreserver() {
  useScrollPreservation();
  return null;
}
