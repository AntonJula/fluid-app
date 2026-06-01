"use client";

import React from "react";
import { createPortal } from "react-dom";
import { useHydration } from "@/hooks/useHydration";
import { Card } from "@/components/ui/Card";
import { HydrationLoadingState } from "@/components/HydrationLoadingState";
import { Flame, Calendar, Trophy, Waves, ChartColumn, Target, GlassWater, CalendarSearch, ChevronLeft, ChevronRight, X } from "lucide-react";
import { formatDateLocal } from "@/lib/date";
import type { DrinkLogItem, HydrationNote } from "@/lib/hydrationState";

const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MONTH_FORMATTER = new Intl.DateTimeFormat("en", { month: "long", year: "numeric" });
const DAY_DETAIL_FORMATTER = new Intl.DateTimeFormat("en", { weekday: "long", month: "short", day: "numeric" });
const EMPTY_MONTH_SELECTION = "";
const NOTE_ORDER: HydrationNote[] = ["water", "coffee", "tea", "workout", "hot-day"];
const NOTE_LABELS: Record<HydrationNote, string> = {
  water: "Water",
  coffee: "Coffee",
  tea: "Tea",
  workout: "Workout",
  "hot-day": "Hot day",
};

function buildDrinkBreakdown(log: DrinkLogItem[], expectedIntake: number): Partial<Record<HydrationNote, number>> | undefined {
  const totals = log.reduce<Partial<Record<HydrationNote, number>>>((breakdown, item) => {
    const note = item.note ?? "water";
    breakdown[note] = Math.max(0, Math.round((breakdown[note] ?? 0) + item.amount));
    return breakdown;
  }, {});
  const total = Object.values(totals).reduce((sum, amount) => sum + (amount ?? 0), 0);

  if (expectedIntake > 0 && total !== expectedIntake) {
    return { water: expectedIntake };
  }

  return Object.values(totals).some((amount) => (amount ?? 0) > 0) ? totals : undefined;
}

function getBreakdownEntries(breakdown: Partial<Record<HydrationNote, number>> | undefined, fallbackIntake: number) {
  const source = breakdown ?? (fallbackIntake > 0 ? { water: fallbackIntake } : undefined);
  if (!source) return [];

  return NOTE_ORDER.map((note) => ({ note, label: NOTE_LABELS[note], amount: source[note] ?? 0 })).filter(
    (item) => item.amount > 0
  );
}

function parseDateLocal(dateStr: string) {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function getMonthStart(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function shiftMonth(date: Date, offset: number) {
  return new Date(date.getFullYear(), date.getMonth() + offset, 1);
}

function isSameMonth(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}

function getDefaultMonthSelection(monthDate: Date, todayDate: Date) {
  return isSameMonth(monthDate, todayDate) ? formatDateLocal(todayDate) : EMPTY_MONTH_SELECTION;
}

function useLockedPageScroll(isLocked: boolean) {
  React.useEffect(() => {
    if (!isLocked || typeof window === "undefined") return;

    const root = document.documentElement;
    const body = document.body;
    const previousRootOverflow = root.style.overflow;
    const previousBodyOverflow = body.style.overflow;
    const previousRootOverscroll = root.style.overscrollBehavior;
    const previousBodyOverscroll = body.style.overscrollBehavior;
    const previousBodyTouchAction = body.style.touchAction;

    root.style.overflow = "hidden";
    root.style.overscrollBehavior = "none";
    body.style.overflow = "hidden";
    body.style.overscrollBehavior = "none";
    body.style.touchAction = "none";

    return () => {
      root.style.overflow = previousRootOverflow;
      root.style.overscrollBehavior = previousRootOverscroll;
      body.style.overflow = previousBodyOverflow;
      body.style.overscrollBehavior = previousBodyOverscroll;
      body.style.touchAction = previousBodyTouchAction;
    };
  }, [isLocked]);
}

function useInView<T extends HTMLElement>() {
  const ref = React.useRef<T | null>(null);
  const [isInView, setIsInView] = React.useState(false);

  React.useEffect(() => {
    const element = ref.current;
    if (!element || typeof window === "undefined") return;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReducedMotion || !("IntersectionObserver" in window)) {
      setIsInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.34, rootMargin: "0px 0px -12% 0px" }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, []);

  return [ref, isInView] as const;
}

function getWeekDates(anchor: Date, offsetWeeks = 0) {
  const currentDay = anchor.getDay();
  const distanceToMonday = currentDay === 0 ? 6 : currentDay - 1;
  const monday = new Date(anchor);

  monday.setDate(anchor.getDate() - distanceToMonday + offsetWeeks * 7);

  return Array.from({ length: 7 }).map((_, index) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + index);
    return formatDateLocal(date);
  });
}

