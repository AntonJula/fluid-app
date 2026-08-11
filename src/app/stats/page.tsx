"use client";

import React from "react";
import { createPortal } from "react-dom";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  CalendarDays,
  CalendarSearch,
  ChartNoAxesCombined,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Coffee,
  Droplets,
  Feather,
  Flame,
  Footprints,
  Leaf,
  Sprout,
  Target,
  Waves,
  X,
} from "lucide-react";
import { useHydration } from "@/hooks/useHydration";
import { Card } from "@/components/ui/Card";
import { HydrationLoadingState } from "@/components/HydrationLoadingState";
import { formatDateLocal } from "@/lib/date";
import {
  buildRollingHydrationStats,
  buildWeeklyHydrationStats,
  getHydrationInsight,
  type HydrationInsightTone,
  type HydrationStatsDay,
} from "@/lib/hydrationStats";
import type {
  DrinkLogItem,
  HydrationContext,
  HydrationDrinkType,
  HydrationHistoryItem,
} from "@/lib/hydrationState";
import { getAppScrollElement } from "@/utils/appScroll";

gsap.registerPlugin(useGSAP, ScrollTrigger);

const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const DRINK_ORDER: HydrationDrinkType[] = ["water", "coffee", "tea"];
const CONTEXT_ORDER: HydrationContext[] = ["workout", "hot-day"];
const DRINK_LABELS: Record<HydrationDrinkType, string> = {
  water: "Water",
  coffee: "Coffee",
  tea: "Tea",
};
const CONTEXT_LABELS: Record<HydrationContext, string> = {
  workout: "During workout",
  "hot-day": "During Heat Mode",
};
const MONTH_FORMATTER = new Intl.DateTimeFormat("en", {
  month: "long",
  year: "numeric",
});
const DAY_DETAIL_FORMATTER = new Intl.DateTimeFormat("en", {
  weekday: "long",
  month: "short",
  day: "numeric",
});
const SHORT_DATE_FORMATTER = new Intl.DateTimeFormat("en", {
  month: "short",
  day: "numeric",
});
const EMPTY_MONTH_SELECTION = "";
const CHART_WIDTH = 320;
const CHART_HEIGHT = 176;
const CHART_PADDING = { left: 38, right: 12, top: 14, bottom: 34 };

type DayBreakdowns = {
  drinks?: Partial<Record<HydrationDrinkType, number>>;
  contexts?: Partial<Record<HydrationContext, number>>;
};

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
  return isSameMonth(monthDate, todayDate)
    ? formatDateLocal(todayDate)
    : EMPTY_MONTH_SELECTION;
}

function getMonthDays(anchor: Date) {
  const year = anchor.getFullYear();
  const month = anchor.getMonth();
  const firstDay = new Date(year, month, 1);
  const leadingBlankDays = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  return [
    ...Array.from({ length: leadingBlankDays }).map(() => null),
    ...Array.from({ length: daysInMonth }).map((_, index) => {
      const date = new Date(year, month, index + 1);
      return { date: formatDateLocal(date), day: index + 1 };
    }),
  ];
}

function getRoundedChartMax(value: number) {
  if (value <= 1000) return 1000;
  return Math.ceil(value / 500) * 500;
}

function buildTodayBreakdowns(
  log: DrinkLogItem[],
  expectedIntake: number
): DayBreakdowns {
  const drinks = log.reduce<Partial<Record<HydrationDrinkType, number>>>(
    (totals, item) => {
      totals[item.drinkType] = Math.max(
        0,
        Math.round((totals[item.drinkType] ?? 0) + item.amount)
      );
      return totals;
    },
    {}
  );
  const contexts = log.reduce<Partial<Record<HydrationContext, number>>>(
    (totals, item) => {
      if (!item.context) return totals;

      totals[item.context] = Math.max(
        0,
        Math.round((totals[item.context] ?? 0) + item.amount)
      );
      return totals;
    },
    {}
  );
  const drinkTotal = Object.values(drinks).reduce(
    (sum, amount) => sum + (amount ?? 0),
    0
  );
  const normalizedDrinks =
    expectedIntake > 0 && drinkTotal !== expectedIntake
      ? { water: expectedIntake }
      : drinks;

  return {
    ...(Object.values(normalizedDrinks).some((amount) => (amount ?? 0) > 0)
      ? { drinks: normalizedDrinks }
      : {}),
    ...(Object.values(contexts).some((amount) => (amount ?? 0) > 0)
      ? { contexts }
      : {}),
  };
}

