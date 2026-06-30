"use client";

import React from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import {
  Battery,
  BatteryFull,
  BellRing,
  Coffee,
  Droplets,
  Dumbbell,
  Leaf,
  Minus,
  Pencil,
  RefreshCw,
  RotateCcw,
  Sun,
  Tag,
  Target,
  Trophy,
  Trash2,
  X,
  Zap,
} from "lucide-react";
import { useHydration, type DrinkLogItem, type HydrationHistoryItem } from "@/hooks/useHydration";
import { useNotifications } from "@/hooks/useNotifications";
import { WaveBackground } from "@/components/WaveBackground";
import { ProgressCard } from "@/components/ProgressCard";
import { HydrationLoadingState } from "@/components/HydrationLoadingState";
import { NumberPickerDialog } from "@/components/ui/NumberPickerDialog";
import { Button } from "@/components/ui/Button";
import { SipIcon, GlassIcon, MugIcon, BottleIcon } from "@/components/DrinkIcons";
import { HYDRATION_NOTES, type HydrationNote } from "@/lib/hydrationState";
import { WORKOUT_REMINDER_INTERVAL_MINUTES } from "@/lib/notificationMessages";
import { getAppScrollElement, getAppScrollY, scrollAppTo } from "@/utils/appScroll";
import { formatDateLocal } from "@/lib/date";

const SECONDARY_QUICK_AMOUNTS = [
  {
    label: "Sip",
    amount: 150,
    Icon: SipIcon,
    surface: "border-sky-100/14 bg-white/[0.055] hover:border-sky-100/24 hover:bg-white/[0.08]",
    iconSurface: "border-sky-100/18 bg-sky-200/8 text-sky-100/92",
    glow: "bg-sky-300/10",
    halo: "shadow-[0_0_0_1px_rgba(125,211,252,0.06),0_0_12px_rgba(56,189,248,0.10),inset_0_1px_0_rgba(255,255,255,0.12)]",
  },
  {
    label: "Glass",
    amount: 250,
    Icon: GlassIcon,
    surface: "border-cyan-100/16 bg-white/[0.06] hover:border-cyan-100/26 hover:bg-white/[0.09]",
    iconSurface: "border-cyan-100/20 bg-cyan-200/9 text-cyan-50/94",
    glow: "bg-cyan-300/12",
    halo: "shadow-[0_0_0_1px_rgba(103,232,249,0.07),0_0_14px_rgba(34,211,238,0.12),inset_0_1px_0_rgba(255,255,255,0.13)]",
  },
  {
    label: "Mug",
    amount: 330,
    Icon: MugIcon,
    surface: "border-teal-100/14 bg-white/[0.055] hover:border-teal-100/24 hover:bg-white/[0.08]",
    iconSurface: "border-teal-100/18 bg-teal-200/8 text-teal-50/92",
    glow: "bg-teal-300/10",
    halo: "shadow-[0_0_0_1px_rgba(94,234,212,0.06),0_0_12px_rgba(45,212,191,0.11),inset_0_1px_0_rgba(255,255,255,0.12)]",
  },
  {
    label: "Bottle",
    amount: 500,
    Icon: BottleIcon,
    surface: "border-emerald-100/14 bg-white/[0.055] hover:border-emerald-100/24 hover:bg-white/[0.08]",
    iconSurface: "border-emerald-100/18 bg-emerald-200/8 text-emerald-50/92",
    glow: "bg-emerald-300/10",
    halo: "shadow-[0_0_0_1px_rgba(110,231,183,0.06),0_0_12px_rgba(52,211,153,0.11),inset_0_1px_0_rgba(255,255,255,0.12)]",
  },
];

const NOTE_OPTIONS: Array<{ value: HydrationNote; label: string; Icon: React.ComponentType<{ className?: string; strokeWidth?: number }> }> = [
  { value: "water", label: "Water", Icon: Droplets },
  { value: "coffee", label: "Coffee", Icon: Coffee },
  { value: "tea", label: "Tea", Icon: Leaf },
  { value: "workout", label: "Workout", Icon: Dumbbell },
  { value: "hot-day", label: "Hot Day", Icon: Sun },
];

const SHIMMER_DELAYS = ["4.8s", "7.9s", "2.6s"];
const ONBOARDING_STORAGE_KEY = "fluid-onboarding-complete";
const ONBOARDING_GOALS = [1500, 2000, 2500, 3000];
const ONBOARDING_REMINDERS = [
  { label: "Off", value: 0 },
  { label: "20m", value: 20 },
  { label: "40m", value: 40 },
  { label: "60m", value: 60 },
];
const ONBOARDING_STEPS = ["welcome", "goal", "reminders", "notifications"] as const;
type OnboardingStep = (typeof ONBOARDING_STEPS)[number];
const ONBOARDING_STEP_COPY: Record<OnboardingStep, { eyebrow: string; title: string; copy: string }> = {
  welcome: {
    eyebrow: "Welcome",
    title: "Fluid.",
    copy: "Build a calm hydration rhythm without pressure.",
  },
  goal: {
    eyebrow: "Step 1",
    title: "Set your daily goal.",
    copy: "Pick a target that feels realistic and sustainable.",
  },
  reminders: {
    eyebrow: "Step 2",
    title: "Choose your reminder rhythm.",
    copy: "Keep Fluid quiet, or let it nudge you gently.",
  },
  notifications: {
    eyebrow: "Step 3",
    title: "Let Fluid remind you.",
    copy: "Allow notifications only if you want reminders outside the app.",
  },
};
const HYDRATION_REVEAL_DURATION_MS = 420;
const STREAK_WINDOW_SIZE = 5;
const STREAK_SHIELD_COUNT = 2;
const STREAK_DAY_FORMATTER = new Intl.DateTimeFormat("en", { weekday: "short" });
const HYDRATION_NOTE_VALUES = new Set<string>(HYDRATION_NOTES);
const NOTIFICATION_ACTION_DB = "fluid-notification-actions";
const NOTIFICATION_ACTION_STORE = "pending-actions";

type PendingNotificationAction = {
  id: string;
  amount: number;
  note?: string;
  createdAt?: number;
};

function openNotificationActionDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(NOTIFICATION_ACTION_DB, 1);

    request.onupgradeneeded = () => {
      request.result.createObjectStore(NOTIFICATION_ACTION_STORE, { keyPath: "id" });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function takePendingNotificationActions() {
  if (typeof indexedDB === "undefined") return [];

  const db = await openNotificationActionDb();

  try {
    return await new Promise<PendingNotificationAction[]>((resolve, reject) => {
      const transaction = db.transaction(NOTIFICATION_ACTION_STORE, "readwrite");
      const store = transaction.objectStore(NOTIFICATION_ACTION_STORE);
      const request = store.getAll();
      let actions: PendingNotificationAction[] = [];

      request.onsuccess = () => {
        actions = request.result as PendingNotificationAction[];
        store.clear();
      };
      request.onerror = () => reject(request.error);
      transaction.oncomplete = () => resolve(actions);
      transaction.onerror = () => reject(transaction.error);
    });
  } finally {
    db.close();
  }
}

function formatLogTime(timestamp: number) {
  return new Intl.DateTimeFormat("en", {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(timestamp));
}

function getNoteLabel(note?: HydrationNote) {
  return NOTE_OPTIONS.find((item) => item.value === note)?.label ?? "Water";
}

function formatLiters(amount: number) {
  const liters = amount / 1000;
  return Number.isInteger(liters) ? `${liters}L` : `${liters.toFixed(1)}L`;
}

function easeOutCubic(progress: number) {
  return 1 - Math.pow(1 - progress, 3);
}

function useLockedViewport(isLocked: boolean) {
  React.useEffect(() => {
    if (!isLocked || typeof window === "undefined") return;

    const scrollY = getAppScrollY();
    const root = document.documentElement;
    const body = document.body;
    const scrollElement = getAppScrollElement();
    const previousRootOverflow = root.style.overflow;
    const previousBodyOverflow = body.style.overflow;
    const previousBodyTouchAction = body.style.touchAction;
    const previousScrollElementOverflow = scrollElement?.style.overflow;

    root.style.overflow = "hidden";
    body.style.overflow = "hidden";
    body.style.touchAction = "none";
    if (scrollElement) scrollElement.style.overflow = "hidden";

    return () => {
      root.style.overflow = previousRootOverflow;
      body.style.overflow = previousBodyOverflow;
      body.style.touchAction = previousBodyTouchAction;
      if (scrollElement && previousScrollElementOverflow !== undefined) {
        scrollElement.style.overflow = previousScrollElementOverflow;
      }
      scrollAppTo(scrollY);
    };
  }, [isLocked]);
}

function useLockedPageScroll(isLocked: boolean) {
  React.useEffect(() => {
    if (!isLocked || typeof window === "undefined") return;

    const scrollY = getAppScrollY();
    const root = document.documentElement;
    const body = document.body;
    const scrollElement = getAppScrollElement();
    const previousRootOverflow = root.style.overflow;
    const previousRootOverscroll = root.style.overscrollBehavior;
    const previousBodyOverflow = body.style.overflow;
    const previousBodyOverscroll = body.style.overscrollBehavior;
    const previousScrollElementOverflow = scrollElement?.style.overflow;
    const previousScrollElementOverscroll = scrollElement?.style.overscrollBehavior;

    root.style.overflow = "hidden";
    root.style.overscrollBehavior = "none";
    body.style.overflow = "hidden";
    body.style.overscrollBehavior = "none";
    if (scrollElement) {
      scrollElement.style.overflow = "hidden";
      scrollElement.style.overscrollBehavior = "none";
    }

    return () => {
      root.style.overflow = previousRootOverflow;
      root.style.overscrollBehavior = previousRootOverscroll;
      body.style.overflow = previousBodyOverflow;
      body.style.overscrollBehavior = previousBodyOverscroll;
      if (scrollElement) {
        if (previousScrollElementOverflow !== undefined) scrollElement.style.overflow = previousScrollElementOverflow;
        if (previousScrollElementOverscroll !== undefined) {
          scrollElement.style.overscrollBehavior = previousScrollElementOverscroll;
        }
      }
      scrollAppTo(scrollY);
    };
  }, [isLocked]);
}

function useHydrationReveal(targetIntake: number, shouldReveal: boolean) {
  const initialValue = shouldReveal ? 0 : targetIntake;
  const [animatedIntake, setAnimatedIntake] = React.useState(initialValue);
  const currentValueRef = React.useRef(initialValue);
  const frameRef = React.useRef<number | null>(null);

  React.useEffect(() => {
    if (!shouldReveal) {
      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }

      currentValueRef.current = targetIntake;
      setAnimatedIntake(targetIntake);
      return;
    }

    if (typeof window === "undefined") {
      setAnimatedIntake(targetIntake);
      return;
    }

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReducedMotion) {
      currentValueRef.current = targetIntake;
      setAnimatedIntake(targetIntake);
      return;
    }

    if (frameRef.current !== null) {
      window.cancelAnimationFrame(frameRef.current);
    }

    const startValue = currentValueRef.current;
    const change = targetIntake - startValue;
    const startedAt = performance.now();

    if (Math.abs(change) < 1) {
      currentValueRef.current = targetIntake;
      setAnimatedIntake(targetIntake);
      return;
    }

    const tick = (timestamp: number) => {
      const elapsed = timestamp - startedAt;
      const progress = Math.min(1, elapsed / HYDRATION_REVEAL_DURATION_MS);
      const nextValue = startValue + change * easeOutCubic(progress);

      currentValueRef.current = nextValue;
      setAnimatedIntake(Math.round(nextValue));

      if (progress < 1) {
        frameRef.current = window.requestAnimationFrame(tick);
        return;
      }

      currentValueRef.current = targetIntake;
      setAnimatedIntake(targetIntake);
      frameRef.current = null;
    };

    frameRef.current = window.requestAnimationFrame(tick);

    return () => {
      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }
    };
  }, [shouldReveal, targetIntake]);

  return animatedIntake;
}

