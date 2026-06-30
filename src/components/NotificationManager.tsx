"use client";

import { useHydration } from "@/hooks/useHydration";
import { useNotifications } from "@/hooks/useNotifications";
import { formatDateLocal } from "@/lib/date";

function getConsecutiveDryDays(history: Array<{ date: string; intake: number }>, todayIntake: number) {
  if (todayIntake > 0) return 0;

  const historyByDate = new Map(history.map((day) => [day.date, day]));
  const cursor = new Date();
  let dryDays = 1;

  for (let index = 0; index < 45; index++) {
    cursor.setDate(cursor.getDate() - 1);

    const day = historyByDate.get(formatDateLocal(cursor));
    if (!day || day.intake > 0) break;

    dryDays++;
  }

  return dryDays;
}

export function NotificationManager() {
  const { reminderInterval, quietHours, intake, goal, drinkLog, history, streak, streakShieldCharges, streakAlert, workoutSessionEndsAt } =
    useHydration();
  const lastDrinkAt = drinkLog.find((item) => item.amount > 0)?.timestamp ?? null;
  const lastWorkoutDrinkAt = drinkLog.find((item) => item.amount > 0 && item.note === "workout")?.timestamp ?? null;
  const inactiveDays = getConsecutiveDryDays(history, intake);

  useNotifications(reminderInterval, quietHours, true, {
    intake,
    goal,
    lastDrinkAt,
    inactiveDays,
    streak,
    streakShieldCharges,
    streakAlert,
    workoutSessionEndsAt,
    lastWorkoutDrinkAt,
  });

  return null;
}