function getDrinkBreakdownEntries(
  breakdown: Partial<Record<HydrationDrinkType, number>> | undefined,
  fallbackIntake: number
) {
  const source =
    breakdown ?? (fallbackIntake > 0 ? { water: fallbackIntake } : undefined);
  if (!source) return [];

  return DRINK_ORDER.map((drinkType) => ({
    key: drinkType,
    drinkType,
    label: DRINK_LABELS[drinkType],
    amount: source[drinkType] ?? 0,
  })).filter((item) => item.amount > 0);
}

function getContextBreakdownEntries(
  breakdown: Partial<Record<HydrationContext, number>> | undefined
) {
  if (!breakdown) return [];

  return CONTEXT_ORDER.map((context) => ({
    key: context,
    context,
    label: CONTEXT_LABELS[context],
    amount: breakdown[context] ?? 0,
  })).filter((item) => item.amount > 0);
}

function getDrinkIcon(drinkType: HydrationDrinkType) {
  if (drinkType === "coffee") return Coffee;
  if (drinkType === "tea") return Leaf;
  return Droplets;
}

function useLockedPageScroll(isLocked: boolean) {
  React.useEffect(() => {
    if (!isLocked || typeof window === "undefined") return;

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
    };
  }, [isLocked]);
}

function formatMetricAmount(amount: number) {
  if (amount >= 1000) {
    const liters = amount / 1000;
    return `${Number.isInteger(liters) ? liters.toFixed(0) : liters.toFixed(1)} L`;
  }

  return `${amount} ml`;
}

function InsightToneIcon({ tone }: { tone: HydrationInsightTone }) {
  const iconProps = {
    className:
      "relative h-[1.05rem] w-[1.05rem] transition-transform duration-500 ease-out group-hover/insight-icon:scale-110",
    strokeWidth: 2.35,
  };

  if (tone === "rising") return <ChartNoAxesCombined {...iconProps} />;
  if (tone === "falling") return <Feather {...iconProps} />;
  if (tone === "steady") return <Waves {...iconProps} />;
  if (tone === "forming") return <Sprout {...iconProps} />;
  return <Footprints {...iconProps} />;
}

const INSIGHT_ACCENT_CLASSES: Record<HydrationInsightTone, string> = {
  empty:
    "border-violet-100/24 bg-violet-200/10 text-violet-50 shadow-[0_8px_22px_rgba(167,139,250,0.10),inset_0_1px_0_rgba(255,255,255,0.14)]",
  forming:
    "border-emerald-100/22 bg-emerald-300/10 text-emerald-50 shadow-[0_8px_22px_rgba(52,211,153,0.10),inset_0_1px_0_rgba(255,255,255,0.14)]",
  rising:
    "border-cyan-100/24 bg-cyan-200/11 text-cyan-50 shadow-[0_8px_22px_rgba(34,211,238,0.11),inset_0_1px_0_rgba(255,255,255,0.14)]",
  falling:
    "border-amber-100/22 bg-amber-200/10 text-amber-50 shadow-[0_8px_22px_rgba(251,191,36,0.09),inset_0_1px_0_rgba(255,255,255,0.14)]",
  steady:
    "border-sky-100/22 bg-sky-200/10 text-sky-50 shadow-[0_8px_22px_rgba(56,189,248,0.10),inset_0_1px_0_rgba(255,255,255,0.14)]",
};

