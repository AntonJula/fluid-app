"use client";

import React from "react";
import { Card } from "./ui/Card";
import { Button } from "./ui/Button";
import { useNotifications } from "@/hooks/useNotifications";

interface ReminderSettingsProps {
  interval: number;
  setInterval: (min: number) => void;
}

export function ReminderSettings({ interval, setInterval }: ReminderSettingsProps) {
  const { permission, requestPermission } = useNotifications(interval);
  const intervals = [15, 25, 45];

  return (
    <Card className="w-full max-w-sm mx-auto mt-4 space-y-4 shadow-sm border-white/50">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-water-900 tracking-tight">Reminders</h3>
        {permission !== "granted" && (
          <Button variant="ghost" size="sm" onClick={requestPermission} className="text-xs underline p-0 h-auto">
            Enable Notifications
          </Button>
        )}
      </div>

      <div className="flex gap-2 flex-wrap">
        {intervals.map((min) => (
          <Button
            key={min}
            variant={interval === min ? "primary" : "secondary"}
            size="sm"
            onClick={() => setInterval(min)}
            className="flex-1"
          >
            {min}m
          </Button>
        ))}
        <Button
          variant="ghost"
          size="sm"
          className={`flex-1 ${interval === 0 ? "bg-red-50 text-red-600 ring-1 ring-red-200" : "text-water-400"}`}
          onClick={() => setInterval(0)}
        >
          Off
        </Button>
      </div>
    </Card>
  );
}