function buildTrackedDays(history: HydrationHistoryItem[], intake: number, goal: number) {
  const today = formatDateLocal(new Date());
  const trackedByDate = new Map(history.map((day) => [day.date, day]));
  trackedByDate.set(today, { date: today, intake, goal });

  return Array.from(trackedByDate.values()).sort((a, b) => a.date.localeCompare(b.date));
}

function getStreakStats(history: HydrationHistoryItem[], intake: number, goal: number) {
  const trackedDays = buildTrackedDays(history, intake, goal);
  let bestStreak = 0;
  let currentRun = 0;

  trackedDays.forEach((day) => {
    if (day.intake >= day.goal) {
      currentRun += 1;
      bestStreak = Math.max(bestStreak, currentRun);
      return;
    }

    currentRun = 0;
  });

  return { bestStreak };
}

function getRecentStreakDays(history: HydrationHistoryItem[], intake: number, goal: number) {
  const todayDate = new Date();
  const trackedByDate = new Map(buildTrackedDays(history, intake, goal).map((day) => [day.date, day]));

  return Array.from({ length: STREAK_WINDOW_SIZE }).map((_, index) => {
    const date = new Date(todayDate);
    date.setDate(todayDate.getDate() - (STREAK_WINDOW_SIZE - 1 - index));

    const dateStr = formatDateLocal(date);
    const trackedDay = trackedByDate.get(dateStr);
    const dayGoal = trackedDay?.goal ?? goal;
    const dayIntake = trackedDay?.intake ?? 0;

    return {
      date: dateStr,
      label: STREAK_DAY_FORMATTER.format(date).slice(0, 2),
      isToday: index === STREAK_WINDOW_SIZE - 1,
      isGoalMet: dayIntake >= dayGoal,
      hasIntake: dayIntake > 0,
    };
  });
}

function getStreakPrompt(streak: number, remaining: number, isGoalMet: boolean) {
  if (isGoalMet) return "Today is saved. Come back tomorrow to keep the run going.";
  if (streak > 0) return `Drink ${remaining} ml today to protect your streak.`;
  return `Drink ${remaining} ml today to start a streak.`;
}

function getBatteryProtectionText(charges: number) {
  if (charges >= 2) return "2 protections left";
  if (charges === 1) return "1 protection left";
  return "No protections left";
}

