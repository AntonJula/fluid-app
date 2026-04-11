"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { BarChart2, Droplets, Settings } from "lucide-react";

const PAGES = ["/", "/stats", "/settings"] as const;
const MAX_PREVIEW_OFFSET = 138;
const NAV_TRIGGER = 48;
const SHELL_DRAG_RATIO = 0.58;
const ELASTIC_RANGE = MAX_PREVIEW_OFFSET * 1.34;

type SwipeDirection = "left" | "right" | null;

const PAGE_META = {
  "/": {
    title: "Home",
    subtitle: "Track today and log water quickly.",
    Icon: Droplets,
    accent: "from-water-400/28 via-water-500/10 to-transparent",
  },
  "/stats": {
    title: "Stats",
    subtitle: "See trends, streaks and weekly progress.",
    Icon: BarChart2,
    accent: "from-water-300/22 via-cyan-200/10 to-transparent",
  },
  "/settings": {
    title: "Settings",
    subtitle: "Tune your goal, reminders and navigation.",
    Icon: Settings,
    accent: "from-water-500/24 via-water-200/10 to-transparent",
  },
} as const;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function getElasticOffset(deltaX: number) {
  const direction = deltaX < 0 ? -1 : 1;
  const rawDistance = Math.abs(deltaX) * SHELL_DRAG_RATIO;
  const limitedDistance = Math.min(rawDistance, ELASTIC_RANGE);
  const normalized = limitedDistance / ELASTIC_RANGE;

  // Make the swipe feel eager at the start, then add gentle resistance near the edge.
  const eased = 1 - Math.pow(1 - normalized, 1.75);

  return direction * clamp(eased * MAX_PREVIEW_OFFSET, 0, MAX_PREVIEW_OFFSET);
}

