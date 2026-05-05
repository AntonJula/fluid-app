"use client";

import React from "react";
import { useHydration } from "@/hooks/useHydration";
import { Card } from "@/components/ui/Card";
import { Flame, Calendar, Trophy, Waves, ChartColumn, Crown, TrendingUp, Target, CircleOff } from "lucide-react";
import { formatDateLocal } from "@/lib/date";
import { useSwipeUiState } from "@/hooks/useSwipeUiState";

const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function getWeekDates(anchor: Date, offsetWeeks = 0) {
  const currentDay = anchor.getDay();
  const distanceToMonday = currentDay === 0 ? 6 : currentDay - 1;
  const monday = new Date(anchor);

  monday.setDate(anchor.getDate() - distanceToMonday + offsetWeeks * 7);

  return Array.from({ length: 7 }).map((_, index) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + index);
    return formatDateLocal(date);
  });
}

function getBestStreak(days: { intake: number; goal: number }[]) {
  let best = 0;
  let current = 0;

  days.forEach((day) => {
    if (day.intake >= day.goal) {
      current += 1;
      best = Math.max(best, current);
      return;
    }

    current = 0;
  });

  return best;
}

export default function StatsPage() {
  const { streak, history, intake, goal, mounted } = useHydration();
  const { navigationTick } = useSwipeUiState();
  const [barsReady, setBarsReady] = React.useState(false);

  React.useEffect(() => {
    let frameId = 0;

    setBarsReady(false);
    frameId = window.requestAnimationFrame(() => setBarsReady(true));

    return () => window.cancelAnimationFrame(frameId);
  }, [navigationTick]);

  if (!mounted) {
    return <main className="min-h-screen bg-water-50" />;
  }

  const todayDate = new Date();
  const today = formatDateLocal(todayDate);
  const currentWeek = getWeekDates(todayDate);
  const previousWeek = getWeekDates(todayDate, -1);
  const chartData = currentWeek.map((dateStr) => {
    if (dateStr === today) {
      return { date: dateStr, intake, goal };
    }

    const found = history.find((item) => item.date === dateStr);
    return found ?? { date: dateStr, intake: 0, goal };
  });
  const previousWeekData = previousWeek.map((dateStr) => history.find((item) => item.date === dateStr) ?? { date: dateStr, intake: 0, goal });
  const allTrackedDays = [...history, { date: today, intake, goal }].sort((a, b) => a.date.localeCompare(b.date));

  const maxIntake = Math.max(...chartData.map((day) => day.intake), goal, 1);
  const weeklyGoalHits = chartData.filter((day) => day.intake >= day.goal).length;
  const weeklyAverage = Math.round(chartData.reduce((sum, day) => sum + day.intake, 0) / chartData.length);
  const previousAverage = Math.round(previousWeekData.reduce((sum, day) => sum + day.intake, 0) / previousWeekData.length);
  const averageDelta = weeklyAverage - previousAverage;
  const bestDay = chartData.reduce((best, day) => (day.intake > best.intake ? day : best), chartData[0]);
  const consistency = Math.round((weeklyGoalHits / chartData.length) * 100);
  const bestDayLabel = DAY_NAMES[chartData.findIndex((day) => day.date === bestDay.date)] ?? "Today";
  const bestStreak = getBestStreak(allTrackedDays);
  const missedDays = chartData.filter((day) => day.date <= today && day.intake < day.goal).length;
  const remainingWeeklyWins = Math.max(0, 7 - weeklyGoalHits);

  return (
    <main className="flex-1 flex flex-col items-center p-6 w-full max-w-md mx-auto min-h-[100dvh]">
      <header key={`stats-header-${navigationTick}`} className="w-full text-center mt-4 mb-8 animate-[stats-rise_520ms_cubic-bezier(0.22,0.9,0.32,1)_both]">
        <h1 className="font-display text-4xl font-black text-white drop-shadow-md">Your Stats.</h1>
        <p className="font-ui text-xs font-semibold mt-1 tracking-widest text-water-200 uppercase mb-6">
          Consistency builds the habit
        </p>
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-water-900/40 backdrop-blur-md rounded-2xl text-water-100 font-semibold text-sm shadow-inner border border-water-400/20">
          <span className="font-body opacity-80">Daily Goal:</span>
          <span className="font-numeric text-water-300 font-bold tracking-wide">{goal} ml</span>
        </div>
      </header>

      <div key={`stats-top-${navigationTick}`} className="w-full grid grid-cols-2 gap-4 mb-6 animate-[stats-rise_560ms_cubic-bezier(0.22,0.9,0.32,1)_both]">
        <Card className="flex flex-col items-center justify-center p-5 text-center">
          <div className="flex items-center gap-2 mb-2">
            <Flame className="w-5 h-5 text-water-300 drop-shadow-sm" strokeWidth={2.5} />
            <span className="font-ui text-water-300 font-bold text-sm tracking-wide">Streak</span>
          </div>
          <div className="font-numeric text-4xl sm:text-5xl font-black text-white px-2 drop-shadow-md">{streak}</div>
          <span className="font-ui text-water-400/80 text-[10px] mt-2 uppercase tracking-widest font-bold">Days in a row</span>
        </Card>

        <Card className="flex flex-col items-center justify-center p-5 text-center">
          <div className="flex items-center gap-2 mb-2">
            <Trophy className="w-5 h-5 text-water-200 drop-shadow-sm" strokeWidth={2.5} />
            <span className="font-ui text-water-300 font-bold text-sm tracking-wide">Today</span>
          </div>
          <div className="font-numeric text-4xl sm:text-5xl font-black text-white px-2 drop-shadow-md">
            {Math.round((intake / goal) * 100)}
            <span className="font-ui text-xl text-water-400 ml-0.5">%</span>
          </div>
          <span className="font-ui text-water-400/80 text-[10px] mt-2 uppercase tracking-widest font-bold">Goal completed</span>
        </Card>
      </div>

      <div key={`stats-mid-${navigationTick}`} className="w-full grid grid-cols-2 gap-4 mb-8 animate-[stats-rise_620ms_cubic-bezier(0.22,0.9,0.32,1)_both]">
        <Card className="p-4">
          <div className="font-ui flex items-center gap-1.5 text-water-300 text-[0.78rem] sm:text-sm font-bold tracking-wide whitespace-nowrap">
            <Waves className="w-3.5 h-3.5 shrink-0" strokeWidth={2.4} />
            Weekly Average
          </div>
          <p className="font-numeric mt-3 text-3xl font-black text-white">{weeklyAverage} ml</p>
          <p className="font-body mt-1 text-xs text-water-400/80">Average intake across this week.</p>
        </Card>

        <Card className="p-4">
          <div className="font-ui flex items-center gap-2 text-water-300 text-sm font-bold tracking-wide">
            <ChartColumn className="w-4 h-4" strokeWidth={2.4} />
            Consistency
          </div>
          <p className="font-numeric mt-3 text-3xl font-black text-white">{consistency}%</p>
          <p className="font-body mt-1 text-xs text-water-400/80">{weeklyGoalHits} of 7 days hit the goal.</p>
        </Card>
      </div>

      <div key={`stats-insights-${navigationTick}`} className="w-full grid grid-cols-3 gap-3 mb-6 animate-[stats-rise_680ms_cubic-bezier(0.22,0.9,0.32,1)_both]">
        <Card className="p-3">
          <div className="flex items-center gap-1.5 text-emerald-100">
            <TrendingUp className="h-3.5 w-3.5" strokeWidth={2.5} />
            <span className="font-ui text-[0.68rem] font-black uppercase tracking-[0.16em]">Trend</span>
          </div>
          <p className={`font-numeric mt-2 text-2xl font-black ${averageDelta >= 0 ? "text-emerald-100" : "text-rose-100"}`}>
            {averageDelta >= 0 ? "+" : ""}
            {averageDelta}
          </p>
          <p className="font-body mt-1 text-[0.68rem] font-semibold text-water-300/72">ml vs last week</p>
        </Card>

        <Card className="p-3">
          <div className="flex items-center gap-1.5 text-cyan-100">
            <Target className="h-3.5 w-3.5" strokeWidth={2.5} />
            <span className="font-ui text-[0.68rem] font-black uppercase tracking-[0.16em]">Best</span>
          </div>
          <p className="font-numeric mt-2 text-2xl font-black text-white">{bestStreak}</p>
          <p className="font-body mt-1 text-[0.68rem] font-semibold text-water-300/72">day streak</p>
        </Card>

        <Card className="p-3">
          <div className="flex items-center gap-1.5 text-rose-100">
            <CircleOff className="h-3.5 w-3.5" strokeWidth={2.5} />
            <span className="font-ui text-[0.68rem] font-black uppercase tracking-[0.16em]">Missed</span>
          </div>
          <p className="font-numeric mt-2 text-2xl font-black text-white">{missedDays}</p>
          <p className="font-body mt-1 text-[0.68rem] font-semibold text-water-300/72">so far</p>
        </Card>
      </div>

      <Card key={`stats-best-${navigationTick}`} className="w-full p-6 mb-6 animate-[stats-rise_720ms_cubic-bezier(0.22,0.9,0.32,1)_both]">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="font-ui flex items-center gap-2 text-water-300 text-sm font-bold tracking-wide">
              <Crown className="w-4 h-4" strokeWidth={2.4} />
              Best Day This Week
            </div>
            <p className="font-ui mt-3 text-3xl font-black tracking-tight text-white">{bestDayLabel}</p>
            <p className="font-body mt-1 text-sm text-water-300/80">{bestDay.intake} ml was your strongest day.</p>
          </div>
          <div className="rounded-3xl border border-water-400/15 bg-water-800/40 px-4 py-3 text-center">
            <p className="font-ui text-[10px] uppercase tracking-[0.2em] font-bold text-water-400/80">Wins</p>
            <p className="font-numeric mt-2 text-3xl font-black text-white">{weeklyGoalHits}</p>
          </div>
        </div>
        <div className="mt-5 rounded-2xl border border-cyan-100/12 bg-cyan-300/10 px-4 py-3">
          <p className="font-body text-sm font-semibold leading-relaxed text-water-100/88">
            {averageDelta >= 0
              ? `You are ${averageDelta} ml/day ahead of last week.`
              : `You are ${Math.abs(averageDelta)} ml/day behind last week.`}{" "}
            {remainingWeeklyWins === 0 ? "Perfect week locked in." : `${remainingWeeklyWins} more goal days would finish a clean week.`}
          </p>
        </div>
      </Card>

      <Card key={`stats-chart-${navigationTick}`} className="w-full p-6 animate-[stats-rise_760ms_cubic-bezier(0.22,0.9,0.32,1)_both]">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-water-400" strokeWidth={2.5} />
            <h2 className="font-ui text-white text-lg font-bold tracking-tight drop-shadow-sm">Tracking History</h2>
          </div>
          <span className="font-ui text-[11px] uppercase tracking-[0.22em] font-bold text-water-400/70">This week</span>
        </div>

        <p className="font-body text-sm text-water-300/80 mb-6">
          Taller bars mean stronger hydration days. Bright bars are days when you hit your goal.
        </p>

        <div className="flex items-end justify-between h-56 pt-4 gap-2">
          {chartData.map((day, idx) => {
            const heightPercent = Math.min(100, (day.intake / maxIntake) * 100);
            const isGoalMet = day.intake > 0 && day.intake >= day.goal;
            const isToday = day.date === today;

            return (
              <div key={day.date} className="flex flex-col items-center gap-3 flex-1 h-full group">
                <div
                  className={`flex min-h-[2rem] flex-col items-center justify-end px-1 py-1 transition-colors ${
                    isToday ? "text-water-50" : "text-water-300/72"
                  }`}
                >
                  <span className="font-numeric text-[0.78rem] font-black leading-none">{day.intake}</span>
                  <span className="font-ui mt-0.5 text-[0.56rem] font-semibold uppercase tracking-[0.22em] text-inherit/70">ml</span>
                </div>
                <div
                  className={`relative w-full h-full flex-1 flex items-end justify-center rounded-[1.2rem] overflow-hidden shadow-inner transition-all duration-300 ${
                    isToday
                      ? "bg-water-800/55 border border-water-300/45 shadow-[0_0_0_1px_rgba(125,211,252,0.18),0_0_22px_rgba(56,189,248,0.16)]"
                      : "bg-water-800/40 border border-water-500/20"
                  }`}
                >
                  <div
                    className={`w-full rounded-[1.2rem] transition-all duration-1000 ease-out group-hover:brightness-110 ${
                      isGoalMet
                        ? "bg-gradient-to-t from-water-600 via-water-400 to-water-200"
                        : "bg-gradient-to-t from-water-900/80 to-water-700/70"
                    }`}
                    style={{ height: `${barsReady ? Math.max(heightPercent, day.intake > 0 ? 10 : 0) : 0}%` }}
                  />
                </div>
                <span
                  className={`font-ui text-[10px] uppercase font-bold tracking-wider ${
                    isToday ? "text-water-100 drop-shadow-sm" : "text-water-400/80"
                  }`}
                >
                  {DAY_NAMES[idx]}
                </span>
              </div>
            );
          })}
        </div>
      </Card>

      <style
        dangerouslySetInnerHTML={{
          __html: `
            @keyframes stats-rise {
              0% {
                opacity: 0;
                transform: translateY(16px);
                filter: blur(3px);
              }
              100% {
                opacity: 1;
                transform: translateY(0);
                filter: blur(0);
              }
            }
          `,
        }}
      />
    </main>
  );
}
