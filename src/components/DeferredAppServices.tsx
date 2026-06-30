"use client";

import dynamic from "next/dynamic";
import React from "react";

const NotificationManager = dynamic(
  () => import("@/components/NotificationManager").then((mod) => mod.NotificationManager),
  { ssr: false }
);

const ServiceWorkerManager = dynamic(
  () => import("@/components/ServiceWorkerManager").then((mod) => mod.ServiceWorkerManager),
  { ssr: false }
);

export function DeferredAppServices() {
  const [isReady, setIsReady] = React.useState(false);

  React.useEffect(() => {
    const win = window as Window &
      typeof globalThis & {
        requestIdleCallback?: (callback: IdleRequestCallback, options?: IdleRequestOptions) => number;
        cancelIdleCallback?: (handle: number) => void;
      };

    if (win.requestIdleCallback) {
      const idleHandle = win.requestIdleCallback(() => setIsReady(true), { timeout: 1200 });

      return () => {
        win.cancelIdleCallback?.(idleHandle);
      };
    }

    const timer = window.setTimeout(() => setIsReady(true), 300);

    return () => {
      window.clearTimeout(timer);
    };
  }, []);

  if (!isReady) return null;

  return (
    <>
      <ServiceWorkerManager />
      <NotificationManager />
    </>
  );
}
