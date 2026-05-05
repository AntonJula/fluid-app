"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { getScrollPosition, saveScrollPosition } from "@/hooks/useScrollPreservation";
import { resetSwipeUiState, setSwipeUiState } from "@/hooks/useSwipeUiState";
import HomePage from "@/app/page";
import StatsPage from "@/app/stats/page";
import SettingsPage from "@/app/settings/page";

const PAGES = ["/", "/stats", "/settings"] as const;
const NAV_TRIGGER = 96;
const NAV_ANIMATION_MS = 320;
const ROUTE_SETTLE_MS = 420;
const SHELL_DRAG_RATIO = 1;

type SwipeDirection = "left" | "right" | null;

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
  const navigationTimerRef = useRef<number | null>(null);
  const settlePreviewTimerRef = useRef<number | null>(null);
  const queuedOffsetRef = useRef(0);
  const draggingRef = useRef(false);
  const isNavigatingRef = useRef(false);
  const isCompletingSwipeRef = useRef(false);
  const offsetRef = useRef(0);
  const directionRef = useRef<SwipeDirection>(null);
  const targetPathRef = useRef<string | null>(null);
  const [direction, setDirection] = useState<SwipeDirection>(null);
  const [targetPath, setTargetPath] = useState<string | null>(null);
  const [isCompletingSwipe, setIsCompletingSwipe] = useState(false);

  const syncTransitioningState = useCallback((isTransitioning: boolean) => {
    const root = document.documentElement;

    if (isTransitioning) {
      root.dataset.swipeTransitioning = "true";
      setSwipeUiState({ isTransitioning });
    } else {
      delete root.dataset.swipeTransitioning;
      setSwipeUiState({ isTransitioning, frozenPathname: null });
    }
  }, []);

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

    setSwipeUiState({ isDragging });
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
      isCompletingSwipeRef.current = false;
      setIsCompletingSwipe(false);
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

      if (navigationTimerRef.current !== null) {
        window.clearTimeout(navigationTimerRef.current);
      }

      if (settlePreviewTimerRef.current !== null) {
        window.clearTimeout(settlePreviewTimerRef.current);
      }

      const root = document.documentElement;
      root.style.setProperty("--swipe-shell-offset", "0px");
      root.style.setProperty("--swipe-shell-scale", "1");
      root.style.setProperty("--swipe-shell-dim", "0");
      root.style.setProperty("--swipe-shell-shadow", "0");
      root.style.setProperty("--swipe-preview-progress", "0");
      delete root.dataset.swipeDragging;
      delete root.dataset.swipeTransitioning;
      resetSwipeUiState();
    };
  }, [applyVisualState]);

  useLayoutEffect(() => {
    if (navigationTimerRef.current !== null) {
      window.clearTimeout(navigationTimerRef.current);
      navigationTimerRef.current = null;
    }

    if (settlePreviewTimerRef.current !== null) {
      window.clearTimeout(settlePreviewTimerRef.current);
      settlePreviewTimerRef.current = null;
    }

    const arrivedFromSwipe =
      isCompletingSwipeRef.current &&
      isNavigatingRef.current &&
      targetPathRef.current === pathname &&
      directionRef.current !== null;

    const root = document.documentElement;
    root.dataset.swipeDragging = "true";
    root.style.setProperty("--swipe-shell-offset", "0px");
    root.style.setProperty("--swipe-shell-scale", "1");
    root.style.setProperty("--swipe-shell-dim", "0");
    root.style.setProperty("--swipe-shell-shadow", "0");
    root.style.setProperty("--swipe-preview-progress", arrivedFromSwipe ? "1" : "0");
    delete root.dataset.swipeTransitioning;

    isNavigatingRef.current = false;
    offsetRef.current = 0;
    queuedOffsetRef.current = 0;
    draggingRef.current = false;
    touchStartRef.current = null;
    setSwipeUiState({ isDragging: false, isTransitioning: false, frozenPathname: null });

    const releaseTransitionFrame = window.requestAnimationFrame(() => {
      delete root.dataset.swipeDragging;
    });

    if (arrivedFromSwipe) {
      settlePreviewTimerRef.current = window.setTimeout(() => {
        syncPreviewState(null, null);
        isCompletingSwipeRef.current = false;
        setIsCompletingSwipe(false);
        settlePreviewTimerRef.current = null;
        root.style.setProperty("--swipe-preview-progress", "0");
      }, ROUTE_SETTLE_MS);
    } else {
      clearPreviewTimerRef.current = window.setTimeout(() => {
        syncPreviewState(null, null);
        isCompletingSwipeRef.current = false;
        setIsCompletingSwipe(false);
        clearPreviewTimerRef.current = null;
        root.style.setProperty("--swipe-preview-progress", "0");
      }, 0);
    }

    return () => {
      window.cancelAnimationFrame(releaseTransitionFrame);
    };
  }, [pathname, syncPreviewState]);

  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      if (isNavigatingRef.current) return;

      if (clearPreviewTimerRef.current !== null) {
        window.clearTimeout(clearPreviewTimerRef.current);
        clearPreviewTimerRef.current = null;
      }

      isCompletingSwipeRef.current = false;
      setIsCompletingSwipe(false);
      setSwipeUiState({ frozenPathname: pathname });
      saveScrollPosition(pathname);

      touchStartRef.current = {
        x: e.targetTouches[0].clientX,
        y: e.targetTouches[0].clientY,
      };
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!touchStartRef.current || isNavigatingRef.current) return;

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
        router.prefetch(nextTargetPath);
      }

      offsetRef.current = nextOffset;
      queueVisualState(nextOffset, true);
    };

    const handleTouchEnd = () => {
      if (!touchStartRef.current || isNavigatingRef.current) return;

      const shouldNavigate =
        Boolean(targetPathRef.current) && Math.abs(offsetRef.current) >= NAV_TRIGGER;

      const nextPath = targetPathRef.current;
      const nextDirection = directionRef.current;

      touchStartRef.current = null;

      if (shouldNavigate && nextPath && nextDirection) {
        const exitOffset =
          (typeof window !== "undefined" ? window.innerWidth : 400) *
          (nextDirection === "left" ? -1 : 1);

        isNavigatingRef.current = true;
        isCompletingSwipeRef.current = true;
        setIsCompletingSwipe(true);
        syncTransitioningState(true);
        saveScrollPosition(pathname);
        offsetRef.current = exitOffset;
        queueVisualState(exitOffset, false);
        navigationTimerRef.current = window.setTimeout(() => {
          navigationTimerRef.current = null;
          router.push(nextPath, { scroll: false });
        }, NAV_ANIMATION_MS);
        return;
      }

      offsetRef.current = 0;
      queueVisualState(0, false);
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
  }, [clearPreview, pathname, queueVisualState, router, syncPreviewState, syncTransitioningState]);

  if (!direction || !targetPath) return null;

  const isLeft = direction === "left";
  const isPreviewSettling = isCompletingSwipe && targetPath === pathname;
  const previewScrollTop = targetPath ? getScrollPosition(targetPath) : 0;
  
  const previewContent =
    targetPath === "/" ? (
      <HomePage />
    ) : targetPath === "/stats" ? (
      <StatsPage />
    ) : (
      <SettingsPage />
    );

  return (
    <div className={`pointer-events-none fixed inset-0 overflow-hidden ${isPreviewSettling ? "z-[90]" : "z-[4]"}`}>
      <div
        className="absolute inset-0"
        style={{
          transform: isPreviewSettling
            ? "translateX(0px)"
            : `translateX(calc(${isLeft ? "100%" : "-100%"} + var(--swipe-shell-offset, 0px)))`,
          opacity: 1,
          transition: isPreviewSettling ? "none" : "var(--swipe-shell-transition)",
        }}
        >
        <div className="relative h-full w-full overflow-hidden">
          <div
            className="absolute inset-x-0 top-0 min-h-[100dvh] w-full will-change-transform"
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
