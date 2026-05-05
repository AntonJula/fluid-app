"use client";

import { useHydration } from "@/hooks/useHydration";
import { useNotifications } from "@/hooks/useNotifications";

export function NotificationManager() {
  const { reminderInterval, quietHours, intake, goal, drinkLog } = useHydration();
  const lastDrinkAt = drinkLog.find((item) => item.amount > 0)?.timestamp ?? null;

  useNotifications(reminderInterval, quietHours, intake < goal, {
    intake,
    goal,
    lastDrinkAt,
  });

  return null;
}