export function SwipeNavigation() {
  const router = useRouter();
  const pathname = usePathname();
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const [offset, setOffset] = useState(0);
  const [direction, setDirection] = useState<SwipeDirection>(null);
  const [targetPath, setTargetPath] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    const progress = Math.min(1, Math.abs(offset) / MAX_PREVIEW_OFFSET);
    const shellScale = 1 - progress * 0.024;
    const shellDim = progress * 0.055;
    const shellShadow = progress * 0.22;

    root.style.setProperty("--swipe-shell-offset", `${offset}px`);
    root.style.setProperty("--swipe-shell-scale", shellScale.toFixed(4));
    root.style.setProperty("--swipe-shell-dim", shellDim.toFixed(4));
    root.style.setProperty("--swipe-shell-shadow", shellShadow.toFixed(4));

    if (isDragging) {
      root.dataset.swipeDragging = "true";
    } else {
      delete root.dataset.swipeDragging;
    }

    return () => {
      root.style.setProperty("--swipe-shell-offset", "0px");
      root.style.setProperty("--swipe-shell-scale", "1");
      root.style.setProperty("--swipe-shell-dim", "0");
      root.style.setProperty("--swipe-shell-shadow", "0");
      delete root.dataset.swipeDragging;
    };
  }, [isDragging, offset]);

  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
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

      if (Math.abs(deltaX) < 8) return;
      if (Math.abs(deltaX) <= Math.abs(deltaY) * 1.15) return;

      let currentIndex = PAGES.indexOf(pathname as (typeof PAGES)[number]);
      if (currentIndex === -1) currentIndex = 0;

      if (deltaX < 0 && currentIndex < PAGES.length - 1) {
        setDirection("left");
        setTargetPath(PAGES[currentIndex + 1]);
        setOffset(getElasticOffset(deltaX));
        setIsDragging(true);
      } else if (deltaX > 0 && currentIndex > 0) {
        setDirection("right");
        setTargetPath(PAGES[currentIndex - 1]);
        setOffset(getElasticOffset(deltaX));
        setIsDragging(true);
      } else {
        setDirection(null);
        setTargetPath(null);
        setOffset(0);
        setIsDragging(false);
      }
    };

    const handleTouchEnd = () => {
      if (!touchStartRef.current) return;

      if (direction === "left" && targetPath && Math.abs(offset) > NAV_TRIGGER) {
        router.push(targetPath);
      }

      if (direction === "right" && targetPath && Math.abs(offset) > NAV_TRIGGER) {
        router.push(targetPath);
      }

      touchStartRef.current = null;
      setOffset(0);
      setDirection(null);
      setTargetPath(null);
      setIsDragging(false);
    };

    window.addEventListener("touchstart", handleTouchStart, { passive: true });
    window.addEventListener("touchmove", handleTouchMove, { passive: true });
    window.addEventListener("touchend", handleTouchEnd, { passive: true });
    window.addEventListener("touchcancel", handleTouchEnd, { passive: true });

    return () => {
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
      window.removeEventListener("touchcancel", handleTouchEnd);
    };
  }, [direction, offset, pathname, router, targetPath]);

  if (!targetPath || !direction) return null;

  const meta = PAGE_META[targetPath as keyof typeof PAGE_META];
  const progress = Math.min(1, Math.abs(offset) / MAX_PREVIEW_OFFSET);
  const previewTranslate = direction === "left" ? 16 - progress * 16 : -16 + progress * 16;
  const edgeGlowX = direction === "left" ? 6 - progress * 8 : -6 + progress * 8;

  return (
    <div className="pointer-events-none fixed inset-0 z-[5] overflow-hidden">
      <div
        className="absolute inset-0"
        style={{
          transform: `translateX(${previewTranslate}%) scale(${0.974 + progress * 0.026})`,
          opacity: 0.28 + progress * 0.72,
          transition: isDragging
            ? "none"
            : "transform 420ms cubic-bezier(0.22, 1.08, 0.28, 1), opacity 260ms ease-out",
        }}
      >
        <div className="relative h-full w-full overflow-hidden bg-[linear-gradient(180deg,rgba(7,89,133,0.24),rgba(8,47,73,0.92))]">
          <div className={`absolute inset-0 bg-gradient-to-br ${meta.accent}`} />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),transparent_42%)]" />
          <div className="absolute inset-y-0 left-0 w-px bg-white/6" />
          <div className="absolute inset-y-0 right-0 w-px bg-white/6" />

          <div
            className={`absolute inset-y-0 ${direction === "left" ? "left-0" : "right-0"} w-14 bg-[linear-gradient(90deg,rgba(0,0,0,0.18),transparent)] blur-xl`}
            style={{
              transform: `translateX(${edgeGlowX}px)`,
              opacity: 0.18 + progress * 0.32,
            }}
          />

          <div className="absolute inset-x-0 top-[12%] px-7">
            <div className="flex items-center gap-3 rounded-[2rem] border border-white/8 bg-white/[0.045] px-4 py-3.5 backdrop-blur-xl shadow-[0_18px_35px_rgba(0,0,0,0.14)]">
              <div className="flex h-12 w-12 items-center justify-center rounded-[1.15rem] bg-water-400/16 text-water-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]">
                <meta.Icon className="h-5 w-5" strokeWidth={2.4} />
              </div>
              <div className="min-w-0">
                <p className="font-ui text-[0.69rem] uppercase tracking-[0.24em] text-water-200/66">
                  Next page
                </p>
                <p className="font-ui mt-1 text-[1.65rem] font-black text-white">{meta.title}</p>
                <p className="font-body mt-1 max-w-[19rem] text-[0.94rem] text-water-100/70">
                  {meta.subtitle}
                </p>
              </div>
            </div>
          </div>

          <div className="absolute inset-x-7 top-[29%] h-36 rounded-[2.1rem] border border-white/7 bg-[linear-gradient(135deg,rgba(255,255,255,0.06),rgba(255,255,255,0.025))] shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]" />

          <div className="absolute inset-x-7 top-[50%] grid gap-4">
            <div className="h-24 rounded-[1.8rem] border border-white/7 bg-white/[0.035]" />
            <div className="grid grid-cols-[1fr_auto] gap-4">
              <div className="h-20 rounded-[1.55rem] border border-white/7 bg-white/[0.03]" />
              <div className="h-20 w-24 rounded-[1.55rem] border border-white/7 bg-water-300/8" />
            </div>
          </div>

          <div className="absolute inset-x-8 bottom-[14%] flex items-end justify-between rounded-[1.8rem] border border-white/8 bg-white/[0.04] px-6 py-4 backdrop-blur-md">
            <div className="space-y-2">
              <div className="h-3 w-24 rounded-full bg-white/14" />
              <div className="h-8 w-32 rounded-full bg-white/10" />
            </div>
            <div className="h-11 w-11 rounded-[1rem] bg-water-300/12" />
          </div>

          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-water-950/88 via-water-950/42 to-transparent" />
          <div className="absolute inset-x-7 bottom-[max(1rem,env(safe-area-inset-bottom))] flex h-[3.7rem] items-center justify-around rounded-[1.7rem] border border-white/7 bg-white/[0.04] px-5 backdrop-blur-xl">
            <div className="h-7 w-7 rounded-xl bg-white/10" />
            <div className="h-7 w-7 rounded-xl bg-water-300/16" />
            <div className="h-7 w-7 rounded-xl bg-white/10" />
          </div>
        </div>
      </div>
    </div>
  );
}
