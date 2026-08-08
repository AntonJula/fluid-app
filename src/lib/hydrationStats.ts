import { formatDateLocal } from "./date.ts";
import type { HydrationHistoryItem } from "./hydrationState.ts";

export interface HydrationStatsDay {
  date: string;
  intake: number;
  goal: number;
  isToday: boolean;
  isFuture: boolean;
}

export interface WeeklyHydrationStats {
  chartDays: HydrationStatsDay[];
  elapsedDays: number;
  daysWithHydration: number;
  dailyAverage: number;
  previousDailyAverage: number;
  averageDelta: number;
  canComparePeriods: boolean;
}

export type HydrationRangeStats = WeeklyHydrationStats;

export type HydrationInsightRange = "week" | "month";
export type HydrationInsightTone =
  | "empty"
  | "forming"
  | "rising"
  | "falling"
  | "steady";

export interface HydrationInsight {
  tone: HydrationInsightTone;
  title: string;
  body: string;
}

export function getWeekDates(anchor: Date, offsetWeeks = 0) {
  const currentDay = anchor.getDay();
  const distanceToMonday = currentDay === 0 ? 6 : currentDay - 1;
  const monday = new Date(anchor);

  monday.setHours(12, 0, 0, 0);
  monday.setDate(anchor.getDate() - distanceToMonday + offsetWeeks * 7);

  return Array.from({ length: 7 }).map((_, index) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + index);
    return formatDateLocal(date);
  });
}

export function getElapsedWeekDayCount(anchor: Date) {
  return anchor.getDay() === 0 ? 7 : anchor.getDay();
}

export function getRollingDates(
  anchor: Date,
  dayCount: number,
  offsetDays = 0
) {
  const endDate = new Date(anchor);
  endDate.setHours(12, 0, 0, 0);

  return Array.from({ length: dayCount }).map((_, index) => {
    const date = new Date(endDate);
    date.setDate(
      endDate.getDate() - (dayCount - 1 - index) + offsetDays
    );
    return formatDateLocal(date);
  });
}

export function buildWeeklyHydrationStats({
  anchor,
  history,
  todayIntake,
  currentGoal,
}: {
  anchor: Date;
  history: HydrationHistoryItem[];
  todayIntake: number;
  currentGoal: number;
}): WeeklyHydrationStats {
  const today = formatDateLocal(anchor);
  const elapsedDays = getElapsedWeekDayCount(anchor);
  const trackedByDate = new Map(history.map((day) => [day.date, day]));
  const currentWeekDates = getWeekDates(anchor);
  const previousWeekDates = getWeekDates(anchor, -1);
  const chartDays = currentWeekDates.map<HydrationStatsDay>((date) => {
    const trackedDay = trackedByDate.get(date);
    const isToday = date === today;

    return {
      date,
      intake: isToday ? todayIntake : trackedDay?.intake ?? 0,
      goal: isToday ? currentGoal : trackedDay?.goal ?? currentGoal,
      isToday,
      isFuture: date > today,
    };
  });
  const elapsedCurrentDays = chartDays.slice(0, elapsedDays);
  const previousMatchedDays = previousWeekDates
    .slice(0, elapsedDays)
    .map((date) => trackedByDate.get(date) ?? { date, intake: 0, goal: currentGoal });
  const currentTotal = elapsedCurrentDays.reduce((sum, day) => sum + day.intake, 0);
  const previousTotal = previousMatchedDays.reduce((sum, day) => sum + day.intake, 0);
  const daysWithHydration = elapsedCurrentDays.filter((day) => day.intake > 0).length;
  const previousDaysWithHydration = previousMatchedDays.filter((day) => day.intake > 0).length;
  const dailyAverage = Math.round(currentTotal / Math.max(elapsedDays, 1));
  const previousDailyAverage = Math.round(previousTotal / Math.max(elapsedDays, 1));

  return {
    chartDays,
    elapsedDays,
    daysWithHydration,
    dailyAverage,
    previousDailyAverage,
    averageDelta: dailyAverage - previousDailyAverage,
    canComparePeriods:
      daysWithHydration >= 2 && previousDaysWithHydration >= 1,
  };
}

