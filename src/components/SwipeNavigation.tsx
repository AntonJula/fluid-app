"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  BellRing,
  ChartColumn,
  Flame,
  Trophy,
  Waves,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { useHydration } from "@/hooks/useHydration";

const PAGES = ["/", "/stats", "/settings"] as const;
const MAX_PREVIEW_OFFSET = 116;
const NAV_TRIGGER = 34;
const SHELL_DRAG_RATIO = 0.78;

type SwipeDirection = "left" | "right" | null;

const QUICK_ADD_PREVIEW = [
  { label: "Sip", amount: 150 },
  { label: "Glass", amount: 250 },
  { label: "Mug", amount: 330 },
  { label: "Bottle", amount: 500 },
] as const;

function PreviewPageShell({
  children,
  accent,
}: {
  children: React.ReactNode;
  accent: string;
}) {
  return (
    <div className="relative h-full w-full overflow-hidden bg-[linear-gradient(180deg,rgba(8,47,73,0.96),rgba(8,47,73,0.995))]">
      <div className={`absolute inset-0 bg-gradient-to-br ${accent}`} />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.06),transparent_42%)]" />
      <div className="absolute left-[-18%] top-[16%] h-64 w-64 rounded-full bg-water-400/8 blur-3xl" />
      <div className="absolute right-[-12%] top-[52%] h-56 w-56 rounded-full bg-water-300/8 blur-3xl" />
      <main className="relative mx-auto flex min-h-[100dvh] w-full max-w-md flex-col px-6 pb-24 pt-6">
        {children}
      </main>
    </div>
  );
}

function HomeSwipePreview({ intake, goal }: { intake: number; goal: number }) {
  const percentage = Math.round((Math.min(intake, goal) / goal) * 100);

  return (
    <PreviewPageShell accent="from-water-400/18 via-water-500/8 to-transparent">
      <header className="relative mt-2 text-center">
        <h2 className="font-display text-6xl font-black text-white drop-shadow-md">Fluid.</h2>
        <p className="font-ui mt-1 text-xs font-semibold uppercase tracking-widest text-water-200">
          {intake >= goal ? "Today is complete" : "Build your daily rhythm"}
        </p>
      </header>

      <div className="mt-8">
        <Card className="p-7">
          <div className="flex items-start justify-between gap-4">
            <div className="text-left">
              <p className="font-ui text-sm font-bold tracking-wide text-water-300">Today&apos;s Intake</p>
              <p className="font-ui mt-1 text-xs font-semibold uppercase tracking-[0.22em] text-water-400/75">
                Daily progress
              </p>
            </div>
            <div className="rounded-2xl border border-water-300/10 bg-water-900/18 px-3 py-2 text-right shadow-inner">
              <p className="font-numeric text-[1.7rem] font-black leading-none text-white">{percentage}%</p>
              <p className="font-ui mt-1 text-[0.62rem] font-bold uppercase tracking-[0.24em] text-water-300/75">
                done
              </p>
            </div>
          </div>

          <p className="font-numeric mt-4 text-center text-6xl font-black text-white">
            {(intake / 1000).toFixed(1)}
            <span className="font-ui ml-1 text-4xl font-bold tracking-normal text-water-300/80">L</span>
          </p>
          <p className="font-body mt-2 text-center text-sm font-semibold text-water-300/80">
            Goal {(goal / 1000).toFixed(1)}L
          </p>
        </Card>
      </div>

      <section className="mt-5">
        <div className="mb-3 flex items-center justify-between px-2">
          <p className="font-ui text-[12px] font-bold uppercase tracking-[0.2em] text-water-200/90">Quick add</p>
          <p className="font-body text-xs font-semibold text-water-300/80">Tap to log</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {QUICK_ADD_PREVIEW.map((item) => (
            <div
              key={item.amount}
              className="flex flex-col items-center justify-center gap-2 rounded-[1.5rem] border border-white/10 bg-white/5 px-3 py-5 shadow-[0_8px_16px_rgba(0,0,0,0.15),inset_0_1px_1px_rgba(255,255,255,0.1)]"
            >
              <span className="font-ui text-[12px] font-extrabold uppercase tracking-[0.18em] text-water-200">
                {item.label}
              </span>
              <span className="font-numeric text-3xl font-black text-white">
                {item.amount}
                <span className="font-ui ml-1 text-[14px] font-extrabold tracking-normal text-water-300">ml</span>
              </span>
            </div>
          ))}
        </div>
      </section>
    </PreviewPageShell>
  );
}

