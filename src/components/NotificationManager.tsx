"use client";

import { useHydration } from "@/hooks/useHydration";
import { useNotifications } from "@/hooks/useNotifications";

export function NotificationManager() {
  const { reminderInterval, quietHours } = useHydration();

  useNotifications(reminderInterval, quietHours);

  return null;
}
