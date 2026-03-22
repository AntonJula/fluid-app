"use client";

import React from "react";
import { Card } from "./ui/Card";
import { Button } from "./ui/Button";
import { useNotifications } from "@/hooks/useNotifications";
import { BellOff } from "lucide-react";

interface ReminderSettingsProps {
  interval: number;
  setInterval: (min: number) => void;
}

export function ReminderSettings({ interval, setInterval }: ReminderSettingsProps) {
  const { permission, requestPermission } = useNotifications(interval);
  const intervals = [15, 25, 45];

  const [isCustom, setIsCustom] = React.useState(false);
  const [customVal, setCustomVal] = React.useState(interval);
  const isPredefined = intervals.includes(interval);

  return (
    <Card className="w-full max-w-sm mx-auto mt-4 space-y-4 shadow-sm border-white/50 p-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-water-900 tracking-tight">Reminders</h3>
        {permission !== "granted" && (
          <Button variant="ghost" size="sm" onClick={requestPermission} className="text-xs underline p-0 h-auto">
            Enable Notifications
          </Button>
        )}
      </div>

      <div className="flex gap-2 flex-wrap items-center">
        {intervals.map((min) => (
          <Button
            key={min}
            variant={interval === min && !isCustom ? "primary" : "secondary"}
            size="sm"
            onClick={() => { setInterval(min); setIsCustom(false); }}
            className="flex-1 min-w-[3.5rem]"
          >
            {min}m
          </Button>
        ))}

        {isCustom ? (
          <div className="flex items-center gap-1 flex-[2] min-w-[9rem]">
            <input 
              type="number" 
              value={customVal || ""}
              onChange={e => setCustomVal(Number(e.target.value))}
              placeholder="Min"
              className="w-full bg-white/60 p-1.5 text-sm text-center border rounded-full outline-none font-semibold text-water-900 border-water-200 focus:border-water-500 transition-colors shadow-inner"
              autoFocus
            />
            <Button size="sm" onClick={() => { setInterval(customVal); setIsCustom(false); }} className="px-3">
              Set
            </Button>
          </div>
        ) : (
          <Button
            variant={!isPredefined && interval > 0 ? "primary" : "secondary"}
            size="sm"
            onClick={() => setIsCustom(true)}
            className="flex-1 min-w-[4rem]"
          >
            {!isPredefined && interval > 0 ? `${interval}m` : "Custom"}
          </Button>
        )}

        <Button
          variant={interval === 0 ? "primary" : "secondary"}
          size="sm"
          className="flex-1 min-w-[3.5rem]"
          onClick={() => { setInterval(0); setIsCustom(false); }}
          title="Turn Off Reminders"
        >
          <BellOff className="w-5 h-5" />
        </Button>
      </div>
    </Card>
  );
}
