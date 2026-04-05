"use client";

import React from "react";
import { Card } from "./ui/Card";

import { Pen } from "lucide-react";
import { NumberPickerDialog } from "./ui/NumberPickerDialog";

interface GoalSettingsProps {
  goal: number;
  setGoal: (goal: number) => void;
}

export function GoalSettings({ goal, setGoal }: GoalSettingsProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <Card className="w-full max-w-sm mx-auto shadow-lg p-5">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-white tracking-tight text-lg">Daily Goal</h3>
        <button
          onClick={() => setIsOpen(true)}
          className="bg-water-800/50 border border-water-500/30 text-white text-sm rounded-xl hover:bg-water-700/50 hover:border-water-300 px-4 py-2 outline-none font-bold transition-all shadow-inner backdrop-blur-md flex items-center gap-2"
        >
          {goal >= 1000 && goal % 1000 === 0 ? `${goal / 1000}L` : `${goal}ml`}
          <Pen className="w-3.5 h-3.5 text-water-300" strokeWidth={3} />
        </button>
      </div>

      <NumberPickerDialog 
        isOpen={isOpen}
        value={goal}
        min={500}
        max={10000}
        title="Daily Goal"
        suffix="ml"
        onChange={setGoal}
        onClose={() => setIsOpen(false)}
      />
    </Card>
  );
}
