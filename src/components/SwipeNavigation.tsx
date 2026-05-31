"use client";

import { useCallback, useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { saveScrollPosition } from "@/hooks/useScrollPreservation";
import { resetSwipeUiState, setSwipeUiState } from "@/hooks/useSwipeUiState";

const PAGES = ["/", "/stats", "/settings"] as const;
const HORIZONTAL_LOCK_PX = 8;
const NAV_TRIGGER_PX = 52;
const FLICK_TRIGGER_PX = 28;
const FLICK_VELOCITY_PX_PER_MS = 0.26;
const DRAG_RESISTANCE = 0.68;
const MAX_DRAG_OFFSET = 104;
const COMMIT_OFFSET = 26;
const COMMIT_DELAY_MS = 40;
const SNAP_BACK_DELAY_MS = 150;
const VERTICAL_REJECT_RATIO = 1.08;

type SwipeDirection = "left" | "right";

type TouchState = {
  startX: number;
  startY: number;
  lastX: number;
  lastY: number;
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
  const activePathRef = useRef(pathname);

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
      setSwipeUiState({ isDragging: true, isTransitioning: false, frozenPathname: activePathRef.current });
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
    setSwipeUiState({ frozenPathname: null });
    applyOffset(0);
  }, [applyOffset, setDragging, setTransitioning]);

  useEffect(() => {
    activePathRef.current = pathname;
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
    const startGesture = (clientX: number, clientY: number, target: EventTarget | null) => {
      if (isNavigatingRef.current || isEditableTarget(target)) return;

      if (commitTimerRef.current !== null) {
        window.clearTimeout(commitTimerRef.current);
        commitTimerRef.current = null;
      }

      touchStateRef.current = {
        startX: clientX,
        startY: clientY,
        lastX: clientX,
        lastY: clientY,
        startedAt: performance.now(),
        isHorizontal: false,
        isRejected: false,
      };
    };

    const moveGesture = (clientX: number, clientY: number, event: TouchEvent | PointerEvent) => {
      const touchState = touchStateRef.current;
      if (!touchState || touchState.isRejected || isNavigatingRef.current) return;

      const deltaX = clientX - touchState.startX;
      const deltaY = clientY - touchState.startY;
      const absX = Math.abs(deltaX);
      const absY = Math.abs(deltaY);

      touchState.lastX = clientX;
      touchState.lastY = clientY;

      if (!touchState.isHorizontal) {
        if (absX < HORIZONTAL_LOCK_PX && absY < HORIZONTAL_LOCK_PX) return;

        if (absY > absX * VERTICAL_REJECT_RATIO) {
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

    const endGesture = (clientX?: number, clientY?: number) => {
      const touchState = touchStateRef.current;
      touchStateRef.current = null;

      if (!touchState || touchState.isRejected || isNavigatingRef.current) return;

      if (typeof clientX === "number" && typeof clientY === "number") {
        touchState.lastX = clientX;
        touchState.lastY = clientY;
      }

      setDragging(false);

      if (!touchState.isHorizontal) {
        resetVisualState();
        return;
      }

      const elapsed = Math.max(1, performance.now() - touchState.startedAt);
      const rawDistance = touchState.lastX - touchState.startX;
      const velocity = Math.abs(rawDistance) / elapsed;
      const shouldNavigate =
        Math.abs(rawDistance) >= NAV_TRIGGER_PX ||
        (Math.abs(rawDistance) >= FLICK_TRIGGER_PX && velocity >= FLICK_VELOCITY_PX_PER_MS);

      if (!shouldNavigate) {
        queueOffset(0);
        window.setTimeout(() => {
          if (!isNavigatingRef.current) resetVisualState();
        }, SNAP_BACK_DELAY_MS);
        return;
      }

      const direction: SwipeDirection = rawDistance < 0 ? "left" : "right";
      const nextPath = getTargetPath(activePathRef.current, direction);
      const commitOffset = direction === "left" ? -COMMIT_OFFSET : COMMIT_OFFSET;

      isNavigatingRef.current = true;
      activePathRef.current = nextPath;
      saveScrollPosition(pathname);
      setSwipeUiState({ frozenPathname: nextPath });
      setTransitioning(true);
      queueOffset(commitOffset);

      commitTimerRef.current = window.setTimeout(() => {
        commitTimerRef.current = null;
        router.push(nextPath, { scroll: false });
        isNavigatingRef.current = false;
      }, COMMIT_DELAY_MS);
    };

    const handleTouchStart = (event: TouchEvent) => {
      if (event.targetTouches.length !== 1) return;

      const touch = event.targetTouches[0];
      startGesture(touch.clientX, touch.clientY, event.target);
    };

    const handleTouchMove = (event: TouchEvent) => {
      if (event.targetTouches.length !== 1) return;

      const touch = event.targetTouches[0];
      moveGesture(touch.clientX, touch.clientY, event);
    };

    const handleTouchEnd = (event: TouchEvent) => {
      const touch = event.changedTouches[0];
      endGesture(touch?.clientX, touch?.clientY);
    };

    const handlePointerStart = (event: PointerEvent) => {
      if (event.pointerType === "touch" || !event.isPrimary || event.button !== 0) return;

      startGesture(event.clientX, event.clientY, event.target);
    };

    const handlePointerMove = (event: PointerEvent) => {
      if (event.pointerType === "touch" || !event.isPrimary) return;

      moveGesture(event.clientX, event.clientY, event);
    };

    const handlePointerEnd = (event: PointerEvent) => {
      if (event.pointerType === "touch" || !event.isPrimary) return;

      endGesture(event.clientX, event.clientY);
    };

    window.addEventListener("touchstart", handleTouchStart, { passive: true });
    window.addEventListener("touchmove", handleTouchMove, { passive: false });
    window.addEventListener("touchend", handleTouchEnd, { passive: true });
    window.addEventListener("touchcancel", handleTouchEnd, { passive: true });
    window.addEventListener("pointerdown", handlePointerStart, { passive: true });
    window.addEventListener("pointermove", handlePointerMove, { passive: false });
    window.addEventListener("pointerup", handlePointerEnd, { passive: true });
    window.addEventListener("pointercancel", handlePointerEnd, { passive: true });

    return () => {
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
      window.removeEventListener("touchcancel", handleTouchEnd);
      window.removeEventListener("pointerdown", handlePointerStart);
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerEnd);
      window.removeEventListener("pointercancel", handlePointerEnd);
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
