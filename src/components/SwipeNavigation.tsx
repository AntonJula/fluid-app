"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { usePathname, useRouter } from "next/navigation";
import { getScrollPosition, saveScrollPosition } from "@/hooks/useScrollPreservation";

const PAGES = ["/", "/stats", "/settings"] as const;
const NAV_TRIGGER = 120;
const SHELL_DRAG_RATIO = 1;

type SwipeDirection = "left" | "right" | null;

function PreviewFallback({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  return (
    <main className="flex min-h-[100dvh] w-full max-w-md mx-auto items-center justify-center p-6 pb-24 pt-6">
      <div className="w-full rounded-[2rem] border border-white/10 bg-water-900/35 p-6 text-center shadow-[0_18px_40px_rgba(0,0,0,0.18)] backdrop-blur-md">
        <p className="font-display text-4xl font-black text-white">{title}</p>
        <p className="font-body mt-2 text-sm text-water-300/80">{subtitle}</p>
      </div>
    </main>
  );
}

const HomePreview = dynamic(() => import("@/app/page"), {
  ssr: false,
  loading: () => <PreviewFallback title="Fluid." subtitle="Loading home preview..." />,
});

const StatsPreview = dynamic(() => import("@/app/stats/page"), {
  ssr: false,
  loading: () => <PreviewFallback title="Your Stats." subtitle="Loading stats preview..." />,
});

const SettingsPreview = dynamic(() => import("@/app/settings/page"), {
  ssr: false,
  loading: () => <PreviewFallback title="Settings." subtitle="Loading settings preview..." />,
});

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function getTargetPath(pathname: string, direction: Exclude<SwipeDirection, null>) {
  const currentIndex = PAGES.indexOf(pathname as (typeof PAGES)[number]);
  const safeIndex = currentIndex === -1 ? 0 : currentIndex;

  if (direction === "left") {
    return PAGES[(safeIndex + 1) % PAGES.length];
  }

  return PAGES[(safeIndex - 1 + PAGES.length) % PAGES.length];
}

export function SwipeNavigation() {
  const router = useRouter();
  const pathname = usePathname();
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const frameRef = useRef<number | null>(null);
  const clearPreviewTimerRef = useRef<number | null>(null);
  const queuedOffsetRef = useRef(0);
  const draggingRef = useRef(false);
  const offsetRef = useRef(0);
  const directionRef = useRef<SwipeDirection>(null);
  const targetPathRef = useRef<string | null>(null);
  const [direction, setDirection] = useState<SwipeDirection>(null);
  const [targetPath, setTargetPath] = useState<string | null>(null);

  const applyVisualState = useCallback((offset: number, isDragging: boolean) => {
    const root = document.documentElement;
    const progress = Math.min(1, Math.abs(offset) / (typeof window !== "undefined" ? window.innerWidth : 400));

    root.style.setProperty("--swipe-shell-offset", `${offset}px`);
    root.style.setProperty("--swipe-shell-scale", "1");
    root.style.setProperty("--swipe-shell-dim", "0");
    root.style.setProperty("--swipe-shell-shadow", progress > 0 ? "0.18" : "0");
    root.style.setProperty("--swipe-preview-progress", progress.toFixed(4));

    if (isDragging) {
      root.dataset.swipeDragging = "true";
    } else {
      delete root.dataset.swipeDragging;
    }
  }, []);

  const queueVisualState = useCallback((offset: number, isDragging: boolean) => {
    queuedOffsetRef.current = offset;
    draggingRef.current = isDragging;

    if (frameRef.current !== null) return;

    frameRef.current = window.requestAnimationFrame(() => {
      frameRef.current = null;
      applyVisualState(queuedOffsetRef.current, draggingRef.current);
    });
  }, [applyVisualState]);

  const syncPreviewState = useCallback((nextDirection: SwipeDirection, nextTargetPath: string | null) => {
    directionRef.current = nextDirection;
    targetPathRef.current = nextTargetPath;
    setDirection(nextDirection);
    setTargetPath(nextTargetPath);
  }, []);

  const clearPreview = useCallback((delay = 0) => {
    if (clearPreviewTimerRef.current !== null) {
      window.clearTimeout(clearPreviewTimerRef.current);
    }

    clearPreviewTimerRef.current = window.setTimeout(() => {
      syncPreviewState(null, null);
      clearPreviewTimerRef.current = null;
    }, delay);
  }, [syncPreviewState]);

  useEffect(() => {
    applyVisualState(0, false);

    return () => {
      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current);
      }

      if (clearPreviewTimerRef.current !== null) {
        window.clearTimeout(clearPreviewTimerRef.current);
      }

      const root = document.documentElement;
      root.style.setProperty("--swipe-shell-offset", "0px");
      root.style.setProperty("--swipe-shell-scale", "1");
      root.style.setProperty("--swipe-shell-dim", "0");
      root.style.setProperty("--swipe-shell-shadow", "0");
      root.style.setProperty("--swipe-preview-progress", "0");
      delete root.dataset.swipeDragging;
    };
  }, [applyVisualState]);

  useEffect(() => {
    queueVisualState(0, false);
    clearPreview(0);
    offsetRef.current = 0;
    touchStartRef.current = null;
  }, [clearPreview, pathname, queueVisualState]);

  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      if (clearPreviewTimerRef.current !== null) {
        window.clearTimeout(clearPreviewTimerRef.current);
        clearPreviewTimerRef.current = null;
      }

      touchStartRef.current = {
        x: e.targetTouches[0].clientX,
        y: e.targetTouches[0].clientY,
      };
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!touchStartRef.current) return;

      const touch = e.targetTouches[0];
      const deltaX = touch.clientX - touchStartRef.current.x;
      const deltaY = touch.clientY - touchStartRef.current.y;

      if (Math.abs(deltaX) < 6) return;
      if (Math.abs(deltaX) <= Math.abs(deltaY) * 1.08) return;

      e.preventDefault();

      const nextDirection: Exclude<SwipeDirection, null> = deltaX < 0 ? "left" : "right";
      const nextTargetPath = getTargetPath(pathname, nextDirection);
      const maxOffset = typeof window !== "undefined" ? window.innerWidth : 400;
      const nextOffset = clamp(deltaX * SHELL_DRAG_RATIO, -maxOffset, maxOffset);

      if (directionRef.current !== nextDirection || targetPathRef.current !== nextTargetPath) {
        syncPreviewState(nextDirection, nextTargetPath);
      }

      offsetRef.current = nextOffset;
      queueVisualState(nextOffset, true);
    };

    const handleTouchEnd = () => {
      if (!touchStartRef.current) return;

      const shouldNavigate =
        Boolean(targetPathRef.current) && Math.abs(offsetRef.current) >= NAV_TRIGGER;

      const nextPath = targetPathRef.current;

      touchStartRef.current = null;
      offsetRef.current = 0;
      queueVisualState(0, false);

      if (shouldNavigate && nextPath) {
        syncPreviewState(null, null);
        saveScrollPosition(pathname);
        router.push(nextPath, { scroll: false });
        return;
      }

      clearPreview(260);
    };

    window.addEventListener("touchstart", handleTouchStart, { passive: true });
    window.addEventListener("touchmove", handleTouchMove, { passive: false });
    window.addEventListener("touchend", handleTouchEnd, { passive: true });
    window.addEventListener("touchcancel", handleTouchEnd, { passive: true });

    return () => {
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
      window.removeEventListener("touchcancel", handleTouchEnd);
    };
  }, [clearPreview, pathname, queueVisualState, router, syncPreviewState]);

  if (!direction || !targetPath) return null;

  const isLeft = direction === "left";
  const previewScrollTop = targetPath ? getScrollPosition(targetPath) : 0;
  
  const previewContent =
    targetPath === "/" ? (
      <HomePreview />
    ) : targetPath === "/stats" ? (
      <StatsPreview />
    ) : (
      <SettingsPreview />
    );

  return (
    <div className="pointer-events-none fixed inset-0 z-[4] overflow-hidden">
      <div
        className="absolute inset-0"
        style={{
          transform: `translateX(calc(${isLeft ? "100%" : "-100%"} + var(--swipe-shell-offset, 0px)))`,
          opacity: 1,
          transition: "none",
        }}
      >
        <div className="relative h-full w-full overflow-hidden">
          <div 
            className="flex-1 flex flex-col pb-28 relative w-full h-full"
            style={{ transform: `translateY(-${previewScrollTop}px)` }}
          >
            {previewContent}
          </div>
          <div
            className={`absolute inset-y-0 ${isLeft ? "right-0" : "left-0"} w-6 bg-gradient-to-r from-black/10 to-transparent z-50`}
            style={{ opacity: "calc(var(--swipe-preview-progress, 0) * 0.12)" }}
          />
        </div>
      </div>
    </div>
  );
}
