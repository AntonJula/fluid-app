"use client";

import { useEffect } from "react";

const SERVICE_WORKER_PATH = "/fluid-notifications-sw.js";

export function ServiceWorkerManager() {
  useEffect(() => {
    if (
      typeof window === "undefined" ||
      typeof navigator === "undefined" ||
      !window.isSecureContext ||
      !("serviceWorker" in navigator)
    ) {
      return;
    }

    const timer = window.setTimeout(() => {
      navigator.serviceWorker.register(SERVICE_WORKER_PATH, { scope: "/" }).catch((error) => {
        if (process.env.NODE_ENV !== "production") {
          console.error("Failed to register Fluid service worker", error);
        }
      });
    }, 500);

    return () => {
      window.clearTimeout(timer);
    };
  }, []);

  return null;
}