function StatsSwipePreview({
  intake,
  goal,
  streak,
  history,
}: {
  intake: number;
  goal: number;
  streak: number;
  history: { intake: number }[];
}) {
  const weeklyAverage = Math.round(
    [...history.slice(-6).map((item) => item.intake), intake].reduce((sum, value) => sum + value, 0) / 7
  );

  return (
    <PreviewPageShell accent="from-water-300/16 via-cyan-200/8 to-transparent">
      <header className="mt-4 mb-8 text-center">
        <h2 className="font-display text-4xl font-black text-white drop-shadow-md">Your Stats.</h2>
        <p className="font-ui mt-1 text-xs font-semibold uppercase tracking-widest text-water-200">
          Consistency builds the habit
        </p>
        <div className="mt-6 inline-flex items-center gap-2 rounded-2xl border border-water-400/20 bg-water-900/40 px-4 py-2 text-sm font-semibold text-water-100 shadow-inner">
          <span className="font-body opacity-80">Daily Goal:</span>
          <span className="font-numeric font-bold tracking-wide text-water-300">{goal} ml</span>
        </div>
      </header>

      <div className="grid grid-cols-2 gap-4">
        <Card className="flex flex-col items-center justify-center p-5 text-center">
          <div className="mb-2 flex items-center gap-2">
            <Flame className="h-5 w-5 text-water-300" strokeWidth={2.5} />
            <span className="font-ui text-sm font-bold tracking-wide text-water-300">Streak</span>
          </div>
          <div className="font-numeric text-4xl font-black text-white">{streak}</div>
          <span className="font-ui mt-2 text-[10px] font-bold uppercase tracking-widest text-water-400/80">
            Days in a row
          </span>
        </Card>

        <Card className="flex flex-col items-center justify-center p-5 text-center">
          <div className="mb-2 flex items-center gap-2">
            <Trophy className="h-5 w-5 text-water-200" strokeWidth={2.5} />
            <span className="font-ui text-sm font-bold tracking-wide text-water-300">Today</span>
          </div>
          <div className="font-numeric text-4xl font-black text-white">
            {Math.round((intake / goal) * 100)}
            <span className="font-ui ml-0.5 text-xl text-water-400">%</span>
          </div>
          <span className="font-ui mt-2 text-[10px] font-bold uppercase tracking-widest text-water-400/80">
            Goal completed
          </span>
        </Card>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4">
        <Card className="p-4">
          <div className="font-ui flex items-center gap-1.5 whitespace-nowrap text-[0.78rem] font-bold tracking-wide text-water-300">
            <Waves className="h-3.5 w-3.5 shrink-0" strokeWidth={2.4} />
            Weekly Average
          </div>
          <p className="font-numeric mt-3 text-3xl font-black text-white">{weeklyAverage} ml</p>
          <p className="font-body mt-1 text-xs text-water-400/80">Average intake across this week.</p>
        </Card>

        <Card className="p-4">
          <div className="font-ui flex items-center gap-2 text-sm font-bold tracking-wide text-water-300">
            <ChartColumn className="h-4 w-4" strokeWidth={2.4} />
            Consistency
          </div>
          <p className="font-numeric mt-3 text-3xl font-black text-white">
            {Math.round((Math.min(intake, goal) / goal) * 100)}%
          </p>
          <p className="font-body mt-1 text-xs text-water-400/80">A strong start for this week.</p>
        </Card>
      </div>
    </PreviewPageShell>
  );
}