function HydrationBarChart({
  data,
  mode,
  goal,
}: {
  data: HydrationStatsDay[];
  mode: "week" | "month";
  goal: number;
}) {
  const chartMax = getRoundedChartMax(
    Math.max(goal, ...data.map((day) => day.intake), 1)
  );
  const chartLeft = CHART_PADDING.left;
  const chartRight = CHART_WIDTH - CHART_PADDING.right;
  const chartTop = CHART_PADDING.top;
  const chartBottom = CHART_HEIGHT - CHART_PADDING.bottom;
  const innerWidth = chartRight - chartLeft;
  const innerHeight = chartBottom - chartTop;
  const step = innerWidth / Math.max(data.length, 1);
  const barWidth = Math.max(3, Math.min(24, step * 0.58));
  const goalY =
    chartTop +
    (1 - Math.min(1, Math.max(0, goal / chartMax))) * innerHeight;
  const axisLabels = [
    { label: `${chartMax}`, y: chartTop },
    { label: `${Math.round(chartMax / 2)}`, y: chartTop + innerHeight / 2 },
    { label: "0", y: chartBottom },
  ];
  const labelIndexes = new Set(
    mode === "week"
      ? data.map((_, index) => index)
      : data
          .map((day, index) =>
            index === 0 ||
            index === data.length - 1 ||
            day.isToday ||
            (index + 1) % 7 === 0
              ? index
              : -1
          )
          .filter((index) => index >= 0)
  );

  return (
    <div className="rounded-[1.15rem] border border-[1.5px] border-water-300/12 bg-water-950/20 px-2 py-3 shadow-inner">
      <div className="mb-1 flex items-center justify-end gap-2 px-2">
        <span
          className="w-7 border-t border-dashed border-water-100/52"
          aria-hidden="true"
        />
        <span className="font-ui text-[0.58rem] font-black uppercase tracking-[0.12em] text-water-200/78">
          Daily goal
        </span>
        <span className="font-numeric text-[0.68rem] font-black text-white">
          {formatMetricAmount(goal)}
        </span>
      </div>
      <svg
        className="h-auto w-full overflow-visible"
        viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
        role="img"
        aria-label={`${mode === "week" ? "Seven day" : "Thirty day"} hydration totals. Daily goal ${goal} milliliters.`}
      >
        <defs>
          <linearGradient id="stats-bars" x1="0" x2="0" y1="1" y2="0">
            <stop offset="0" stopColor="#0284c7" />
            <stop offset="0.58" stopColor="#22d3ee" />
            <stop offset="1" stopColor="#a5f3fc" />
          </linearGradient>
          <linearGradient id="stats-bars-muted" x1="0" x2="0" y1="1" y2="0">
            <stop offset="0" stopColor="#164e63" />
            <stop offset="1" stopColor="#0e7490" />
          </linearGradient>
        </defs>

        {axisLabels.map((item) => (
          <g key={item.label} aria-hidden="true">
            <line
              x1={chartLeft}
              x2={chartRight}
              y1={item.y}
              y2={item.y}
              stroke="rgba(125, 211, 252, 0.12)"
              strokeDasharray="4 7"
            />
            <text
              x={chartLeft - 8}
              y={item.y + 3}
              textAnchor="end"
              className="fill-water-300/62 font-numeric text-[9px] font-black"
            >
              {item.label}
            </text>
          </g>
        ))}

        <line
          x1={chartLeft}
          x2={chartRight}
          y1={goalY}
          y2={goalY}
          stroke="rgba(224, 242, 254, 0.48)"
          strokeDasharray="6 6"
          aria-hidden="true"
        />

        {data.map((day, index) => {
          const x = chartLeft + step * index + (step - barWidth) / 2;
          const progress = Math.min(1, Math.max(0, day.intake / chartMax));
          const height = day.intake > 0 ? Math.max(5, progress * innerHeight) : 2;
          const y = chartBottom - height;
          const goalReached = day.intake >= day.goal && day.intake > 0;

          return (
            <g key={day.date} aria-hidden="true">
              <rect
                x={x}
                y={chartTop}
                width={barWidth}
                height={innerHeight}
                rx={barWidth / 2}
                fill={
                  day.isFuture
                    ? "rgba(8, 47, 73, 0.16)"
                    : "rgba(8, 47, 73, 0.34)"
                }
              />
              {!day.isFuture && (
                <rect
                  x={x}
                  y={y}
                  width={barWidth}
                  height={height}
                  rx={barWidth / 2}
                  fill={goalReached ? "url(#stats-bars)" : "url(#stats-bars-muted)"}
                  stroke={day.isToday ? "rgba(255,255,255,0.78)" : "transparent"}
                  strokeWidth={day.isToday ? 1.5 : 0}
                  filter={
                    goalReached
                      ? "drop-shadow(0 5px 8px rgba(34, 211, 238, 0.2))"
                      : undefined
                  }
                />
              )}
              {labelIndexes.has(index) && (
                <text
                  x={x + barWidth / 2}
                  y={CHART_HEIGHT - 9}
                  textAnchor="middle"
                  className={`font-ui text-[8px] font-black uppercase tracking-wide ${
                    day.isToday ? "fill-white" : "fill-water-300/72"
                  }`}
                >
                  {mode === "week"
                    ? DAY_NAMES[index]
                    : parseDateLocal(day.date).getDate()}
                </text>
              )}
            </g>
          );
        })}
      </svg>

      <ul className="sr-only">
        {data.map((day) => (
          <li key={`${day.date}-accessible`}>
            {SHORT_DATE_FORMATTER.format(parseDateLocal(day.date))}:{" "}
            {day.isFuture
              ? "future day"
              : `${day.intake} milliliters logged, daily goal ${day.goal} milliliters`}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function StatsPage() {
  const { streak, history, intake, goal, drinkLog, mounted } = useHydration();
  const scope = React.useRef<HTMLElement>(null);
  const [isMonthViewOpen, setIsMonthViewOpen] = React.useState(false);
  const [rangeMode, setRangeMode] = React.useState<"week" | "month">("week");
  const [visibleMonthDate, setVisibleMonthDate] = React.useState(() =>
    getMonthStart(new Date())
  );
  const [selectedMonthDate, setSelectedMonthDate] = React.useState(() =>
    formatDateLocal(new Date())
  );
  useLockedPageScroll(isMonthViewOpen);

  useGSAP(
    () => {
      if (
        !scope.current ||
        window.matchMedia("(prefers-reduced-motion: reduce)").matches
      ) {
        return;
      }

      gsap.fromTo(
        "[data-stats-reveal]",
        { y: 22, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.62,
          stagger: 0.07,
          ease: "power3.out",
          clearProps: "transform,opacity",
        }
      );

      gsap.utils
        .toArray<HTMLElement>("[data-stats-stack]")
        .forEach((card) => {
          gsap.fromTo(
            card,
            { y: 18, scale: 0.985 },
            {
              y: 0,
              scale: 1,
              ease: "none",
              scrollTrigger: {
                trigger: card,
                start: "top 92%",
                end: "top 68%",
                scrub: true,
              },
            }
          );
        });
    },
    { scope, dependencies: [mounted], revertOnUpdate: true }
  );

  if (!mounted) {
    return <HydrationLoadingState />;
  }

  const todayDate = new Date();
  const today = formatDateLocal(todayDate);
  const todayBreakdowns = buildTodayBreakdowns(drinkLog, intake);
  const allTrackedDays: HydrationHistoryItem[] = [
    ...history,
    {
      date: today,
      intake,
      goal,
      ...(todayBreakdowns.drinks
        ? { breakdown: todayBreakdowns.drinks }
        : intake > 0
          ? { breakdown: { water: intake } }
          : {}),
      ...(todayBreakdowns.contexts
        ? { contextBreakdown: todayBreakdowns.contexts }
        : {}),
    },
  ].sort((a, b) => a.date.localeCompare(b.date));
  const trackedByDate = new Map(allTrackedDays.map((day) => [day.date, day]));
  const weeklyStats = buildWeeklyHydrationStats({
    anchor: todayDate,
    history,
    todayIntake: intake,
    currentGoal: goal,
  });
  const rollingStats = buildRollingHydrationStats({
    anchor: todayDate,
    history,
    todayIntake: intake,
    currentGoal: goal,
  });
  const selectedStats = rangeMode === "week" ? weeklyStats : rollingStats;
  const selectedChartData = selectedStats.chartDays;
  const selectedAverage = selectedStats.dailyAverage;
  const selectedLoggedDays = selectedStats.daysWithHydration;
  const selectedElapsedDays = selectedStats.elapsedDays;
  const insight = getHydrationInsight(rangeMode, selectedStats);
  const weekRangeLabel = `${SHORT_DATE_FORMATTER.format(
    parseDateLocal(weeklyStats.chartDays[0].date)
  )} – ${SHORT_DATE_FORMATTER.format(
    parseDateLocal(weeklyStats.chartDays[weeklyStats.chartDays.length - 1].date)
  )}`;
  const loggedHistoryDays = allTrackedDays.filter((day) => day.intake > 0).length;
  const monthDays = getMonthDays(visibleMonthDate);
  const hasSelectedMonthDate = selectedMonthDate !== EMPTY_MONTH_SELECTION;
  const selectedMonthDay = hasSelectedMonthDate
    ? trackedByDate.get(selectedMonthDate)
    : undefined;
  const selectedMonthIntake = selectedMonthDay?.intake ?? 0;
  const selectedMonthGoal = selectedMonthDay?.goal ?? goal;
  const selectedMonthProgress = Math.min(
    100,
    Math.round(
      (selectedMonthIntake / Math.max(selectedMonthGoal, 1)) * 100
    )
  );
  const selectedMonthIsFuture =
    hasSelectedMonthDate && selectedMonthDate > today;
  const selectedDrinkEntries = getDrinkBreakdownEntries(
    selectedMonthDay?.breakdown,
    selectedMonthIntake
  );
  const selectedContextEntries = getContextBreakdownEntries(
    selectedMonthDay?.contextBreakdown
  );
  const currentMonthStart = getMonthStart(todayDate);
  const canOpenNextMonth =
    visibleMonthDate.getTime() < currentMonthStart.getTime();

  const openMonthView = () => {
    setVisibleMonthDate(currentMonthStart);
    setSelectedMonthDate(today);
    setIsMonthViewOpen(true);
  };

  const changeVisibleMonth = (offset: number) => {
    const nextMonth = shiftMonth(visibleMonthDate, offset);
    if (nextMonth.getTime() > currentMonthStart.getTime()) return;

    setVisibleMonthDate(nextMonth);
    setSelectedMonthDate(getDefaultMonthSelection(nextMonth, todayDate));
  };

  return (
    <main
      ref={scope}
      className="fluid-page-shell mx-auto flex min-h-[100dvh] w-full max-w-[25.5rem] flex-1 flex-col items-center overflow-x-hidden px-3.5 pb-28 pt-6 min-[380px]:px-4 min-[380px]:pt-5 sm:px-6 sm:pt-6 md:max-w-[30rem]"
    >
      <header
        className="fluid-page-header mb-5 mt-2 w-full text-center"
        data-stats-reveal
      >
        <h1 className="font-display flex w-full max-w-[30rem] items-center justify-center gap-2.5 text-4xl font-black leading-none tracking-[-0.035em] text-white drop-shadow-md">
          <span>Your</span>
          <span className="fluid-inline-water-window" aria-hidden="true" />
          <span>Stats.</span>
        </h1>
        <p className="font-ui mt-2 text-[0.68rem] font-bold uppercase tracking-[0.18em] text-water-200/80">
          Consistency builds the habit
        </p>
      </header>

      <Card
        data-stats-reveal
        className="group relative mb-5 w-full overflow-hidden p-4 min-[380px]:p-5"
      >
        <div
          className="pointer-events-none absolute -right-14 -top-20 h-44 w-44 rounded-full bg-cyan-200/10 blur-3xl transition-transform duration-700 ease-out group-hover:scale-110"
          style={{ position: "absolute" }}
        />
        <div className="relative z-10 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="font-ui text-[0.66rem] font-black uppercase tracking-[0.2em] text-water-300/82">
              This week
            </p>
            <h2 className="font-ui mt-2 text-[1.65rem] font-black leading-tight text-white">
              {weeklyStats.daysWithHydration === 1
                ? "One hydration day"
                : `${weeklyStats.daysWithHydration} hydration days`}
            </h2>
            <p className="font-body mt-1.5 text-xs font-semibold text-water-300/68">
              Any logged drink keeps the streak moving.
            </p>
          </div>
          <div className="shrink-0 rounded-[1rem] border border-cyan-100/16 bg-cyan-100/[0.065] px-3 py-2.5 text-right">
            <p className="font-numeric text-2xl font-black leading-none text-cyan-50">
              {weeklyStats.daysWithHydration}
              <span className="font-ui ml-1 text-xs text-water-300/70">
                /{weeklyStats.elapsedDays}
              </span>
            </p>
            <p className="font-ui mt-1.5 text-[0.58rem] font-black uppercase tracking-[0.12em] text-water-300/68">
              days logged
            </p>
          </div>
        </div>

        <div className="relative z-10 mt-4 flex items-center gap-3">
          <span className="h-px flex-1 bg-gradient-to-r from-cyan-100/28 to-transparent" />
          <span className="font-ui text-[0.6rem] font-black uppercase tracking-[0.16em] text-water-300/62">
            {weekRangeLabel}
          </span>
        </div>

        <div className="relative z-10 mt-3 grid grid-flow-dense grid-cols-3 gap-2">
          <div className="rounded-[0.9rem] border border-water-300/12 bg-water-950/20 p-2.5">
            <div className="flex items-center gap-2 text-water-300">
              <Droplets className="h-3.5 w-3.5" strokeWidth={2.5} />
              <span className="font-ui text-[0.58rem] font-black uppercase tracking-[0.12em]">
                Today
              </span>
            </div>
            <p className="font-numeric mt-2 text-lg font-black leading-none text-white">
              {formatMetricAmount(intake)}
            </p>
          </div>

          <div className="rounded-[0.9rem] border border-water-300/12 bg-water-950/20 p-2.5">
            <div className="flex items-center gap-2 text-water-300">
              <Flame className="h-4 w-4" strokeWidth={2.5} />
              <span className="font-ui text-[0.58rem] font-black uppercase tracking-[0.12em]">
                Streak
              </span>
            </div>
            <p className="font-numeric mt-2 text-lg font-black leading-none text-white">
              {streak}{" "}
              <span className="font-ui text-[0.58rem] font-black text-water-300/72">
                {streak === 1 ? "day" : "d"}
              </span>
            </p>
          </div>

          <div className="rounded-[0.9rem] border border-water-300/12 bg-water-950/20 p-2.5">
            <div className="flex items-center gap-2 text-water-300">
              <Target className="h-3.5 w-3.5" strokeWidth={2.5} />
              <span className="font-ui text-[0.58rem] font-black uppercase tracking-[0.12em]">
                Daily goal
              </span>
            </div>
            <p className="font-numeric mt-2 text-lg font-black leading-none text-white">
              {formatMetricAmount(goal)}
            </p>
          </div>
        </div>
      </Card>

      <Card
        data-stats-stack
        className="group mb-5 w-full overflow-hidden p-4 min-[380px]:p-5"
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="font-ui text-[0.66rem] font-black uppercase tracking-[0.2em] text-water-300/80">
              Hydration trend
            </p>
            <h2 className="font-ui mt-1.5 text-xl font-black text-white">
              Daily totals at a glance
            </h2>
          </div>
          <div className="grid shrink-0 grid-cols-2 rounded-full border border-water-300/12 bg-water-950/22 p-1">
            {(
              [
                { value: "week", label: "7 days" },
                { value: "month", label: "30 days" },
              ] as const
            ).map((option) => {
              const isActive = rangeMode === option.value;

              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setRangeMode(option.value)}
                  className={`font-ui min-h-9 rounded-full px-2.5 py-1.5 text-[0.65rem] font-black uppercase tracking-[0.1em] transition-all active:scale-95 ${
                    isActive
                      ? "bg-cyan-100/18 text-white shadow-[0_0_18px_rgba(125,211,252,0.12)]"
                      : "text-water-300/74 hover:bg-white/5 hover:text-white"
                  }`}
                  aria-pressed={isActive}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>

        <HydrationBarChart
          data={selectedChartData}
          mode={rangeMode}
          goal={goal}
        />

        <div className="mt-3 grid grid-flow-dense grid-cols-2 gap-2.5">
          <div className="rounded-[0.95rem] border border-water-300/12 bg-water-950/18 px-3 py-2.5">
            <p className="font-ui text-[0.62rem] font-black uppercase tracking-[0.16em] text-water-300/72">
              {rangeMode === "week" ? "Average so far" : "30-day average"}
            </p>
            <p className="font-numeric mt-1 text-xl font-black text-white">
              {selectedAverage}
              <span className="font-ui ml-1 text-[0.68rem] font-black text-water-300/78">
                ml/day
              </span>
            </p>
          </div>
          <div className="rounded-[0.95rem] border border-water-300/12 bg-water-950/18 px-3 py-2.5">
            <p className="font-ui text-[0.62rem] font-black uppercase tracking-[0.16em] text-water-300/72">
              Days logged
            </p>
            <p className="font-numeric mt-1 text-xl font-black text-white">
              {selectedLoggedDays}
              <span className="font-ui ml-1 text-[0.68rem] font-black text-water-300/78">
                /{selectedElapsedDays}
              </span>
            </p>
            <p className="sr-only">
              {selectedLoggedDays} of {selectedElapsedDays} days with hydration
              logged.
            </p>
          </div>
        </div>

        <div
          className="mt-3 flex items-start gap-3 rounded-[1rem] border border-water-300/10 bg-white/[0.025] p-3"
          aria-live="polite"
        >
          <div
            className={`group/insight-icon relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-[0.9rem] border backdrop-blur-md ${INSIGHT_ACCENT_CLASSES[insight.tone]}`}
            aria-hidden="true"
          >
            <span className="pointer-events-none absolute inset-x-2 top-0 h-px bg-gradient-to-r from-transparent via-white/70 to-transparent" />
            <InsightToneIcon tone={insight.tone} />
          </div>
          <div className="min-w-0">
            <p className="font-ui text-xs font-black text-white">
              {insight.title}
            </p>
            <p className="font-body mt-1 text-[0.7rem] font-semibold leading-relaxed text-water-300/66">
              {insight.body}
            </p>
          </div>
        </div>
      </Card>

      <Card
        data-stats-stack
        className="group mb-6 w-full overflow-hidden p-4 min-[380px]:p-5"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[1rem] border border-water-300/16 bg-water-950/22 text-water-100 transition-transform duration-700 ease-out group-hover:scale-105">
            <CalendarDays className="h-5 w-5" strokeWidth={2.5} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-ui text-sm font-black text-white">
              Hydration history
            </p>
            <p className="font-body mt-1 text-xs font-semibold leading-snug text-water-300/68">
              {loggedHistoryDays}{" "}
              {loggedHistoryDays === 1 ? "day" : "days"} with hydration logged.
              Explore drink mix and contexts.
            </p>
          </div>
          <button
            type="button"
            onClick={openMonthView}
            className="font-ui flex min-h-11 shrink-0 items-center gap-2 rounded-full border border-cyan-100/18 bg-cyan-100/10 px-3 py-2 text-[0.68rem] font-black uppercase tracking-[0.1em] text-cyan-50 transition-all hover:border-cyan-100/28 hover:bg-cyan-100/16 active:scale-95"
          >
            <CalendarSearch className="h-4 w-4" strokeWidth={2.5} />
            Calendar
          </button>
        </div>
      </Card>

      {isMonthViewOpen && typeof document !== "undefined"
        ? createPortal(
            <div
              className="fluid-modal-backdrop fixed inset-0 z-[160] flex touch-none items-start justify-center overflow-hidden px-3 pb-[calc(max(0.85rem,env(safe-area-inset-bottom))+5.25rem)]"
              style={{
                paddingTop:
                  "clamp(max(0.75rem, env(safe-area-inset-top)), calc(100dvh - 39rem - max(0.85rem, env(safe-area-inset-bottom)) - 5.25rem), 11rem)",
              }}
              data-swipe-ignore="true"
              onClick={() => setIsMonthViewOpen(false)}
              onTouchMove={(event) => event.preventDefault()}
              onWheel={(event) => event.preventDefault()}
            >
              <section
                role="dialog"
                aria-modal="true"
                aria-labelledby="month-view-title"
                className="fluid-glass-soft fluid-sheet fluid-bottom-sheet w-full max-w-[25.5rem] overflow-hidden rounded-[1.65rem] border border-[1.5px] border-water-300/14 bg-water-950/96 shadow-[0_24px_70px_rgba(0,0,0,0.46)] md:max-w-[30rem]"
                onClick={(event) => event.stopPropagation()}
              >
                <div className="flex items-center justify-between gap-2 border-b border-water-300/12 px-4 py-3 min-[380px]:px-5">
                  <div className="flex min-w-0 flex-1 items-center gap-1.5 min-[380px]:gap-2">
                    <button
                      type="button"
                      onClick={() => changeVisibleMonth(-1)}
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-water-300/14 bg-water-950/20 text-water-100 transition-colors hover:bg-white/10 hover:text-white"
                      aria-label="Previous month"
                    >
                      <ChevronLeft className="h-4.5 w-4.5" strokeWidth={2.6} />
                    </button>
                    <div className="min-w-0 flex-1 text-center">
                      <p className="font-ui text-[0.64rem] font-black uppercase tracking-[0.2em] text-water-300/80">
                        Hydration history
                      </p>
                      <h2
                        id="month-view-title"
                        className="font-ui mt-1 truncate text-[1.45rem] font-black text-white min-[380px]:text-2xl"
                      >
                        {MONTH_FORMATTER.format(visibleMonthDate)}
                      </h2>
                    </div>
                    <button
                      type="button"
                      onClick={() => changeVisibleMonth(1)}
                      disabled={!canOpenNextMonth}
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-water-300/14 bg-water-950/20 text-water-100 transition-colors hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-28"
                      aria-label="Next month"
                    >
                      <ChevronRight className="h-4.5 w-4.5" strokeWidth={2.6} />
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsMonthViewOpen(false)}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-water-300/14 bg-water-950/20 text-water-100 transition-colors hover:bg-white/10 hover:text-white"
                    aria-label="Close month view"
                  >
                    <X className="h-4.5 w-4.5" strokeWidth={2.6} />
                  </button>
                </div>

                <div className="px-4 pb-3 pt-2 min-[380px]:px-5 min-[380px]:pb-4">
                  <div className="grid grid-flow-dense grid-cols-7 gap-1 min-[380px]:gap-1.5">
                    {DAY_NAMES.map((day) => (
                      <div
                        key={day}
                        className="font-ui text-center text-[0.62rem] font-black uppercase tracking-wider text-water-300/76"
                      >
                        {day.slice(0, 1)}
                      </div>
                    ))}
                    {monthDays.map((day, index) => {
                      if (!day) {
                        return (
                          <div
                            key={`blank-${index}`}
                            className="h-9 rounded-xl border border-transparent min-[380px]:h-10"
                          />
                        );
                      }

                      const trackedDay = trackedByDate.get(day.date);
                      const dayIntake = trackedDay?.intake ?? 0;
                      const dayGoal = trackedDay?.goal ?? goal;
                      const isFuture = day.date > today;
                      const isToday = day.date === today;
                      const isSelected = day.date === selectedMonthDate;
                      const isGoalMet = dayIntake >= dayGoal && dayIntake > 0;
                      const hasHydration = dayIntake > 0;

                      return (
                        <button
                          key={day.date}
                          type="button"
                          onClick={() => setSelectedMonthDate(day.date)}
                          disabled={isFuture}
                          className={`font-numeric flex h-9 items-center justify-center rounded-xl border text-sm font-black transition-all active:scale-95 min-[380px]:h-10 ${
                            isSelected
                              ? "border-cyan-100/44 bg-cyan-200/16 text-white shadow-[0_0_0_1px_rgba(186,230,253,0.12)]"
                              : isToday
                                ? "border-cyan-100/28 bg-cyan-200/12 text-white"
                                : isFuture
                                  ? "cursor-not-allowed border-water-500/8 bg-water-950/8 text-water-500/24"
                                  : isGoalMet
                                    ? "border-emerald-100/22 bg-emerald-300/14 text-emerald-50"
                                    : hasHydration
                                      ? "border-water-200/22 bg-water-700/34 text-water-50"
                                      : "border-water-500/12 bg-water-950/18 text-water-300/58"
                          }`}
                          aria-label={`${DAY_DETAIL_FORMATTER.format(parseDateLocal(day.date))}: ${
                            isFuture
                              ? "future date"
                              : `${dayIntake} milliliters of hydration logged`
                          }`}
                        >
                          {day.day}
                        </button>
                      );
                    })}
                  </div>

                  <div className="mt-4 rounded-[1.15rem] border border-[1.5px] border-water-300/12 bg-white/[0.055] px-4 py-3 min-[380px]:py-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-ui text-[0.68rem] font-black uppercase tracking-[0.18em] text-water-200/84">
                          {hasSelectedMonthDate
                            ? DAY_DETAIL_FORMATTER.format(
                                parseDateLocal(selectedMonthDate)
                              )
                            : "Select a day"}
                        </p>
                        <p className="font-body mt-1 text-xs font-semibold text-water-300/72">
                          {!hasSelectedMonthDate
                            ? "Choose a date to see its hydration details."
                            : selectedMonthIsFuture
                              ? "This day is ahead."
                              : selectedMonthIntake > 0
                                ? `${selectedMonthProgress}% of that day's plan.`
                                : "No hydration logged for this day."}
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="font-numeric text-3xl font-black leading-none text-white">
                          {selectedMonthIntake}
                        </p>
                        <p className="font-ui mt-1 text-[0.62rem] font-black uppercase tracking-[0.18em] text-water-300/78">
                          ml
                        </p>
                      </div>
                    </div>

                    {selectedDrinkEntries.length > 0 && (
                      <div className="mt-3">
                        <p className="font-ui mb-1.5 text-[0.6rem] font-black uppercase tracking-[0.16em] text-water-300/62">
                          Drink mix
                        </p>
                        <div className="grid gap-1.5">
                          {selectedDrinkEntries.map((item) => {
                            const Icon = getDrinkIcon(item.drinkType);

                            return (
                              <div
                                key={item.key}
                                className="flex items-center justify-between gap-3 rounded-xl border border-water-300/10 bg-water-950/22 px-3 py-2"
                              >
                                <span className="font-ui flex min-w-0 items-center gap-2 text-xs font-bold text-water-100/88">
                                  <Icon
                                    className="h-3.5 w-3.5 shrink-0 text-cyan-100"
                                    strokeWidth={2.5}
                                  />
                                  <span className="truncate">{item.label}</span>
                                </span>
                                <span className="font-numeric shrink-0 text-sm font-black text-white">
                                  {item.amount}
                                  <span className="font-ui ml-1 text-[0.62rem] font-black uppercase tracking-[0.14em] text-water-300/78">
                                    ml
                                  </span>
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {selectedContextEntries.length > 0 && (
                      <div className="mt-3">
                        <p className="font-ui mb-1.5 text-[0.6rem] font-black uppercase tracking-[0.16em] text-water-300/62">
                          Context
                        </p>
                        <div className="grid gap-1.5">
                          {selectedContextEntries.map((item) => (
                            <div
                              key={item.key}
                              className="flex items-center justify-between gap-3 rounded-xl border border-emerald-100/12 bg-emerald-300/[0.055] px-3 py-2"
                            >
                              <span className="font-ui flex min-w-0 items-center gap-2 text-xs font-bold text-emerald-50/86">
                                <Clock3
                                  className="h-3.5 w-3.5 shrink-0 text-emerald-100"
                                  strokeWidth={2.5}
                                />
                                <span className="truncate">{item.label}</span>
                              </span>
                              <span className="font-numeric shrink-0 text-sm font-black text-white">
                                {item.amount}
                                <span className="font-ui ml-1 text-[0.62rem] font-black uppercase tracking-[0.14em] text-emerald-100/72">
                                  ml
                                </span>
                              </span>
                            </div>
                          ))}
                        </div>
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