function StreakDetailsSheet({
  isOpen,
  streak,
  streakShieldCharges,
  remaining,
  isGoalMet,
  recentDays,
  bestStreak,
  onClose,
}: {
  isOpen: boolean;
  streak: number;
  streakShieldCharges: number;
  remaining: number;
  isGoalMet: boolean;
  recentDays: ReturnType<typeof getRecentStreakDays>;
  bestStreak: number;
  onClose: () => void;
}) {
  useLockedViewport(isOpen);

  React.useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || typeof document === "undefined") return null;

  const safeStreak = Math.max(0, streak);
  const safeShieldCharges = Math.max(0, Math.min(STREAK_SHIELD_COUNT, streakShieldCharges));

  return createPortal(
    <div className="fluid-modal-backdrop fixed inset-0 z-[116] flex items-end justify-center px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))]" data-swipe-ignore="true" onClick={onClose}>
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="streak-sheet-title"
        className="w-full max-w-[25.5rem] overflow-hidden rounded-[1.65rem] border border-[1.5px] border-water-300/14 bg-water-950/94 shadow-[0_24px_70px_rgba(0,0,0,0.46)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-water-300/12 px-5 py-4">
          <div>
            <p className="font-ui text-[11px] font-black uppercase tracking-[0.22em] text-water-300/80">Daily streak</p>
            <h2 id="streak-sheet-title" className="font-ui mt-1 text-2xl font-black tracking-normal text-white">
              {isGoalMet ? "Streak saved" : safeStreak > 0 ? "Keep it alive" : "Start the run"}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-water-200/80 transition-colors hover:bg-white/10 hover:text-white"
            aria-label="Close streak details"
          >
            <X className="h-5 w-5" strokeWidth={2.5} />
          </button>
        </div>

        <div className="px-5 py-5">
          <div className="flex items-center gap-3">
            <div className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-full border border-[1.5px] ${safeStreak > 0 || isGoalMet ? "border-cyan-100/30 bg-cyan-200/14 text-cyan-50" : "border-water-300/14 bg-white/5 text-water-200/45"}`}>
              <Zap className="h-8 w-8" fill={safeStreak > 0 || isGoalMet ? "currentColor" : "none"} strokeWidth={2.35} />
            </div>
            <div className="min-w-0">
              <div className="flex items-baseline gap-2">
                <p className="font-numeric text-5xl font-black leading-none text-white">{safeStreak}</p>
                <p className="font-ui text-xl font-black text-water-300/70">{safeStreak === 1 ? "day" : "days"}</p>
              </div>
              <p className="font-body mt-2 text-sm font-semibold leading-relaxed text-water-300/82">
                {getStreakPrompt(safeStreak, remaining, isGoalMet)}
              </p>
            </div>
          </div>

          <div className="mt-5 rounded-[1.15rem] border border-[1.5px] border-water-300/12 bg-white/[0.05] px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="font-ui text-[0.72rem] font-black uppercase tracking-[0.18em] text-water-300/82">Streak batteries</p>
                <p className="font-body mt-1 text-xs font-semibold text-water-300/68">{getBatteryProtectionText(safeShieldCharges)}</p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {Array.from({ length: STREAK_SHIELD_COUNT }).map((_, index) => {
                  const isCharged = index >= STREAK_SHIELD_COUNT - safeShieldCharges;
                  const BatteryIcon = isCharged ? BatteryFull : Battery;

                  return (
                    <div
                      key={index}
                      className={`flex h-10 w-10 items-center justify-center rounded-full border border-[1.5px] ${
                        isCharged
                          ? "border-cyan-100/34 bg-cyan-200/16 text-cyan-50 shadow-[0_0_18px_rgba(56,189,248,0.12)]"
                          : "border-water-300/10 bg-water-950/30 text-water-300/22"
                      }`}
                      aria-label={isCharged ? "Charged streak battery" : "Empty streak battery"}
                      title={isCharged ? "Charged" : "Empty"}
                    >
                      <BatteryIcon className="h-5 w-5" fill={isCharged ? "currentColor" : "none"} strokeWidth={2.35} />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-5 gap-3">
            {recentDays.map((day) => (
              <div key={day.date} className="flex min-w-0 flex-col items-center gap-2">
                <div
                  className={`flex aspect-square w-full max-w-[3.25rem] items-center justify-center rounded-full border border-[1.5px] ${
                    day.isGoalMet
                      ? "border-cyan-100/34 bg-cyan-200/16 text-cyan-50 shadow-[0_0_18px_rgba(56,189,248,0.14)]"
                      : day.hasIntake
                        ? "border-water-300/20 bg-water-700/28 text-water-100"
                        : "border-water-300/14 bg-white/5 text-water-200/28"
                  } ${day.isToday ? "ring-2 ring-water-300/24 ring-offset-2 ring-offset-water-950" : ""}`}
                  title={day.date}
                >
                  <Zap className="h-5 w-5" fill={day.isGoalMet ? "currentColor" : "none"} strokeWidth={2.45} />
                </div>
                <p className={`font-ui text-xs font-black ${day.isToday ? "text-white" : "text-water-300/68"}`}>{day.label}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 grid grid-cols-2 overflow-hidden rounded-[1.15rem] border border-[1.5px] border-water-300/12 bg-white/[0.055]">
            <div className="border-r border-water-300/12 px-4 py-4 text-center">
              <div className="flex justify-center text-water-300/80">
                <Trophy className="h-4 w-4" strokeWidth={2.4} />
              </div>
              <p className="font-numeric mt-2 text-3xl font-black text-white">{Math.max(bestStreak, safeStreak)}</p>
              <p className="font-body mt-1 text-xs font-semibold text-water-300/72">Best streak</p>
            </div>
            <div className="px-4 py-4 text-center">
              <div className="flex justify-center text-water-300/80">
                <Zap className="h-4 w-4" fill={safeStreak > 0 || isGoalMet ? "currentColor" : "none"} strokeWidth={2.4} />
              </div>
              <p className="font-numeric mt-2 text-3xl font-black text-white">{safeStreak}</p>
              <p className="font-body mt-1 text-xs font-semibold text-water-300/72">Current streak</p>
            </div>
          </div>
        </div>
      </section>
    </div>,
    document.body
  );
}

function ResetConfirmDialog({
  isOpen,
  onCancel,
  onConfirm,
}: {
  isOpen: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  useLockedViewport(isOpen);

  React.useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onCancel();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onCancel]);

  if (!isOpen || typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fluid-modal-backdrop fixed inset-0 z-[115] grid place-items-center overflow-hidden px-4 py-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))]"
      data-swipe-ignore="true"
      onClick={onCancel}
      onTouchMove={(event) => event.preventDefault()}
      onWheel={(event) => event.preventDefault()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="reset-today-title"
        className="w-full max-w-[22rem] overflow-hidden rounded-[1.25rem] border border-[1.5px] border-rose-100/18 bg-water-950/94 shadow-[0_24px_70px_rgba(0,0,0,0.42)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="border-b border-water-300/12 px-5 py-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-ui text-[11px] font-black uppercase tracking-[0.22em] text-rose-100/78">Today actions</p>
              <h2 id="reset-today-title" className="font-ui mt-2 text-2xl font-black tracking-normal text-white">
                Reset today?
              </h2>
            </div>
            <button
              type="button"
              onClick={onCancel}
              className="rounded-full p-2 text-water-200/80 transition-colors hover:bg-white/10 hover:text-white"
              aria-label="Cancel reset"
            >
              <X className="h-5 w-5" strokeWidth={2.5} />
            </button>
          </div>
          <p className="font-body mt-3 text-sm font-semibold leading-relaxed text-water-300/82">
            This clears today&apos;s intake and drink log. Your previous days stay saved.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 px-5 py-4">
          <Button type="button" variant="secondary" size="sm" onClick={onCancel} className="rounded-xl">
            Cancel
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={onConfirm}
            className="rounded-xl border-rose-200/20 bg-rose-500/14 text-rose-50 hover:bg-rose-500/22"
          >
            Reset today
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
}

export default function Home() {
  const router = useRouter();
  const {
    intake,
    goal,
    drinkLog,
    quickAddAmount,
    streak,
    streakShieldCharges,
    history,
    quietHours,
    workoutSessionEndsAt,
    addDrink,
    subtractDrink,
    undoLastDrink,
    updateDrinkLogItem,
    deleteDrinkLogItem,
    setGoal,
    setQuickAddAmount,
    startWorkoutSession,
    endWorkoutSession,
    setReminderInterval,
    resetDaily,
    mounted,
  } = useHydration();
  const { permission: notificationPermission, requestPermission, isSupported: notificationsSupported } = useNotifications(0, quietHours, false);
  const shouldRevealIntake = intake < goal;
  const revealedIntake = useHydrationReveal(intake, shouldRevealIntake);
  const [isResetConfirming, setIsResetConfirming] = React.useState(false);
  const [selectedNote, setSelectedNote] = React.useState<HydrationNote>("water");
  const [isNoteMenuOpen, setIsNoteMenuOpen] = React.useState(false);
  const [isCustomQuickOpen, setIsCustomQuickOpen] = React.useState(false);
  const [customDrinkNote, setCustomDrinkNote] = React.useState<HydrationNote | null>(null);
  const [isOnboardingOpen, setIsOnboardingOpen] = React.useState(false);
  const [isOnboardingGoalPickerOpen, setIsOnboardingGoalPickerOpen] = React.useState(false);
  const [isOnboardingReminderPickerOpen, setIsOnboardingReminderPickerOpen] = React.useState(false);
  const [isDailyLogOpen, setIsDailyLogOpen] = React.useState(false);
  const [isStreakOpen, setIsStreakOpen] = React.useState(false);
  const [onboardingStep, setOnboardingStep] = React.useState<OnboardingStep>("welcome");
  const [onboardingGoal, setOnboardingGoal] = React.useState(goal);
  const [onboardingReminder, setOnboardingReminder] = React.useState(0);
  const [editingLog, setEditingLog] = React.useState<DrinkLogItem | null>(null);
  const [workoutClock, setWorkoutClock] = React.useState(0);
  const handledQuickAddRef = React.useRef(false);
  const forcedOnboardingRef = React.useRef(false);
  const favoriteHoldTimerRef = React.useRef<number | null>(null);
  const favoriteHoldTriggeredRef = React.useRef(false);
  const favoritePointerStartRef = React.useRef<{ x: number; y: number } | null>(null);
  const favoriteGestureCancelledRef = React.useRef(false);

  const applyNotificationAction = React.useCallback(
    (action: PendingNotificationAction) => {
      const amount = Number(action.amount);
      const note = action.note && HYDRATION_NOTE_VALUES.has(action.note) ? (action.note as HydrationNote) : "water";

      if (!Number.isFinite(amount) || amount <= 0) return;

      addDrink(Math.min(5000, Math.round(amount)), note);
      if (note === "workout") {
        startWorkoutSession();
      }
    },
    [addDrink, startWorkoutSession]
  );

  useLockedPageScroll(isDailyLogOpen || isOnboardingOpen);

  React.useEffect(() => {
    if (typeof document === "undefined") return;

    if (isOnboardingOpen) {
      document.documentElement.dataset.fluidSetupOpen = "true";
      return;
    }

    delete document.documentElement.dataset.fluidSetupOpen;
  }, [isOnboardingOpen]);

  React.useEffect(() => {
    return () => {
      if (typeof document !== "undefined") {
        delete document.documentElement.dataset.fluidSetupOpen;
      }
    };
  }, []);

  React.useEffect(() => {
    if (!mounted || typeof window === "undefined") return;

    setOnboardingGoal(goal);
    const searchParams = new URLSearchParams(window.location.search);
    const hasSetupParam = searchParams.get("setup") === "true";

    if (hasSetupParam) {
      forcedOnboardingRef.current = true;
    }

    const forceOnboarding = forcedOnboardingRef.current;
    const hasExistingHydrationData = intake > 0 || drinkLog.length > 0 || history.length > 0;
    const hasCompletedOnboarding = localStorage.getItem(ONBOARDING_STORAGE_KEY) === "true";
    const shouldOpenOnboarding = forceOnboarding || (!hasCompletedOnboarding && !hasExistingHydrationData);

    if (!forceOnboarding && !hasCompletedOnboarding && hasExistingHydrationData) {
      localStorage.setItem(ONBOARDING_STORAGE_KEY, "true");
    }

    setIsOnboardingOpen(shouldOpenOnboarding);
    if (shouldOpenOnboarding) {
      setOnboardingStep("welcome");
      if (hasSetupParam) {
        window.history.replaceState(null, "", `${window.location.pathname}${window.location.hash}`);
      }
    }
  }, [drinkLog.length, goal, history.length, intake, mounted]);

  React.useEffect(() => {
    if (!mounted || handledQuickAddRef.current || typeof window === "undefined") return;

    handledQuickAddRef.current = true;

    const searchParams = new URLSearchParams(window.location.search);
    const quickAdd = Number(searchParams.get("quickAdd"));
    const quickAddNote = searchParams.get("quickAddNote");
    const note = quickAddNote && HYDRATION_NOTE_VALUES.has(quickAddNote) ? (quickAddNote as HydrationNote) : "water";

    if (!Number.isFinite(quickAdd) || quickAdd <= 0) return;

    addDrink(Math.min(5000, Math.round(quickAdd)), note);
    if (note === "workout") {
      startWorkoutSession();
    }
    window.history.replaceState(null, "", `${window.location.pathname}${window.location.hash}`);
  }, [addDrink, mounted, startWorkoutSession]);

  React.useEffect(() => {
    if (!mounted || typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;

    const handleMessage = (event: MessageEvent) => {
      const payload = event.data as Partial<PendingNotificationAction> & { type?: string };

      if (payload?.type !== "fluid:add-drink" || !payload.id) return;

      applyNotificationAction({
        id: payload.id,
        amount: Number(payload.amount),
        note: typeof payload.note === "string" ? payload.note : undefined,
        createdAt: typeof payload.createdAt === "number" ? payload.createdAt : undefined,
      });
    };

    navigator.serviceWorker.addEventListener("message", handleMessage);

    takePendingNotificationActions()
      .then((actions) => {
        actions.forEach(applyNotificationAction);
      })
      .catch((err) => {
        console.error("Failed to apply pending notification actions", err);
      });

    return () => {
      navigator.serviceWorker.removeEventListener("message", handleMessage);
    };
  }, [applyNotificationAction, mounted]);

  const clearFavoriteHoldTimer = React.useCallback(() => {
    if (favoriteHoldTimerRef.current === null || typeof window === "undefined") return;

    window.clearTimeout(favoriteHoldTimerRef.current);
    favoriteHoldTimerRef.current = null;
  }, []);

  React.useEffect(() => clearFavoriteHoldTimer, [clearFavoriteHoldTimer]);

  React.useEffect(() => {
    if (!workoutSessionEndsAt || typeof window === "undefined") {
      setWorkoutClock(0);
      return;
    }

    setWorkoutClock(Date.now());
    const intervalId = window.setInterval(() => {
      setWorkoutClock(Date.now());
    }, 30 * 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [workoutSessionEndsAt]);

  if (!mounted) {
    return <HydrationLoadingState />;
  }

  const actualProgress = Math.min(1, Math.max(0, intake / goal));
  const isGoalMet = intake >= goal;
  const remainingForGoal = Math.max(0, goal - intake);
  const streakStats = getStreakStats(history, intake, goal);
  const recentStreakDays = getRecentStreakDays(history, intake, goal);
  const latestLog = drinkLog.slice(0, 3);
  const selectedNoteOption = NOTE_OPTIONS.find((item) => item.value === selectedNote) ?? NOTE_OPTIONS[0];
  const SelectedNoteIcon = selectedNoteOption.Icon;
  const customDrinkLabel = customDrinkNote ? getNoteLabel(customDrinkNote) : "Drink";
  const isWorkoutSessionActive = Boolean(workoutSessionEndsAt && workoutClock > 0 && workoutSessionEndsAt > workoutClock);
  const workoutMinutesLeft = isWorkoutSessionActive
    ? Math.max(1, Math.ceil(((workoutSessionEndsAt ?? 0) - workoutClock) / 60000))
    : 0;
  const workoutReminderCopy = !notificationsSupported
    ? `Workout mode is active. This device cannot send app checks yet. ${workoutMinutesLeft} min left.`
    : notificationPermission === "granted"
      ? `Set checks every ${WORKOUT_REMINDER_INTERVAL_MINUTES} min. ${workoutMinutesLeft} min left.`
      : notificationPermission === "denied"
        ? `Workout mode is active. Enable notifications in Settings for set checks. ${workoutMinutesLeft} min left.`
        : `Allow app notifications for set checks every ${WORKOUT_REMINDER_INTERVAL_MINUTES} min. ${workoutMinutesLeft} min left.`;
  const canAskWorkoutNotifications = isWorkoutSessionActive && notificationsSupported && notificationPermission === "default";
  const handleReset = () => {
    resetDaily();
    setIsResetConfirming(false);
  };

  const handleSelectNote = async (value: HydrationNote) => {
    setSelectedNote(value);
    setIsNoteMenuOpen(false);
    setCustomDrinkNote(null);

    if (value === "workout") {
      startWorkoutSession();
      if (notificationsSupported && typeof window !== "undefined" && "Notification" in window && Notification.permission === "default") {
        await requestPermission();
      }
      return;
    }

    if (value === "coffee" || value === "tea") {
      setCustomDrinkNote(value);
    }
  };

  const handleAddDrink = (amount: number) => {
    addDrink(amount, selectedNote);
  };

  const beginFavoriteHold = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (typeof window === "undefined") return;

    favoriteHoldTriggeredRef.current = false;
    favoriteGestureCancelledRef.current = false;
    favoritePointerStartRef.current = { x: event.clientX, y: event.clientY };
    clearFavoriteHoldTimer();
    favoriteHoldTimerRef.current = window.setTimeout(() => {
      if (favoriteGestureCancelledRef.current) return;

      favoriteHoldTriggeredRef.current = true;
      favoriteHoldTimerRef.current = null;
      setIsCustomQuickOpen(true);
    }, 650);
  };

  const finishFavoriteHold = () => {
    clearFavoriteHoldTimer();
    favoritePointerStartRef.current = null;
  };

  const cancelFavoriteHoldForGesture = () => {
    favoriteGestureCancelledRef.current = true;
    favoritePointerStartRef.current = null;
    clearFavoriteHoldTimer();
  };

  const handleFavoritePointerMove = (event: React.PointerEvent<HTMLButtonElement>) => {
    const start = favoritePointerStartRef.current;
    if (!start) return;

    const deltaX = Math.abs(event.clientX - start.x);
    const deltaY = Math.abs(event.clientY - start.y);

    if (deltaX > 8 || deltaY > 8) {
      cancelFavoriteHoldForGesture();
    }
  };

  const handleFavoriteClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (favoriteGestureCancelledRef.current) {
      event.preventDefault();
      favoriteGestureCancelledRef.current = false;
      return;
    }

    if (favoriteHoldTriggeredRef.current) {
      event.preventDefault();
      favoriteHoldTriggeredRef.current = false;
      return;
    }

    handleAddDrink(quickAddAmount);
  };

  const handleFavoriteContextMenu = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    clearFavoriteHoldTimer();
    favoriteHoldTriggeredRef.current = false;
    setIsCustomQuickOpen(true);
  };

  const handleCustomDrinkAmount = (amount: number) => {
    if (!customDrinkNote) return;

    addDrink(amount, customDrinkNote);
    setCustomDrinkNote(null);
  };

  const handleEditLog = (amount: number) => {
    if (!editingLog) return;

    const sign = editingLog.amount < 0 ? -1 : 1;
    updateDrinkLogItem(editingLog.id, amount * sign, editingLog.note);
    setEditingLog(null);
  };

  const completeOnboarding = async (shouldRequestNotifications = false) => {
    setGoal(onboardingGoal);
    setReminderInterval(onboardingReminder);

    if (shouldRequestNotifications && onboardingReminder > 0 && notificationsSupported) {
      await requestPermission();
    }

    localStorage.setItem(ONBOARDING_STORAGE_KEY, "true");
    forcedOnboardingRef.current = false;
    setIsOnboardingOpen(false);
    setIsOnboardingGoalPickerOpen(false);
    setIsOnboardingReminderPickerOpen(false);
  };

  const skipOnboarding = () => {
    localStorage.setItem(ONBOARDING_STORAGE_KEY, "true");
    forcedOnboardingRef.current = false;
    setIsOnboardingOpen(false);
    setIsOnboardingGoalPickerOpen(false);
    setIsOnboardingReminderPickerOpen(false);
  };

  const goToPreviousOnboardingStep = () => {
    const currentIndex = ONBOARDING_STEPS.indexOf(onboardingStep);
    if (currentIndex <= 0) return;

    setOnboardingStep(ONBOARDING_STEPS[currentIndex - 1]);
  };

  const goToNextOnboardingStep = () => {
    const currentIndex = ONBOARDING_STEPS.indexOf(onboardingStep);

    if (currentIndex < ONBOARDING_STEPS.length - 1) {
      setOnboardingStep(ONBOARDING_STEPS[currentIndex + 1]);
      return;
    }

    void completeOnboarding(onboardingReminder > 0 && notificationsSupported && notificationPermission === "default");
  };

  const onboardingStepIndex = ONBOARDING_STEPS.indexOf(onboardingStep);
  const onboardingCopy = ONBOARDING_STEP_COPY[onboardingStep];
  const onboardingGoalIsCustom = !ONBOARDING_GOALS.includes(onboardingGoal);
  const onboardingReminderIsCustom = !ONBOARDING_REMINDERS.some((option) => option.value === onboardingReminder);
  const onboardingReminderLabel = onboardingReminder > 0 ? `${onboardingReminder}m` : "Off";
  const onboardingWillAskPermission =
    onboardingStep === "notifications" &&
    onboardingReminder > 0 &&
    notificationsSupported &&
    notificationPermission === "default";
  const onboardingPrimaryLabel =
    onboardingWillAskPermission
      ? "Allow & Start"
      : onboardingStepIndex === ONBOARDING_STEPS.length - 1
        ? "Start Fluid"
        : "Next";

  const shouldHideMainChrome = isOnboardingOpen;

  return (
    <main className="relative mx-auto flex min-h-[100dvh] w-full max-w-[25.5rem] min-w-0 flex-col items-center overflow-x-hidden px-3.5 pb-24 pt-6 min-[380px]:px-4 min-[380px]:pb-24 min-[380px]:pt-5 sm:px-6 sm:pb-24 sm:pt-6 md:max-w-[30rem]">
      {createPortal(<WaveBackground progress={actualProgress} />, document.body)}

      <div
        className={`z-10 flex h-full min-w-0 flex-1 flex-col gap-5 w-full transition-opacity duration-200 ${
          shouldHideMainChrome ? "pointer-events-none opacity-0" : "opacity-100"
        }`}
        aria-hidden={shouldHideMainChrome}
      >
        <header className="relative z-20 mt-2 w-full text-center">
          <h1 className="font-display text-5xl font-black text-white drop-shadow-md sm:text-6xl">Fluid.</h1>
          <button
            type="button"
            onClick={() => setIsStreakOpen(true)}
            className={`absolute right-0 top-0 flex h-12 w-12 items-center justify-center rounded-full border border-[1.5px] backdrop-blur-md transition-colors active:scale-95 ${
              isGoalMet || streak > 0
                ? "border-cyan-100/24 bg-water-950/24 text-water-100 hover:bg-white/10"
                : "border-water-300/10 bg-water-950/12 text-water-200/34 hover:text-water-200/62"
            }`}
            aria-label="Open streak details"
            title="Streak"
          >
            <Zap className="h-6 w-6" fill={isGoalMet || streak > 0 ? "currentColor" : "none"} strokeWidth={2.35} />
            {streak > 0 && (
              <span className="font-numeric absolute -bottom-1 -right-1 min-w-5 rounded-full border border-water-100/20 bg-water-300 px-1 text-[0.68rem] font-black leading-5 text-water-950">
                {streak}
              </span>
            )}
          </button>
        </header>

        <div className="mt-4 flex min-h-0 w-full flex-col items-center">
          <ProgressCard
            intake={revealedIntake}
            targetIntake={intake}
            goal={goal}
            goalAction={
              <button
                type="button"
                onClick={() => router.push("/settings?focus=goal")}
                className="font-ui inline-flex items-center gap-1.5 rounded-full border border-cyan-100/18 bg-water-950/22 px-3 py-1.5 text-[0.66rem] font-black uppercase tracking-[0.13em] text-water-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-md transition-all hover:border-cyan-100/30 hover:bg-white/10 active:scale-95"
                aria-label="Change daily goal"
              >
                <Target className="h-3.5 w-3.5 text-cyan-100" strokeWidth={2.6} />
                Change goal
              </button>
            }
          />
        </div>

        <section className="w-full max-w-full self-center space-y-3">
          <div className="flex items-center justify-between gap-3 px-1">
            <p className="font-ui text-[12px] font-bold uppercase tracking-[0.18em] text-water-200/90">Quick add</p>
            <button
              type="button"
              onClick={() => setIsNoteMenuOpen((isOpen) => !isOpen)}
              className="font-ui inline-flex max-w-[11rem] items-center gap-1.5 rounded-full border border-[1.5px] border-water-300/16 bg-water-950/24 px-3 py-2 text-xs font-extrabold text-water-100 transition-all hover:border-cyan-100/26 hover:bg-white/10 hover:text-white active:scale-95"
              aria-expanded={isNoteMenuOpen}
              aria-controls="drink-type-menu"
              aria-label={`Change drink type. Current type: ${selectedNoteOption.label}`}
              title="Change drink type"
            >
              <SelectedNoteIcon className="h-3.5 w-3.5 shrink-0" strokeWidth={2.6} />
              <span className="truncate">{selectedNoteOption.label}</span>
              <Tag className="h-3.5 w-3.5 shrink-0 text-water-300/76" strokeWidth={2.6} />
            </button>
          </div>

          {isNoteMenuOpen && (
            <div
              id="drink-type-menu"
              className="grid grid-cols-2 gap-2 rounded-[1rem] border border-[1.5px] border-water-300/14 bg-water-950/28 p-2 shadow-inner backdrop-blur-md sm:grid-cols-3"
            >
              {NOTE_OPTIONS.map(({ value, label, Icon }) => {
                const isActive = selectedNote === value;

                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => {
                      void handleSelectNote(value);
                    }}
                    className={`font-ui inline-flex min-w-0 items-center justify-center gap-1.5 rounded-xl border border-[1.5px] px-3 py-2 text-xs font-extrabold transition-all ${
                      isActive
                        ? "border-cyan-100/32 bg-cyan-100/18 text-white shadow-[0_8px_18px_rgba(56,189,248,0.16)]"
                        : "border-water-300/14 bg-water-950/18 text-water-200/75 hover:bg-white/10 hover:text-white"
                    }`}
                    aria-pressed={isActive}
                  >
                    <Icon className="h-3.5 w-3.5 shrink-0" strokeWidth={2.6} />
                    <span className="truncate">{label}</span>
                  </button>
                );
              })}
            </div>
          )}

          {isWorkoutSessionActive && (
            <div className="flex items-center gap-3 rounded-[1rem] border border-emerald-100/16 bg-emerald-300/10 px-3 py-3 text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] backdrop-blur-md">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-emerald-100/18 bg-emerald-200/10 text-emerald-50">
                <Dumbbell className="h-4 w-4" strokeWidth={2.5} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-ui text-[0.72rem] font-black uppercase tracking-[0.15em] text-emerald-100/88">Workout hydration</p>
                <p className="font-body mt-0.5 text-xs font-semibold leading-snug text-water-200/78">
                  {workoutReminderCopy}
                </p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1.5">
                {canAskWorkoutNotifications && (
                  <button
                    type="button"
                    onClick={() => {
                      void requestPermission();
                    }}
                    className="font-ui rounded-full border border-cyan-100/20 bg-cyan-100/14 px-3 py-1.5 text-[0.68rem] font-black uppercase tracking-[0.14em] text-cyan-50 transition-colors hover:bg-cyan-100/20"
                  >
                    Allow
                  </button>
                )}
                <button
                  type="button"
                  onClick={endWorkoutSession}
                  className="font-ui rounded-full border border-emerald-100/16 bg-water-950/22 px-3 py-1.5 text-[0.68rem] font-black uppercase tracking-[0.14em] text-water-100 transition-colors hover:bg-white/10"
                >
                  End
                </button>
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={handleFavoriteClick}
            onContextMenu={handleFavoriteContextMenu}
            onPointerCancel={finishFavoriteHold}
            onPointerDown={beginFavoriteHold}
            onPointerLeave={finishFavoriteHold}
            onPointerMove={handleFavoritePointerMove}
            onPointerUp={finishFavoriteHold}
            className="group relative flex min-h-[6.35rem] w-full touch-manipulation items-center justify-between overflow-hidden rounded-[1.1rem] border border-[1.5px] border-cyan-100/24 bg-gradient-to-br from-cyan-300/26 via-water-500/18 to-emerald-300/18 px-3.5 py-4 text-left shadow-[0_18px_34px_rgba(8,47,73,0.24),inset_0_1px_0_rgba(255,255,255,0.18)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-cyan-100/34 hover:brightness-110 active:scale-[0.98] min-[380px]:rounded-[1.25rem] min-[380px]:px-4"
            aria-label={`Add favorite amount ${quickAddAmount} milliliters as ${selectedNoteOption.label}. Hold to edit.`}
            title="Hold to edit favorite amount"
          >
            <div className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-white/70 to-transparent" />
            <div
              className="pointer-events-none absolute inset-y-[-14%] -left-[120%] w-[205%] rotate-[14deg] bg-[linear-gradient(90deg,rgba(255,255,255,0),rgba(255,255,255,0.14),rgba(255,255,255,0.36),rgba(255,255,255,0.14),rgba(255,255,255,0))] opacity-0 blur-[4px] animate-[quick-add-shimmer_14s_linear_infinite]"
              style={{ animationDelay: "1.2s" }}
            />
            <div className="relative z-10 flex min-w-0 items-center gap-3 pr-3">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[1rem] border border-cyan-100/22 bg-water-950/22 text-cyan-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.14)]">
                {quickAddAmount <= 200 ? (
                  <SipIcon className="h-8 w-8 drop-shadow-md" />
                ) : quickAddAmount <= 300 ? (
                  <GlassIcon className="h-8 w-8 drop-shadow-md" />
                ) : quickAddAmount <= 450 ? (
                  <MugIcon className="h-8 w-8 drop-shadow-md" />
                ) : (
                  <BottleIcon className="h-8 w-8 drop-shadow-md" />
                )}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-cyan-100">
                  <span className="font-ui text-[0.76rem] font-black uppercase tracking-[0.16em]">Favorite</span>
                </div>
                <div className="relative mt-1 h-5 min-w-[6.75rem] overflow-hidden [perspective:420px]">
                  <div className="fluid-favorite-caption-track font-body text-xs font-semibold text-water-100/82">
                    <span className="fluid-favorite-caption-row">Tap to add</span>
                    <span className="fluid-favorite-caption-row">Hold to edit</span>
                    <span className="fluid-favorite-caption-row" aria-hidden="true">
                      Tap to add
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div className="relative z-10 shrink-0 text-right">
              <p className="font-numeric text-4xl font-black leading-none text-white drop-shadow-xl sm:text-5xl">{quickAddAmount}</p>
              <p className="font-ui mt-1 text-xs font-black uppercase tracking-[0.22em] text-cyan-100/75">ml</p>
            </div>
          </button>

          <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
            {SECONDARY_QUICK_AMOUNTS.map(({ amount, label, Icon, surface, iconSurface, glow, halo }, index) => (
              <button
                key={amount}
                type="button"
                onClick={() => handleAddDrink(amount)}
                className={`group relative flex min-h-[4.95rem] overflow-hidden rounded-[1rem] border border-[1.5px] px-3 py-2.5 text-left shadow-[0_8px_18px_rgba(0,0,0,0.12),inset_0_1px_1px_rgba(255,255,255,0.10)] backdrop-blur-lg transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_12px_24px_rgba(56,189,248,0.10),inset_0_1px_2px_rgba(255,255,255,0.14)] active:scale-[0.97] min-[380px]:min-h-[5.35rem] min-[380px]:rounded-[1.05rem] ${surface}`}
                aria-label={`Add ${amount} milliliters as ${selectedNoteOption.label}`}
              >
                <div className={`absolute -right-10 -top-11 h-24 w-24 rounded-full ${glow} blur-2xl transition-opacity duration-300 group-hover:opacity-80`} />
                <div className="absolute inset-x-4 top-0 h-px bg-gradient-to-r from-transparent via-white/50 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-br from-white/[0.045] via-transparent to-water-950/14 opacity-80 transition-opacity duration-300 group-hover:opacity-100" />
                <div
                  className="pointer-events-none absolute inset-y-[-14%] -left-[120%] w-[205%] rotate-[14deg] bg-[linear-gradient(90deg,rgba(255,255,255,0),rgba(255,255,255,0.14),rgba(255,255,255,0.38),rgba(255,255,255,0.14),rgba(255,255,255,0))] opacity-0 blur-[4px] animate-[quick-add-shimmer_15s_linear_infinite]"
                  style={{ animationDelay: SHIMMER_DELAYS[index % SHIMMER_DELAYS.length] }}
                />
                <div className="relative z-10 flex w-full items-center gap-3">
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-[0.9rem] border border-[1.5px] transition-transform duration-300 group-hover:scale-105 min-[380px]:h-11 min-[380px]:w-11 ${iconSurface} ${halo}`}>
                    <Icon className="h-5.5 w-5.5 drop-shadow-md min-[380px]:h-6 min-[380px]:w-6" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="font-ui block truncate text-[0.68rem] font-black uppercase tracking-[0.14em] text-water-200/82 transition-colors duration-300 group-hover:text-white">
                      {label}
                    </span>
                    <span className="font-numeric mt-1 block whitespace-nowrap text-[1.25rem] font-black leading-none text-white drop-shadow-lg min-[380px]:text-[1.42rem]">
                      {amount}
                      <span className="font-ui ml-1 text-[0.66rem] font-extrabold tracking-normal text-water-300/82">ml</span>
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={undoLastDrink}
              disabled={drinkLog.length === 0}
              className="rounded-[1rem] border-water-300/16 bg-water-950/28 px-3 py-3 text-water-100 disabled:opacity-35"
            >
              <RotateCcw className="mr-2 h-4 w-4" strokeWidth={2.5} />
              Undo
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => subtractDrink(250, selectedNote)}
              disabled={intake === 0}
              className="rounded-[1rem] border-rose-200/18 bg-rose-500/10 px-3 py-3 text-rose-50 hover:bg-rose-500/18 disabled:opacity-35"
            >
              <Minus className="mr-2 h-4 w-4" strokeWidth={2.5} />
              250 ml
            </Button>
          </div>

          {latestLog.length > 0 && (
            <div className="rounded-[1.15rem] border border-[1.5px] border-water-300/14 bg-water-950/22 px-4 py-3 backdrop-blur-md">
              <div className="mb-2 flex items-center justify-between">
                <p className="font-ui text-[0.68rem] font-black uppercase tracking-[0.2em] text-water-300/82">Recent</p>
                {drinkLog.length > 3 ? (
                  <button
                    type="button"
                    onClick={() => setIsDailyLogOpen(true)}
                    className="font-ui rounded-full border border-[1.5px] border-water-300/14 bg-white/5 px-3 py-1 text-[0.68rem] font-black uppercase tracking-[0.16em] text-water-200 transition-colors hover:bg-white/10 hover:text-white"
                  >
                    View all
                  </button>
                ) : (
                  <p className="font-body text-xs font-semibold text-water-300/70">{drinkLog.length} actions</p>
                )}
              </div>
              <div className="space-y-2">
                {latestLog.map((item) => (
                  <div key={item.id} className="grid grid-cols-[1fr_auto] items-center gap-3 rounded-2xl bg-water-900/20 px-3 py-2">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <span className={`font-ui font-black ${item.amount > 0 ? "text-cyan-100" : "text-rose-100"}`}>
                          {item.amount > 0 ? "+" : ""}
                          {item.amount} ml
                        </span>
                        <span className="font-body text-xs font-semibold text-water-300/70">{formatLogTime(item.timestamp)}</span>
                      </div>
                      <p className="font-body mt-0.5 truncate text-xs font-semibold text-water-300/68">{getNoteLabel(item.note)}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setEditingLog(item)}
                        className="rounded-full p-2 text-water-300/78 transition-colors hover:bg-white/10 hover:text-white"
                        aria-label={`Edit ${Math.abs(item.amount)} milliliter log`}
                      >
                        <Pencil className="h-3.5 w-3.5" strokeWidth={2.5} />
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteDrinkLogItem(item.id)}
                        className="rounded-full p-2 text-rose-100/75 transition-colors hover:bg-rose-500/14 hover:text-rose-50"
                        aria-label={`Delete ${Math.abs(item.amount)} milliliter log`}
                      >
                        <Trash2 className="h-3.5 w-3.5" strokeWidth={2.5} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={() => setIsResetConfirming(true)}
            disabled={intake === 0 && drinkLog.length === 0}
            className="font-ui mx-auto flex items-center justify-center gap-2 rounded-full border border-[1.5px] border-rose-200/16 bg-rose-500/8 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-rose-50/82 transition-all hover:bg-rose-500/14 hover:text-rose-50 active:scale-95 disabled:pointer-events-none disabled:opacity-35"
            aria-label="Reset today's hydration"
          >
            <RefreshCw className="h-3.5 w-3.5" strokeWidth={2.5} />
            Reset today
          </button>
        </section>
      </div>

      <NumberPickerDialog
        isOpen={isCustomQuickOpen}
        value={quickAddAmount}
        min={50}
        max={5000}
        title="Favorite Amount"
        suffix="ml"
        onChange={setQuickAddAmount}
        onClose={() => setIsCustomQuickOpen(false)}
      />

      <NumberPickerDialog
        isOpen={isOnboardingGoalPickerOpen}
        value={0}
        min={500}
        max={6000}
        title="Daily Rhythm"
        suffix="ml"
        onChange={setOnboardingGoal}
        onClose={() => setIsOnboardingGoalPickerOpen(false)}
      />

      <NumberPickerDialog
        isOpen={isOnboardingReminderPickerOpen}
        value={0}
        min={5}
        max={240}
        title="Reminder Rhythm"
        suffix="m"
        onChange={setOnboardingReminder}
        onClose={() => setIsOnboardingReminderPickerOpen(false)}
      />

      <NumberPickerDialog
        isOpen={customDrinkNote !== null}
        value={0}
        min={1}
        max={5000}
        title={`${customDrinkLabel} Amount`}
        suffix="ml"
        onChange={handleCustomDrinkAmount}
        onClose={() => setCustomDrinkNote(null)}
      />

      <NumberPickerDialog
        isOpen={editingLog !== null}
        value={editingLog ? Math.abs(editingLog.amount) : 250}
        min={1}
        max={5000}
        title={editingLog ? `Edit ${Math.abs(editingLog.amount)} ml` : "Edit Log"}
        suffix="ml"
        startWithValue
        onChange={handleEditLog}
        onClose={() => setEditingLog(null)}
      />

      <StreakDetailsSheet
        isOpen={isStreakOpen}
        streak={streak}
        streakShieldCharges={streakShieldCharges}
        remaining={remainingForGoal}
        isGoalMet={isGoalMet}
        recentDays={recentStreakDays}
        bestStreak={streakStats.bestStreak}
        onClose={() => setIsStreakOpen(false)}
      />

      {isDailyLogOpen && typeof document !== "undefined"
        ? createPortal(
        <div
          className="fluid-modal-backdrop fixed inset-0 z-[110] flex items-end justify-center overflow-hidden px-3 pb-[calc(max(0.85rem,env(safe-area-inset-bottom))+5.25rem)] pt-[max(0.75rem,env(safe-area-inset-top))]"
          data-swipe-ignore="true"
          onClick={() => setIsDailyLogOpen(false)}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="daily-log-title"
            className="fluid-glass-soft flex max-h-[min(31rem,calc(100dvh-10.5rem))] w-full max-w-[25.5rem] flex-col overflow-hidden rounded-[1.65rem] border border-[1.5px] border-water-300/14 bg-water-950/96 shadow-[0_24px_70px_rgba(0,0,0,0.46)] md:max-w-[30rem]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 border-b border-water-300/12 px-5 py-4">
              <div>
                <p className="font-ui text-[11px] font-black uppercase tracking-[0.22em] text-water-300/80">Today</p>
                <h2 id="daily-log-title" className="font-ui mt-1 text-2xl font-black tracking-normal text-white">
                  Drink log
                </h2>
                <p className="font-body mt-1 text-sm font-semibold text-water-300/78">{drinkLog.length} actions recorded</p>
              </div>
              <button
                type="button"
                onClick={() => setIsDailyLogOpen(false)}
                className="rounded-full p-2 text-water-200/80 transition-colors hover:bg-white/10 hover:text-white"
                aria-label="Close daily log"
              >
                <X className="h-5 w-5" strokeWidth={2.5} />
              </button>
            </div>

            <div className="fluid-scroll-panel min-h-0 flex-1 touch-pan-y overflow-y-auto overscroll-contain px-4 py-4 [-webkit-overflow-scrolling:touch]">
              <div className="space-y-2">
                {drinkLog.map((item) => (
                  <div key={item.id} className="grid grid-cols-[1fr_auto] items-center gap-3 rounded-2xl border border-[1.5px] border-water-300/14 bg-water-900/22 px-3 py-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <span className={`font-ui font-black ${item.amount > 0 ? "text-cyan-100" : "text-rose-100"}`}>
                          {item.amount > 0 ? "+" : ""}
                          {item.amount} ml
                        </span>
                        <span className="font-body text-xs font-semibold text-water-300/70">{formatLogTime(item.timestamp)}</span>
                      </div>
                      <p className="font-body mt-0.5 truncate text-xs font-semibold text-water-300/68">{getNoteLabel(item.note)}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingLog(item);
                          setIsDailyLogOpen(false);
                        }}
                        className="rounded-full p-2 text-water-300/78 transition-colors hover:bg-white/10 hover:text-white"
                        aria-label={`Edit ${Math.abs(item.amount)} milliliter log`}
                      >
                        <Pencil className="h-3.5 w-3.5" strokeWidth={2.5} />
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteDrinkLogItem(item.id)}
                        className="rounded-full p-2 text-rose-100/75 transition-colors hover:bg-rose-500/14 hover:text-rose-50"
                        aria-label={`Delete ${Math.abs(item.amount)} milliliter log`}
                      >
                        <Trash2 className="h-3.5 w-3.5" strokeWidth={2.5} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>,
            document.body
          )
        : null}

      <ResetConfirmDialog
        isOpen={isResetConfirming}
        onCancel={() => setIsResetConfirming(false)}
        onConfirm={handleReset}
      />

      {isOnboardingOpen && typeof document !== "undefined"
        ? createPortal(
        <div className="fixed inset-0 z-[120] grid place-items-center overflow-hidden bg-water-950 px-3 py-[max(1rem,env(safe-area-inset-top),env(safe-area-inset-bottom))] sm:px-6 sm:py-6" data-swipe-ignore="true">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(56,189,248,0.16),transparent_42%),linear-gradient(180deg,rgba(10,59,89,0.96),rgba(8,47,73,1))]" />
          <div
            className="relative flex max-h-[calc(100dvh-(max(1rem,env(safe-area-inset-top),env(safe-area-inset-bottom))*2))] w-full max-w-[24rem] flex-col overflow-hidden rounded-[1.55rem] border border-[1.5px] border-water-300/16 bg-water-950/96 shadow-[0_24px_70px_rgba(0,0,0,0.42)] sm:max-h-[calc(100dvh-3rem)]"
            role="dialog"
            aria-modal="true"
            aria-label="Fluid quick setup"
          >
            <div className="relative overflow-hidden border-b border-water-300/12 px-5 pb-4 pt-5">
              <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-white/55 to-transparent" />
              <div className="relative flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="font-ui text-[11px] font-black uppercase tracking-[0.22em] text-water-300/80">
                    {onboardingCopy.eyebrow}
                  </p>
                  <h2 className="font-ui mt-1.5 text-[1.7rem] font-black leading-tight tracking-normal text-white">
                    {onboardingCopy.title}
                  </h2>
                  <p className="font-body mt-1.5 text-sm font-semibold leading-relaxed text-water-300/82">
                    {onboardingCopy.copy}
                  </p>
                </div>
                <div className="font-numeric shrink-0 rounded-full border border-water-300/16 bg-white/[0.055] px-3 py-1.5 text-sm font-black text-water-100">
                  {onboardingStepIndex + 1}/{ONBOARDING_STEPS.length}
                </div>
              </div>

              <div className="relative mt-4 grid grid-cols-4 gap-2">
                {ONBOARDING_STEPS.map((step, index) => {
                  const isActive = step === onboardingStep;
                  const isDone = index < onboardingStepIndex;
                  const label =
                    step === "welcome" ? "Start" : step === "goal" ? "Goal" : step === "reminders" ? "Rhythm" : "Notify";

                  return (
                    <button
                      key={step}
                      type="button"
                      onClick={() => setOnboardingStep(step)}
                      className={`h-9 rounded-full border border-[1.5px] px-1.5 text-[0.58rem] font-ui font-black uppercase tracking-[0.1em] transition-all min-[380px]:text-[0.63rem] ${
                        isActive
                          ? "border-cyan-100/32 bg-cyan-100/18 text-white shadow-[0_8px_18px_rgba(56,189,248,0.14)]"
                          : isDone
                            ? "border-water-200/20 bg-water-400/12 text-water-100/84"
                            : "border-water-300/12 bg-water-950/18 text-water-300/66"
                      }`}
                      aria-current={isActive ? "step" : undefined}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>

              <div className="relative mt-4 grid grid-cols-2 gap-2 rounded-[1rem] border border-water-300/12 bg-water-950/20 p-2">
                <div className="min-w-0 rounded-xl bg-white/[0.045] px-2.5 py-2">
                  <p className="font-ui text-[0.62rem] font-black uppercase tracking-[0.12em] text-water-300/68">Daily</p>
                  <p className="font-numeric mt-0.5 truncate text-sm font-black text-white">{formatLiters(onboardingGoal)}</p>
                </div>
                <div className="min-w-0 rounded-xl bg-white/[0.045] px-2.5 py-2">
                  <p className="font-ui text-[0.62rem] font-black uppercase tracking-[0.12em] text-water-300/68">Reminder</p>
                  <p className="font-numeric mt-0.5 truncate text-sm font-black text-white">{onboardingReminderLabel}</p>
                </div>
              </div>
            </div>

            <div className="fluid-scroll-panel min-h-0 flex-1 overflow-y-auto px-4 py-4 [-webkit-overflow-scrolling:touch]">
              {onboardingStep === "welcome" && (
                <section className="space-y-3" aria-label="Welcome to Fluid">
                  <div className="rounded-[1.2rem] border border-cyan-100/18 bg-gradient-to-br from-cyan-100/14 via-white/[0.055] to-water-950/22 px-4 py-5 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-cyan-100/22 bg-cyan-100/12 text-cyan-50 shadow-[0_0_26px_rgba(56,189,248,0.13)]">
                      <Droplets className="h-8 w-8" strokeWidth={2.45} />
                    </div>
                    <p className="font-display mt-4 text-4xl font-black leading-none text-white">Fluid.</p>
                    <p className="font-body mx-auto mt-3 max-w-[18rem] text-sm font-semibold leading-relaxed text-water-200/82">
                      Set a goal, choose a calm reminder rhythm, and start tracking without noise.
                    </p>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label: "Calm", value: "No pressure" },
                      { label: "Local", value: "Your data" },
                      { label: "Fast", value: "One tap" },
                    ].map((item) => (
                      <div key={item.label} className="rounded-xl border border-water-300/12 bg-water-900/22 px-2.5 py-3 text-center">
                        <p className="font-ui text-[0.64rem] font-black uppercase tracking-[0.12em] text-water-300/70">{item.label}</p>
                        <p className="font-body mt-1 text-xs font-bold leading-tight text-white/88">{item.value}</p>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {onboardingStep === "goal" && (
                <section className="space-y-3" aria-label="Choose daily rhythm">
                  <div className="rounded-[1rem] border border-water-300/12 bg-water-950/18 p-3.5">
                    <div className="flex items-center gap-2 text-water-200">
                      <Target className="h-4 w-4" strokeWidth={2.5} />
                      <p className="font-ui text-sm font-bold">Daily rhythm</p>
                    </div>
                    <p className="font-body mt-2 text-xs font-semibold leading-relaxed text-water-300/78">
                      Start with something comfortable. You can change it later.
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {ONBOARDING_GOALS.map((preset) => {
                      const isActive = onboardingGoal === preset;

                      return (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => setOnboardingGoal(preset)}
                          className={`font-numeric min-h-[4rem] rounded-xl border border-[1.5px] px-3 py-3 text-lg font-black transition-all ${
                            isActive
                              ? "border-water-200/36 bg-water-400/22 text-white shadow-[0_8px_18px_rgba(56,189,248,0.14)]"
                              : "border-water-300/14 bg-water-900/28 text-water-200 hover:bg-white/10"
                          }`}
                          aria-pressed={isActive}
                        >
                          {formatLiters(preset)}
                        </button>
                      );
                    })}
                    <button
                      type="button"
                      onClick={() => setIsOnboardingGoalPickerOpen(true)}
                      className={`min-h-[4rem] rounded-xl border border-[1.5px] px-3 py-3 text-left transition-all sm:col-span-2 ${
                        onboardingGoalIsCustom
                          ? "border-cyan-100/36 bg-cyan-100/18 text-white shadow-[0_8px_18px_rgba(56,189,248,0.14)]"
                          : "border-water-300/14 bg-water-900/28 text-water-200 hover:bg-white/10"
                      }`}
                      aria-pressed={onboardingGoalIsCustom}
                    >
                      <span className="font-ui block text-[0.68rem] font-black uppercase tracking-[0.12em] text-water-300/84">
                        Custom
                      </span>
                      <span className="font-numeric mt-1 block text-lg font-black">{formatLiters(onboardingGoal)}</span>
                    </button>
                  </div>
                </section>
              )}

              {onboardingStep === "reminders" && (
                <section className="space-y-3" aria-label="Choose reminder rhythm">
                  <div className="rounded-[1rem] border border-water-300/12 bg-water-950/18 p-3.5">
                    <div className="flex items-center gap-2 text-water-200">
                      <BellRing className="h-4 w-4" strokeWidth={2.5} />
                      <p className="font-ui text-sm font-bold">Gentle reminders</p>
                    </div>
                    <p className="font-body mt-2 text-xs font-semibold leading-relaxed text-water-300/78">
                      You control this. Fluid can stay quiet if you prefer.
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-2 min-[380px]:grid-cols-4">
                    {ONBOARDING_REMINDERS.map(({ label, value }) => {
                      const isActive = onboardingReminder === value;

                      return (
                        <button
                          key={label}
                          type="button"
                          onClick={() => setOnboardingReminder(value)}
                          className={`font-ui min-h-[4rem] rounded-xl border border-[1.5px] px-3 py-3 text-sm font-black transition-all ${
                            isActive
                              ? "border-emerald-100/32 bg-emerald-300/14 text-white shadow-[0_8px_18px_rgba(45,212,191,0.12)]"
                              : "border-water-300/14 bg-water-900/28 text-water-200 hover:bg-white/10"
                          }`}
                          aria-pressed={isActive}
                        >
                          {label}
                        </button>
                      );
                    })}
                    <button
                      type="button"
                      onClick={() => setIsOnboardingReminderPickerOpen(true)}
                      className={`font-ui min-h-[4rem] rounded-xl border border-[1.5px] px-3 py-3 text-sm font-black transition-all min-[380px]:col-span-4 ${
                        onboardingReminderIsCustom
                          ? "border-emerald-100/32 bg-emerald-300/14 text-white shadow-[0_8px_18px_rgba(45,212,191,0.12)]"
                          : "border-water-300/14 bg-water-900/28 text-water-200 hover:bg-white/10"
                      }`}
                      aria-pressed={onboardingReminderIsCustom}
                    >
                      Custom {onboardingReminderIsCustom ? `- ${onboardingReminderLabel}` : ""}
                    </button>
                  </div>
                  {onboardingReminder > 0 && !notificationsSupported && (
                    <p className="font-body rounded-xl border border-rose-200/18 bg-rose-500/10 px-3 py-2 text-xs font-semibold text-rose-50/86">
                      Notifications are not available on this device yet.
                    </p>
                  )}
                </section>
              )}

              {onboardingStep === "notifications" && (
                <section className="space-y-3" aria-label="Allow notifications">
                  <div
                    className={`rounded-[1.2rem] border p-4 ${
                      onboardingReminder <= 0
                        ? "border-water-300/12 bg-water-950/18"
                        : !notificationsSupported
                          ? "border-rose-200/18 bg-rose-500/10"
                          : notificationPermission === "granted"
                            ? "border-emerald-100/18 bg-emerald-300/10"
                            : notificationPermission === "denied"
                              ? "border-rose-200/18 bg-rose-500/10"
                              : "border-cyan-100/18 bg-cyan-300/10"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border ${
                          onboardingReminder <= 0
                            ? "border-water-300/14 bg-water-900/24 text-water-200"
                            : notificationPermission === "granted"
                              ? "border-emerald-100/22 bg-emerald-300/12 text-emerald-50"
                              : notificationPermission === "denied" || !notificationsSupported
                                ? "border-rose-100/20 bg-rose-500/12 text-rose-50"
                                : "border-cyan-100/18 bg-cyan-100/10 text-cyan-50"
                        }`}
                      >
                        <BellRing className="h-5.5 w-5.5" strokeWidth={2.45} />
                      </div>
                      <div className="min-w-0">
                        <p className="font-ui text-sm font-black text-white">
                          {onboardingReminder <= 0
                            ? "Fluid will stay quiet."
                            : !notificationsSupported
                              ? "Notifications are not available here."
                              : notificationPermission === "granted"
                                ? "Notifications are already allowed."
                                : notificationPermission === "denied"
                                  ? "Phone settings are needed."
                                  : "Your phone can ask now."}
                        </p>
                        <p className="font-body mt-1 text-xs font-semibold leading-relaxed text-water-300/78">
                          {onboardingReminder <= 0
                            ? "You can enable reminders later from Settings whenever you want."
                            : !notificationsSupported
                              ? "You can still track water inside Fluid without reminders."
                              : notificationPermission === "granted"
                                ? `Your ${onboardingReminderLabel} rhythm can run with app notifications.`
                                : notificationPermission === "denied"
                                  ? "Fluid cannot turn them back on by itself. Finish setup now, then open Settings to allow them."
                                  : `Fluid can ask once for permission. If you allow it, your ${onboardingReminderLabel} rhythm can run outside the app.`}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-[1rem] border border-water-300/12 bg-white/[0.045] px-3.5 py-3">
                    <p className="font-ui text-[0.7rem] font-black uppercase tracking-[0.16em] text-water-300/74">
                      What Fluid sends
                    </p>
                    <div className="mt-3 space-y-2">
                      {[
                        "Gentle reminders at your chosen rhythm.",
                        "Small follow-ups if nothing was logged.",
                        "Quick add actions when your phone supports them.",
                      ].map((item) => (
                        <div key={item} className="flex items-start gap-2">
                          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-water-300/80" />
                          <p className="font-body text-xs font-semibold leading-relaxed text-water-100/82">{item}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {onboardingReminder > 0 && notificationsSupported && notificationPermission === "granted" && (
                    <p className="font-body rounded-xl border border-emerald-100/18 bg-emerald-300/10 px-3 py-2 text-xs font-semibold text-emerald-50/88">
                      Nothing else needed. Start Fluid and reminders are ready.
                    </p>
                  )}

                  {onboardingReminder > 0 && notificationsSupported && notificationPermission === "denied" && (
                    <p className="font-body rounded-xl border border-rose-200/18 bg-rose-500/10 px-3 py-2 text-xs font-semibold text-rose-50/86">
                      After setup, go to Settings / Reminders. Fluid will show the phone settings steps there.
                    </p>
                  )}

                  {onboardingReminder > 0 && !notificationsSupported && (
                    <p className="font-body rounded-xl border border-rose-200/18 bg-rose-500/10 px-3 py-2 text-xs font-semibold text-rose-50/86">
                      Notifications are not available on this device yet.
                    </p>
                  )}
                </section>
              )}
            </div>

            <div className="grid grid-cols-[auto_1fr] gap-3 border-t border-water-300/12 px-5 py-4">
              <div className="flex gap-2">
                <Button type="button" variant="ghost" size="sm" onClick={skipOnboarding} className="rounded-xl px-3">
                  Skip
                </Button>
                {onboardingStepIndex > 0 && (
                  <Button type="button" variant="secondary" size="sm" onClick={goToPreviousOnboardingStep} className="rounded-xl px-3">
                    Back
                  </Button>
                )}
              </div>
              <Button type="button" variant="primary" size="sm" onClick={goToNextOnboardingStep} className="rounded-xl">
                {onboardingPrimaryLabel}
              </Button>
            </div>
          </div>
        </div>,
            document.body
          )
        : null}
    </main>
  );
}
