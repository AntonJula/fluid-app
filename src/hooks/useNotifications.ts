"use client";

import { useEffect, useRef, useState } from "react";

const MESSAGES = [
  "A quick sip now will make the next hour feel better.",
  "Hydration check. Give yourself a small refill break.",
  "A glass of water is an easy win right now.",
  "Keep the streak moving. A few sips count.",
];

function getInitialPermission(): NotificationPermission {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return "default";
  }

  return Notification.permission;
}

export function useNotifications(
  intervalMinutes: number,
  quietHours: { start: string; end: string } = { start: "22:00", end: "07:00" }
) {
  const [permission, setPermission] = useState<NotificationPermission>(getInitialPermission);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const quietHoursRef = useRef(quietHours);

  useEffect(() => {
    quietHoursRef.current = quietHours;
  }, [quietHours]);

  const requestPermission = async () => {
    if (typeof window === "undefined" || !("Notification" in window)) return;

    try {
      const result = await Notification.requestPermission();
      setPermission(result);

      if (result === "granted") {
        new Notification("Fluid", {
          body: "Notifications are on. We will keep the reminders calm and useful.",
        });
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (permission === "granted" && intervalMinutes > 0) {
      if (timerRef.current) clearInterval(timerRef.current);

      timerRef.current = setInterval(() => {
        const now = new Date();
        const currentMins = now.getHours() * 60 + now.getMinutes();

        const [startH, startM] = quietHoursRef.current.start.split(":").map(Number);
        const [endH, endM] = quietHoursRef.current.end.split(":").map(Number);
        const startMins = startH * 60 + startM;
        const endMins = endH * 60 + endM;

        let isQuietHour = false;
        if (startMins <= endMins) {
          isQuietHour = currentMins >= startMins && currentMins < endMins;
        } else {
          isQuietHour = currentMins >= startMins || currentMins < endMins;
        }

        if (isQuietHour) return;

        const msg = MESSAGES[Math.floor(Math.random() * MESSAGES.length)];
        new Notification("Fluid", {
          body: msg,
        });
      }, intervalMinutes * 60 * 1000);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [intervalMinutes, permission]);

  return { permission, requestPermission };
}
