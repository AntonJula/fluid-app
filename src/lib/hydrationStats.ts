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
