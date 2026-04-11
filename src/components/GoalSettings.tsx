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
      <Card className="w-full max-w-sm mx-auto shadow-lg p-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h3 className="font-ui font-semibold text-white tracking-tight text-lg">Daily Goal</h3>
            <p className="font-body mt-1 text-sm text-water-300/80">Pick a target that feels consistent and sustainable.</p>
          </div>

          <button
            onClick={() => setIsCustomOpen(true)}
            className="font-numeric bg-water-800/50 border border-water-500/30 text-white text-sm rounded-xl hover:bg-water-700/50 hover:border-water-300 px-4 py-2 outline-none font-bold transition-all shadow-inner backdrop-blur-md flex items-center gap-2"
          >
            {formatGoal(goal)}
            <Pen className="w-3.5 h-3.5 text-water-300" strokeWidth={3} />
          </button>
        </div>

        <div className="mt-5 rounded-[1.4rem] border border-water-400/10 bg-water-900/30 px-4 py-4">
          <div className="flex flex-wrap gap-2.5">
            {GOAL_PRESETS.map((preset) => {
              const isActive = goal === preset;

              return (
                <button
                  key={preset}
                  onClick={() => handlePresetSelect(preset)}
                  className={`font-numeric rounded-2xl px-3.5 py-2 text-sm font-bold transition-all ${
                    isActive
                      ? "bg-gradient-to-br from-water-400 to-water-600 text-white border border-water-200/25 shadow-lg shadow-water-500/20"
                      : "bg-water-800/40 border border-water-500/20 text-water-100 hover:bg-water-700/55 hover:border-water-300/35"
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