function SettingsSwipePreview({
  goal,
  reminderInterval,
  quietHours,
}: {
  goal: number;
  reminderInterval: number;
  quietHours: { start: string; end: string };
}) {
  return (
    <PreviewPageShell accent="from-water-500/18 via-water-200/8 to-transparent">
      <header className="mt-4 mb-8 text-center">
        <h2 className="font-display text-4xl font-black text-white drop-shadow-md">Settings.</h2>
        <p className="font-ui mt-1 text-xs font-semibold uppercase tracking-widest text-water-200">
          Customize Fluid
        </p>
      </header>

      <Card className="mb-6 w-full p-5">
        <p className="font-ui text-[11px] font-bold uppercase tracking-[0.22em] text-water-300/80">Habit setup</p>
        <p className="font-ui mt-2 text-xl font-black text-white">Keep it easy to win every day.</p>
        <p className="font-body mt-2 text-sm text-water-300/80">
          A realistic goal and gentle reminders will do more for retention than aggressive settings ever will.
        </p>
      </Card>

      <div className="space-y-6">
        <Card className="p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-ui text-sm font-bold tracking-wide text-water-300">Daily Goal</p>
              <p className="font-body mt-1 text-sm text-water-300/80">Choose your hydration target.</p>
            </div>
            <div className="rounded-2xl border border-water-400/15 bg-water-800/40 px-4 py-2 text-right">
              <p className="font-numeric text-2xl font-black text-white">{goal}</p>
              <p className="font-ui text-[10px] font-bold uppercase tracking-[0.2em] text-water-300/75">ml</p>
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-ui text-sm font-bold tracking-wide text-water-300">Reminders</p>
              <p className="font-body mt-1 text-sm text-water-300/80">
                Every {reminderInterval || 60} min, quiet hours {quietHours.start}-{quietHours.end}
              </p>
            </div>
            <BellRing className="mt-1 h-5 w-5 text-water-300" strokeWidth={2.4} />
          </div>
        </Card>
      </div>
    </PreviewPageShell>
  );
}

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
  const { intake, goal, streak, history, reminderInterval, quietHours } = useHydration();
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
    const progress = Math.min(1, Math.abs(offset) / MAX_PREVIEW_OFFSET);
    const shellScale = 1 - progress * 0.0105;
    const shellDim = progress * 0.03;
    const shellShadow = progress * 0.12;

    root.style.setProperty("--swipe-shell-offset", `${offset}px`);
    root.style.setProperty("--swipe-shell-scale", shellScale.toFixed(4));
    root.style.setProperty("--swipe-shell-dim", shellDim.toFixed(4));
    root.style.setProperty("--swipe-shell-shadow", shellShadow.toFixed(4));
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
      const nextOffset = clamp(deltaX * SHELL_DRAG_RATIO, -MAX_PREVIEW_OFFSET, MAX_PREVIEW_OFFSET);

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
        router.push(nextPath);
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
  const previewContent =
    targetPath === "/" ? (
      <HomeSwipePreview intake={intake} goal={goal} />
    ) : targetPath === "/stats" ? (
      <StatsSwipePreview intake={intake} goal={goal} streak={streak} history={history} />
    ) : (
      <SettingsSwipePreview
        goal={goal}
        reminderInterval={reminderInterval}
        quietHours={quietHours}
      />
    );

  return (
    <div className="pointer-events-none fixed inset-0 z-[4] overflow-hidden">
      <div
        className="absolute inset-0"
        style={{
          transform: isLeft
            ? "translateX(calc((1 - var(--swipe-preview-progress, 0)) * 11%))"
            : "translateX(calc((var(--swipe-preview-progress, 0) - 1) * 11%))",
          opacity: "calc(0.22 + var(--swipe-preview-progress, 0) * 0.78)",
          transition:
            "transform 260ms cubic-bezier(0.22, 0.9, 0.32, 1), opacity 220ms ease-out",
        }}
      >
        <div className="relative h-full w-full overflow-hidden">
          {previewContent}
          <div
            className={`absolute inset-y-0 ${isLeft ? "right-0" : "left-0"} w-10 bg-gradient-to-r from-white/[0.04] via-white/[0.015] to-transparent`}
            style={{ opacity: "calc(0.08 + var(--swipe-preview-progress, 0) * 0.12)" }}
          />
        </div>
      </div>
    </div>
  );
}
