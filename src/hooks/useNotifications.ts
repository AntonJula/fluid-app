"use client";

import { useState, useEffect, useRef } from "react";

const MESSAGES = [
  "Time for a sip 💧",
  "Hydration check!",
  "Quick water break",
  "Keep the streak going, drink water!"
];

export function useNotifications(intervalMinutes: number) {
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = async () => {
    if (typeof window === "undefined" || !("Notification" in window)) return;
    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      if (result === "granted") {
        new Notification("Fluid", { 
          body: "Notifications enabled! We'll remind you to drink water.",
        });
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (permission === "granted" && intervalMinutes > 0) {
      // Clear existing interval
      if (timerRef.current) clearInterval(timerRef.current);
      
      // Set new interval
      timerRef.current = setInterval(() => {
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