function getMonthDays(anchor: Date) {
  const year = anchor.getFullYear();
  const month = anchor.getMonth();
  const firstDay = new Date(year, month, 1);
  const leadingBlankDays = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const visibleDays = [
    ...Array.from({ length: leadingBlankDays }).map(() => null),
    ...Array.from({ length: daysInMonth }).map((_, index) => {
      const date = new Date(year, month, index + 1);
      return {
        date: formatDateLocal(date),
        day: index + 1,
      };
    }),
  ];

  return [
    ...visibleDays,
    ...Array.from({ length: Math.max(0, 42 - visibleDays.length) }).map(() => null),
  ];
}

export default function StatsPage() {
  const { streak, history, intake, goal, drinkLog, mounted } = useHydration();
  const [isMonthViewOpen, setIsMonthViewOpen] = React.useState(false);
  const [visibleMonthDate, setVisibleMonthDate] = React.useState(() => getMonthStart(new Date()));
  const [selectedMonthDate, setSelectedMonthDate] = React.useState(() => formatDateLocal(new Date()));
  const [trackingCardRef, isTrackingInView] = useInView<HTMLDivElement>();
  useLockedPageScroll(isMonthViewOpen);

  if (!mounted) {
    return <HydrationLoadingState />;
  }

  const todayDate = new Date();
  const today = formatDateLocal(todayDate);
  const currentWeek = getWeekDates(todayDate);
  const previousWeek = getWeekDates(todayDate, -1);
  const chartData = currentWeek.map((dateStr) => {
    if (dateStr === today) {
      return { date: dateStr, intake, goal };
    }

    const found = history.find((item) => item.date === dateStr);
    return found ?? { date: dateStr, intake: 0, goal };
  });
  const previousWeekData = previousWeek.map((dateStr) => history.find((item) => item.date === dateStr) ?? { date: dateStr, intake: 0, goal });
  const todayBreakdown = buildDrinkBreakdown(drinkLog, intake);
  const allTrackedDays = [
    ...history,
    { date: today, intake, goal, ...(todayBreakdown ? { breakdown: todayBreakdown } : intake > 0 ? { breakdown: { water: intake } } : {}) },
  ].sort((a, b) => a.date.localeCompare(b.date));
  const trackedByDate = new Map(allTrackedDays.map((day) => [day.date, day]));
  const monthDays = getMonthDays(visibleMonthDate);
  const hasAnyTrackedWater = intake > 0 || history.some((day) => day.intake > 0);
  const hasSelectedMonthDate = selectedMonthDate !== EMPTY_MONTH_SELECTION;
  const selectedMonthDay = hasSelectedMonthDate ? trackedByDate.get(selectedMonthDate) : undefined;
  const selectedMonthIntake = selectedMonthDay?.intake ?? 0;
  const selectedMonthGoal = selectedMonthDay?.goal ?? goal;
  const selectedMonthProgress = Math.min(100, Math.round((selectedMonthIntake / Math.max(selectedMonthGoal, 1)) * 100));
  const selectedMonthIsFuture = hasSelectedMonthDate && selectedMonthDate > today;
  const selectedMonthBreakdownEntries = getBreakdownEntries(selectedMonthDay?.breakdown, selectedMonthIntake);

  const maxIntake = Math.max(...chartData.map((day) => day.intake), goal, 1);
  const weeklyGoalHits = chartData.filter((day) => day.intake >= day.goal).length;
  const daysWithWater = chartData.filter((day) => day.intake > 0).length;
  const weeklyAverage = Math.round(chartData.reduce((sum, day) => sum + day.intake, 0) / chartData.length);
  const previousAverage = Math.round(previousWeekData.reduce((sum, day) => sum + day.intake, 0) / previousWeekData.length);
  const averageDelta = weeklyAverage - previousAverage;
  const consistency = Math.round((weeklyGoalHits / chartData.length) * 100);
  const insightTitle =
    daysWithWater >= 5
      ? "A steady rhythm is forming"
      : averageDelta >= 0 && weeklyAverage > 0
        ? "Small sips are adding up"
        : "A little, often, works best";
  const insightBody =
    daysWithWater >= 5
      ? "Most days already have water logged. Keep it gentle and spread small drinks through the day."
      : averageDelta >= 0 && weeklyAverage > 0
        ? `Your average is ${averageDelta} ml higher than last week. Keep the pace comfortable, not rushed.`
        : "One small drink at a time is enough to build the habit. No need to catch up all at once.";

  const openMonthView = () => {
    const currentMonth = getMonthStart(todayDate);
    setVisibleMonthDate(currentMonth);
    setSelectedMonthDate(today);
    setIsMonthViewOpen(true);
  };

  const changeVisibleMonth = (offset: number) => {
    const nextMonth = shiftMonth(visibleMonthDate, offset);
    setVisibleMonthDate(nextMonth);
    setSelectedMonthDate(getDefaultMonthSelection(nextMonth, todayDate));
  };

  return (
    <main className="mx-auto flex min-h-[100dvh] w-full max-w-[25.5rem] flex-1 flex-col items-center px-3.5 pb-4 pt-2 min-[380px]:px-4 min-[380px]:pb-4 min-[380px]:pt-3 sm:p-6 md:max-w-[30rem]">
      <header className="w-full text-center mt-2 mb-8">
        <h1 className="font-display text-4xl font-black text-white drop-shadow-md">Your Stats.</h1>
        <p className="font-ui text-xs font-semibold mt-1 tracking-widest text-water-200 uppercase mb-6">
          Consistency builds the habit
        </p>
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-water-900/40 backdrop-blur-md rounded-2xl text-water-100 font-semibold text-sm shadow-inner border border-water-300/14">
          <span className="font-body opacity-80">Daily Goal:</span>
          <span className="font-numeric text-water-300 font-bold tracking-wide">{goal} ml</span>
        </div>
      </header>

      <div className="mb-6 grid w-full grid-cols-2 gap-3 min-[380px]:gap-4">
        <Card className="flex min-h-[9.4rem] flex-col items-center justify-center p-4 text-center min-[380px]:p-5">
          <div className="flex items-center gap-2 mb-2">
            <Flame className="w-5 h-5 text-water-300 drop-shadow-sm" strokeWidth={2.5} />
            <span className="font-ui text-water-300 font-bold text-sm tracking-wide">Streak</span>
          </div>
          <div className="font-numeric text-4xl sm:text-5xl font-black text-white px-2 drop-shadow-md">{streak}</div>
          <span className="font-ui text-water-400/80 text-[10px] mt-2 uppercase tracking-widest font-bold">Days in a row</span>
        </Card>

        <Card className="flex min-h-[9.4rem] flex-col items-center justify-center p-4 text-center min-[380px]:p-5">
          <div className="flex items-center gap-2 mb-2">
            <Trophy className="w-5 h-5 text-water-200 drop-shadow-sm" strokeWidth={2.5} />
            <span className="font-ui text-water-300 font-bold text-sm tracking-wide">Today</span>
          </div>
          <div className="font-numeric text-4xl sm:text-5xl font-black text-white px-2 drop-shadow-md">
            {Math.round((intake / goal) * 100)}
            <span className="font-ui text-xl text-water-400 ml-0.5">%</span>
          </div>
          <span className="font-ui text-water-400/80 text-[10px] mt-2 uppercase tracking-widest font-bold">Today progress</span>
        </Card>
      </div>

      {!hasAnyTrackedWater && (
        <Card className="mb-6 w-full p-4 min-[380px]:p-5 sm:p-6">
          <div className="font-ui flex items-center gap-2 text-water-300 text-sm font-bold tracking-wide">
            <GlassWater className="h-4 w-4" strokeWidth={2.5} />
            First stats
          </div>
          <h2 className="font-ui mt-3 text-2xl font-black tracking-normal text-white">Your stats will fill in soon.</h2>
          <p className="font-body mt-2 text-sm font-semibold leading-relaxed text-water-300/82">
            Start with a small drink today and Fluid will build your weekly view as you log water.
          </p>
        </Card>
      )}

      <div className="mb-6 grid w-full grid-cols-1 gap-3 min-[390px]:grid-cols-2 min-[390px]:gap-4">
        <Card className="p-4">
          <div className="font-ui flex items-center gap-1.5 text-water-300 text-[0.78rem] sm:text-sm font-bold tracking-wide">
            <Waves className="w-3.5 h-3.5 shrink-0" strokeWidth={2.4} />
            Weekly Average
          </div>
          <p className="font-numeric mt-3 text-3xl font-black text-white">{weeklyAverage} ml</p>
          <p className="font-body mt-1 text-xs text-water-400/80">Average intake across this week.</p>
        </Card>

        <Card className="p-4">
          <div className="font-ui flex items-center gap-2 text-water-300 text-sm font-bold tracking-wide">
            <ChartColumn className="w-4 h-4" strokeWidth={2.4} />
            Consistency
          </div>
          <p className="font-numeric mt-3 text-3xl font-black text-white">{consistency}%</p>
          <p className="font-body mt-1 text-xs text-water-400/80">{daysWithWater} of 7 days include water.</p>
        </Card>
      </div>

      <Card className="mb-6 w-full p-4 min-[380px]:p-5 sm:p-6">
        <div className="min-w-0">
          <div className="font-ui flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.22em] text-water-300/80">
            <Target className="h-4 w-4" strokeWidth={2.5} />
            This week
          </div>
          <h2 className="font-ui mt-2 text-2xl font-black tracking-normal text-white">{insightTitle}</h2>
          <p className="font-body mt-2 text-sm font-semibold leading-relaxed text-water-100/86">{insightBody}</p>
        </div>
      </Card>

      <Card className="mb-6 w-full p-4 min-[380px]:p-5 sm:p-6">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <Calendar className="w-5 h-5 text-water-400" strokeWidth={2.5} />
            <h2 className="font-ui min-w-0 text-base font-bold leading-tight tracking-normal text-white drop-shadow-sm min-[360px]:text-lg">
              Tracking History
            </h2>
          </div>
          <button
            type="button"
            onClick={openMonthView}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[1.5px] border-water-300/14 bg-water-950/20 text-water-200 transition-all hover:border-water-200/24 hover:bg-white/10 hover:text-white active:scale-95"
            aria-label="Open month view"
            title="Month view"
          >
            <CalendarSearch className="h-4.5 w-4.5" strokeWidth={2.45} />
          </button>
        </div>

        <p className="font-body mb-5 text-sm text-water-300/80 min-[380px]:mb-6">
          Taller bars mean more water logged. Spread drinks through the day instead of rushing late.
        </p>

        <div ref={trackingCardRef} className="flex h-48 items-end justify-between gap-1.5 pt-3 min-[380px]:h-56 min-[380px]:gap-2 min-[380px]:pt-4">
          {chartData.map((day, idx) => {
            const heightPercent = Math.min(100, (day.intake / maxIntake) * 100);
            const isGoalMet = day.intake > 0 && day.intake >= day.goal;
            const isToday = day.date === today;

            return (
              <div key={day.date} className="flex flex-col items-center gap-3 flex-1 h-full group">
                <div
                  className={`flex min-h-[2rem] flex-col items-center justify-end px-1 py-1 transition-colors ${
                    isToday ? "text-water-50" : "text-water-300/72"
                  }`}
                >
                  <span className="font-numeric text-[0.78rem] font-black leading-none">{day.intake}</span>
                  <span className="font-ui mt-0.5 text-[0.56rem] font-semibold uppercase tracking-[0.22em] text-inherit/70">ml</span>
                </div>
                <div
                  className={`relative w-full h-full flex-1 flex items-end justify-center rounded-[1.2rem] overflow-hidden shadow-inner transition-all duration-300 ${
                    isToday
                      ? "bg-water-800/55 border border-water-300/28 shadow-[0_0_0_1px_rgba(125,211,252,0.12),0_0_22px_rgba(56,189,248,0.14)]"
                      : "bg-water-800/40 border border-water-300/14"
                  }`}
                >
                  <div
                    className={`w-full rounded-[1.2rem] transition-[height,filter] duration-[720ms] ease-[cubic-bezier(0.22,0.9,0.28,1)] group-hover:brightness-110 ${
                      isGoalMet
                        ? "bg-gradient-to-t from-water-600 via-water-400 to-water-200"
                        : "bg-gradient-to-t from-water-900/80 to-water-700/70"
                    }`}
                    style={{
                      height: `${isTrackingInView ? Math.max(heightPercent, day.intake > 0 ? 10 : 0) : 0}%`,
                      transitionDelay: isTrackingInView && day.intake > 0 ? `${idx * 55}ms` : "0ms",
                    }}
                  />
                </div>
                <span
                  className={`font-ui text-[0.55rem] font-bold uppercase tracking-wide min-[360px]:text-[10px] min-[360px]:tracking-wider ${
                    isToday ? "text-water-100 drop-shadow-sm" : "text-water-400/80"
                  }`}
                >
                  {DAY_NAMES[idx]}
                </span>
              </div>
            );
          })}
        </div>
      </Card>

      {isMonthViewOpen && typeof document !== "undefined"
        ? createPortal(
        <div
          className="fluid-modal-backdrop fixed inset-0 z-[112] flex touch-none items-end justify-center overflow-hidden px-3 pb-[calc(max(0.85rem,env(safe-area-inset-bottom))+5.25rem)] pt-[max(0.75rem,env(safe-area-inset-top))]"
          data-swipe-ignore="true"
          onClick={() => setIsMonthViewOpen(false)}
          onTouchMove={(event) => event.preventDefault()}
          onWheel={(event) => event.preventDefault()}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="month-view-title"
            className="fluid-glass-soft w-full max-w-[25.5rem] overflow-hidden rounded-[1.65rem] border border-[1.5px] border-water-300/14 bg-water-950/96 shadow-[0_24px_70px_rgba(0,0,0,0.46)] md:max-w-[30rem]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-2 border-b border-water-300/12 px-4 py-3 min-[380px]:px-5">
              <div className="flex min-w-0 flex-1 items-center gap-1.5 min-[380px]:gap-2">
                <button
                  type="button"
                  onClick={() => changeVisibleMonth(-1)}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[1.5px] border-water-300/14 bg-water-950/20 text-water-200 transition-colors hover:bg-white/10 hover:text-white"
                  aria-label="Previous month"
                >
                  <ChevronLeft className="h-4.5 w-4.5" strokeWidth={2.6} />
                </button>
                <div className="min-w-0 flex-1 text-center">
                  <p className="font-ui text-[11px] font-black uppercase tracking-[0.22em] text-water-300/80">Month view</p>
                  <h2 id="month-view-title" className="font-ui mt-1 truncate text-[1.45rem] font-black tracking-normal text-white min-[380px]:text-2xl">
                    {MONTH_FORMATTER.format(visibleMonthDate)}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => changeVisibleMonth(1)}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[1.5px] border-water-300/14 bg-water-950/20 text-water-200 transition-colors hover:bg-white/10 hover:text-white"
                  aria-label="Next month"
                >
                  <ChevronRight className="h-4.5 w-4.5" strokeWidth={2.6} />
                </button>
              </div>
              <div className="flex shrink-0 items-center">
                <button
                  type="button"
                  onClick={() => setIsMonthViewOpen(false)}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[1.5px] border-water-300/14 bg-water-950/20 text-water-200 transition-colors hover:bg-white/10 hover:text-white"
                  aria-label="Close month view"
                >
                  <X className="h-4.5 w-4.5" strokeWidth={2.6} />
                </button>
              </div>
            </div>

            <div className="px-4 pb-3 pt-2 min-[380px]:px-5 min-[380px]:pb-4">
              <div className="grid grid-cols-7 gap-1 min-[380px]:gap-1.5">
                {DAY_NAMES.map((day) => (
                  <div key={day} className="font-ui text-center text-[0.62rem] font-black uppercase tracking-wider text-water-400/72">
                    {day.slice(0, 1)}
                  </div>
                ))}
                {monthDays.map((day, index) => {
                  if (!day) {
                    return <div key={`blank-${index}`} className="h-9 rounded-xl border border-transparent min-[380px]:h-10" />;
                  }

                  const trackedDay = trackedByDate.get(day.date);
                  const dayIntake = trackedDay?.intake ?? 0;
                  const dayGoal = trackedDay?.goal ?? goal;
                  const isFuture = day.date > today;
                  const isToday = day.date === today;
                  const isSelected = day.date === selectedMonthDate;
                  const isGoalMet = dayIntake >= dayGoal;
                  const hasIntake = dayIntake > 0;

                  return (
                    <button
                      key={day.date}
                      type="button"
                      onClick={() => setSelectedMonthDate(day.date)}
                      className={`font-numeric flex h-9 items-center justify-center rounded-xl border text-sm font-black transition-colors active:scale-95 min-[380px]:h-10 ${
                        isSelected
                          ? "border-cyan-100/44 bg-cyan-200/16 text-white shadow-[0_0_0_1px_rgba(186,230,253,0.12)]"
                          : isToday
                            ? "border-cyan-100/28 bg-cyan-200/12 text-white"
                            : isFuture
                              ? "border-water-500/10 bg-water-950/12 text-water-500/45"
                              : isGoalMet
                                ? "border-emerald-100/20 bg-emerald-300/14 text-emerald-50"
                                : hasIntake
                                  ? "border-water-300/16 bg-water-700/28 text-water-100"
                                  : "border-water-500/12 bg-water-950/18 text-water-400/60"
                      }`}
                      title={`${day.date}: ${dayIntake} ml`}
                    >
                      {day.day}
                    </button>
                  );
                })}
              </div>

              <div className="mt-4 rounded-[1.15rem] border border-[1.5px] border-water-300/12 bg-white/[0.055] px-4 py-3 min-[380px]:py-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-ui text-[0.68rem] font-black uppercase tracking-[0.18em] text-water-300/78">
                      {hasSelectedMonthDate ? DAY_DETAIL_FORMATTER.format(parseDateLocal(selectedMonthDate)) : "Select a day"}
                    </p>
                    <p className="font-body mt-1 text-xs font-semibold text-water-300/70">
                      {!hasSelectedMonthDate
                        ? "Tap a date to see the water logged for that day."
                        : selectedMonthIsFuture
                        ? "No intake yet. This day is ahead."
                        : selectedMonthIntake > 0
                          ? `${selectedMonthProgress}% of that day's target.`
                          : "No water logged for this day."}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="font-numeric text-3xl font-black leading-none text-white">{selectedMonthIntake}</p>
                    <p className="font-ui mt-1 text-[0.62rem] font-black uppercase tracking-[0.18em] text-water-300/78">ml</p>
                  </div>
                </div>
                {selectedMonthBreakdownEntries.length > 0 && (
                  <div className="mt-3 grid gap-1.5">
                    {selectedMonthBreakdownEntries.map((item) => (
                      <div
                        key={item.note}
                        className="flex items-center justify-between gap-3 rounded-xl border border-water-300/10 bg-water-950/22 px-3 py-2"
                      >
                        <span className="font-ui flex min-w-0 items-center gap-2 text-xs font-bold text-water-200/86">
                          <span className="h-2 w-2 shrink-0 rounded-full bg-cyan-200/80 shadow-[0_0_10px_rgba(125,211,252,0.28)]" />
                          <span className="truncate">{item.label}</span>
                        </span>
                        <span className="font-numeric shrink-0 text-sm font-black text-white">
                          {item.amount}
                          <span className="font-ui ml-1 text-[0.62rem] font-black uppercase tracking-[0.16em] text-water-300/78">ml</span>
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </section>
        </div>,
            document.body
          )
        : null}

    </main>
  );
}
