"use client";

import { useHydration } from "@/hooks/useHydration";
import { useNotifications } from "@/hooks/useNotifications";

export function NotificationManager() {
  const { reminderInterval, quietHours, intake, goal } = useHydration();

  useNotifications(reminderInterval, quietHours, intake < goal);

  return null;
}
