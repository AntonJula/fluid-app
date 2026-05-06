"use client";

import { useCallback, useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { saveScrollPosition } from "@/hooks/useScrollPreservation";
import { resetSwipeUiState, setSwipeUiState } from "@/hooks/useSwipeUiState";

const PAGES = ["/", "/stats", "/settings"] as const;
const HORIZONTAL_LOCK_PX = 10;
const NAV_TRIGGER_PX = 78;
const FLICK_TRIGGER_PX = 44;
const FLICK_VELOCITY_PX_PER_MS = 0.42;
const DRAG_RESISTANCE = 0.58;
const MAX_DRAG_OFFSET = 118;
const COMMIT_OFFSET = 34;
const COMMIT_DELAY_MS = 90;

type SwipeDirection = "left" | "right";

type TouchState = {
  startX: number;
  startY: number;
  startedAt: number;
  isHorizontal: boolean;
  isRejected: boolean;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function getTargetPath(pathname: string, direction: SwipeDirection) {
  const currentIndex = PAGES.indexOf(pathname as (typeof PAGES)[number]);
  const safeIndex = currentIndex === -1 ? 0 : currentIndex;

  if (direction === "left") {
    return PAGES[(safeIndex + 1) % PAGES.length];
  }

  return PAGES[(safeIndex - 1 + PAGES.length) % PAGES.length];
}

function isEditableTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;

  return Boolean(
    target.closest(
      'input, textarea, select, [contenteditable="true"], [role="dialog"], [data-swipe-ignore="true"]'
    )
  );
}

export function SwipeNavigation() {
  const router = useRouter();
  const pathname = usePathname();
  const touchStateRef = useRef<TouchState | null>(null);
  const frameRef = useRef<number | null>(null);
  const commitTimerRef = useRef<number | null>(null);
  const queuedOffsetRef = useRef(0);
  const offsetRef = useRef(0);
  const isNavigatingRef = useRef(false);

  const applyOffset = useCallback((offset: number) => {
    const root = document.documentElement;
    root.style.setProperty("--swipe-shell-offset", `${offset}px`);
  }, []);

  const queueOffset = useCallback(
    (offset: number) => {
      queuedOffsetRef.current = offset;

      if (frameRef.current !== null) return;

      frameRef.current = window.requestAnimationFrame(() => {
        frameRef.current = null;
        applyOffset(queuedOffsetRef.current);
      });
    },
    [applyOffset]
  );

  const setDragging = useCallback((isDragging: boolean) => {
    const root = document.documentElement;

    if (isDragging) {
      root.dataset.swipeDragging = "true";
      setSwipeUiState({ isDragging: true, isTransitioning: false });
      return;
    }

    delete root.dataset.swipeDragging;
    setSwipeUiState({ isDragging: false });
  }, []);

  const setTransitioning = useCallback((isTransitioning: boolean) => {
    const root = document.documentElement;

    if (isTransitioning) {
      root.dataset.swipeTransitioning = "true";
      setSwipeUiState({ isTransitioning: true });
      return;
    }

    delete root.dataset.swipeTransitioning;
    setSwipeUiState({ isTransitioning: false });
  }, []);

  const resetVisualState = useCallback(() => {
    offsetRef.current = 0;
    queuedOffsetRef.current = 0;
    setDragging(false);
    setTransitioning(false);
    applyOffset(0);
  }, [applyOffset, setDragging, setTransitioning]);

  useEffect(() => {
    resetVisualState();

    return () => {
      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current);
      }

      if (commitTimerRef.current !== null) {
        window.clearTimeout(commitTimerRef.current);
      }

      delete document.documentElement.dataset.swipeDragging;
      delete document.documentElement.dataset.swipeTransitioning;
      document.documentElement.style.setProperty("--swipe-shell-offset", "0px");
      resetSwipeUiState();
    };
  }, [pathname, resetVisualState]);

  useEffect(() => {
    const handleTouchStart = (event: TouchEvent) => {
      if (isNavigatingRef.current || event.targetTouches.length !== 1 || isEditableTarget(event.target)) return;

      if (commitTimerRef.current !== null) {
        window.clearTimeout(commitTimerRef.current);
        commitTimerRef.current = null;
      }

      const touch = event.targetTouches[0];
      touchStateRef.current = {
        startX: touch.clientX,
        startY: touch.clientY,
        startedAt: performance.now(),
        isHorizontal: false,
        isRejected: false,
      };
    };

    const handleTouchMove = (event: TouchEvent) => {
      const touchState = touchStateRef.current;
      if (!touchState || touchState.isRejected || isNavigatingRef.current || event.targetTouches.length !== 1) return;

      const touch = event.targetTouches[0];
      const deltaX = touch.clientX - touchState.startX;
      const deltaY = touch.clientY - touchState.startY;
      const absX = Math.abs(deltaX);
      const absY = Math.abs(deltaY);

      if (!touchState.isHorizontal) {
        if (absX < HORIZONTAL_LOCK_PX && absY < HORIZONTAL_LOCK_PX) return;

        if (absY > absX * 0.8) {
          touchState.isRejected = true;
          return;
        }

        touchState.isHorizontal = true;
        saveScrollPosition(pathname);
        setDragging(true);
      }

      event.preventDefault();

      const nextOffset = clamp(deltaX * DRAG_RESISTANCE, -MAX_DRAG_OFFSET, MAX_DRAG_OFFSET);
      offsetRef.current = nextOffset;
      queueOffset(nextOffset);
    };

    const handleTouchEnd = () => {
      const touchState = touchStateRef.current;
      touchStateRef.current = null;

      if (!touchState || touchState.isRejected || isNavigatingRef.current) return;

      setDragging(false);

      if (!touchState.isHorizontal) {
        resetVisualState();
        return;
      }

      const elapsed = Math.max(1, performance.now() - touchState.startedAt);
      const rawDistance = offsetRef.current / DRAG_RESISTANCE;
      const velocity = Math.abs(rawDistance) / elapsed;
      const shouldNavigate =
        Math.abs(offsetRef.current) >= NAV_TRIGGER_PX ||
        (Math.abs(rawDistance) >= FLICK_TRIGGER_PX && velocity >= FLICK_VELOCITY_PX_PER_MS);

      if (!shouldNavigate) {
        queueOffset(0);
        window.setTimeout(() => {
          if (!isNavigatingRef.current) resetVisualState();
        }, 220);
        return;
      }

      const direction: SwipeDirection = rawDistance < 0 ? "left" : "right";
      const nextPath = getTargetPath(pathname, direction);
      const commitOffset = direction === "left" ? -COMMIT_OFFSET : COMMIT_OFFSET;

      isNavigatingRef.current = true;
      saveScrollPosition(pathname);
      setTransitioning(true);
      queueOffset(commitOffset);

      commitTimerRef.current = window.setTimeout(() => {
        commitTimerRef.current = null;
        router.push(nextPath, { scroll: false });
        isNavigatingRef.current = false;
      }, COMMIT_DELAY_MS);
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
  }, [pathname, queueOffset, resetVisualState, router, setDragging, setTransitioning]);

  useEffect(() => {
    const currentIndex = PAGES.indexOf(pathname as (typeof PAGES)[number]);
    if (currentIndex === -1) return;

    router.prefetch(PAGES[(currentIndex + 1) % PAGES.length]);
    router.prefetch(PAGES[(currentIndex - 1 + PAGES.length) % PAGES.length]);
  }, [pathname, router]);

  return null;
}