export function buildRollingHydrationStats({
  anchor,
  history,
  todayIntake,
  currentGoal,
  dayCount = 30,
}: {
  anchor: Date;
  history: HydrationHistoryItem[];
  todayIntake: number;
  currentGoal: number;
  dayCount?: number;
}): HydrationRangeStats {
  const today = formatDateLocal(anchor);
  const trackedByDate = new Map(history.map((day) => [day.date, day]));
  const currentDates = getRollingDates(anchor, dayCount);
  const previousDates = getRollingDates(anchor, dayCount, -dayCount);
  const chartDays = currentDates.map<HydrationStatsDay>((date) => {
    const trackedDay = trackedByDate.get(date);
    const isToday = date === today;

    return {
      date,
      intake: isToday ? todayIntake : trackedDay?.intake ?? 0,
      goal: isToday ? currentGoal : trackedDay?.goal ?? currentGoal,
      isToday,
      isFuture: false,
    };
  });
  const previousDays = previousDates.map((date) => {
    const trackedDay = trackedByDate.get(date);
    return {
      date,
      intake: trackedDay?.intake ?? 0,
      goal: trackedDay?.goal ?? currentGoal,
    };
  });
  const currentTotal = chartDays.reduce((sum, day) => sum + day.intake, 0);
  const previousTotal = previousDays.reduce((sum, day) => sum + day.intake, 0);
  const daysWithHydration = chartDays.filter((day) => day.intake > 0).length;
  const previousDaysWithHydration = previousDays.filter(
    (day) => day.intake > 0
  ).length;
  const elapsedDays = dayCount;
  const dailyAverage = Math.round(currentTotal / Math.max(elapsedDays, 1));
  const previousDailyAverage = Math.round(
    previousTotal / Math.max(elapsedDays, 1)
  );

  return {
    chartDays,
    elapsedDays,
    daysWithHydration,
    dailyAverage,
    previousDailyAverage,
    averageDelta: dailyAverage - previousDailyAverage,
    canComparePeriods:
      daysWithHydration >= 3 && previousDaysWithHydration >= 3,
  };
}

export function getHydrationInsight(
  range: HydrationInsightRange,
  {
    daysWithHydration,
    elapsedDays,
    averageDelta,
    canComparePeriods,
  }: HydrationRangeStats
): HydrationInsight {
  if (daysWithHydration === 0) {
    return range === "week"
      ? {
          tone: "empty",
          title: "Your week is ready",
          body: "Log any drink when it feels natural. Your first data point will start the weekly view.",
        }
      : {
          tone: "empty",
          title: "Your 30-day view is ready",
          body: "Log any drink when it feels natural. Your first data point will start the 30-day view.",
        };
  }

  if (!canComparePeriods) {
    return range === "week"
      ? {
          tone: "forming",
          title: "A rhythm is taking shape",
          body: `Hydration is logged on ${daysWithHydration} of ${elapsedDays} days. A fair week-over-week comparison will appear when there is enough data.`,
        }
      : {
          tone: "forming",
          title: "Your 30-day rhythm is taking shape",
          body: `Hydration is logged on ${daysWithHydration} of ${elapsedDays} days. A comparison with the previous 30 days will appear after at least 3 logged days in each period.`,
        };
  }

  if (averageDelta > 0) {
    return range === "week"
      ? {
          tone: "rising",
          title: "Your daily average is rising",
          body: `You are averaging ${averageDelta} ml more per elapsed day than at the same point last week.`,
        }
      : {
          tone: "rising",
          title: "Your 30-day average is rising",
          body: `You are averaging ${averageDelta} ml more per day than in the previous 30 days.`,
        };
  }

  if (averageDelta < 0) {
    return range === "week"
      ? {
          tone: "falling",
          title: "Keep the pace comfortable",
          body: `Your average is ${Math.abs(averageDelta)} ml lower than at the same point last week. One small drink at a time is enough.`,
        }
      : {
          tone: "falling",
          title: "Keep the pace comfortable",
          body: `Your average is ${Math.abs(averageDelta)} ml lower per day than in the previous 30 days. One small drink at a time is enough.`,
        };
  }

  return range === "week"
    ? {
        tone: "steady",
        title: "A steady week so far",
        body: "Your daily average matches the same point last week. Consistency matters more than rushing.",
      }
    : {
        tone: "steady",
        title: "A steady 30 days",
        body: "Your daily average matches the previous 30 days. Consistency matters more than rushing.",
      };
}
