"use client";

import React from "react";
import { Pen } from "lucide-react";
import { Card } from "./ui/Card";
import { NumberPickerDialog } from "./ui/NumberPickerDialog";

interface GoalSettingsProps {
  goal: number;
  setGoal: (goal: number) => void;
}

const GOAL_PRESETS = [1000, 1500, 2000, 2500, 3000, 3500, 4000];

function formatGoal(goal: number) {
  if (goal >= 1000) {
    const liters = goal / 1000;
    return Number.isInteger(liters) ? `${liters}L` : `${liters.toFixed(1)}L`;
  }

  return `${goal}ml`;
}

export function GoalSettings({ goal, setGoal }: GoalSettingsProps) {
  const [isCustomOpen, setIsCustomOpen] = React.useState(false);

  const handlePresetSelect = (value: number) => {
    setGoal(value);
  };

  return (
    <>
      <Card className="mx-auto w-full max-w-sm p-4 shadow-lg min-[380px]:p-5 md:max-w-[28rem]">
        <div className="flex items-start justify-between gap-3 min-[380px]:gap-4">
          <div className="min-w-0">
            <h3 className="font-ui font-semibold text-white tracking-normal text-lg">Daily Goal</h3>
            <p className="font-body mt-1 text-sm text-water-300/80">Pick a target that feels consistent and sustainable.</p>
          </div>

          <button
            type="button"
            onClick={() => setIsCustomOpen(true)}
            className="font-numeric flex shrink-0 items-center gap-2 rounded-xl border border-water-300/16 bg-water-800/50 px-3 py-2 text-sm font-bold text-white shadow-inner outline-none backdrop-blur-md transition-all hover:border-water-200/24 hover:bg-water-700/50 min-[380px]:px-4"
            aria-label="Set custom daily goal"
          >
            {formatGoal(goal)}
            <Pen className="w-3.5 h-3.5 text-water-300" strokeWidth={3} />
          </button>
        </div>

        <div className="mt-5 rounded-[1.05rem] border border-water-300/12 bg-water-900/30 px-3 py-3 min-[380px]:rounded-[1.25rem] min-[380px]:px-4 min-[380px]:py-4">
          <div className="flex flex-wrap gap-2 min-[380px]:gap-2.5">
            {GOAL_PRESETS.map((preset) => {
              const isActive = goal === preset;

              return (
                <button
                  key={preset}
                  type="button"
                  onClick={() => handlePresetSelect(preset)}
                  aria-pressed={isActive}
                  aria-label={`Set daily goal to ${preset} milliliters`}
                  className={`font-numeric rounded-xl px-3 py-2 text-sm font-bold transition-all min-[380px]:rounded-2xl min-[380px]:px-3.5 ${
                    isActive
                      ? "border border-cyan-100/42 bg-water-800/48 text-white shadow-[0_0_0_1px_rgba(186,230,253,0.14),inset_0_1px_0_rgba(255,255,255,0.07)]"
                      : "bg-water-800/40 border border-water-300/14 text-water-100 hover:bg-water-700/55 hover:border-water-200/22"
                  }`}
                >
                  {formatGoal(preset)}
                </button>
              );
            })}
          </div>
        </div>
      </Card>

      <NumberPickerDialog
        isOpen={isCustomOpen}
        value={goal}
        min={500}
        max={10000}
        title="Custom Daily Goal"
        suffix="ml"
        onChange={setGoal}
        onClose={() => setIsCustomOpen(false)}
      />
    </>
  );
}
