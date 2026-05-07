"use client";

import React from "react";
import {
  BellRing,
  Coffee,
  Droplets,
  Dumbbell,
  Leaf,
  Minus,
  Pencil,
  RefreshCw,
  RotateCcw,
  Sun,
  Tag,
  Target,
  Trash2,
  X,
} from "lucide-react";
import { useHydration, type DrinkLogItem } from "@/hooks/useHydration";
import { useNotifications } from "@/hooks/useNotifications";
import { WaveBackground } from "@/components/WaveBackground";
import { ProgressCard } from "@/components/ProgressCard";
import { NumberPickerDialog } from "@/components/ui/NumberPickerDialog";
import { Button } from "@/components/ui/Button";
import { SipIcon, GlassIcon, MugIcon, BottleIcon } from "@/components/DrinkIcons";
import type { HydrationNote } from "@/lib/hydrationState";

const QUICK_AMOUNTS = [
  { label: "Sip", amount: 150, Icon: SipIcon },
  { label: "Mug", amount: 330, Icon: MugIcon },
  { label: "Bottle", amount: 500, Icon: BottleIcon },
];

const NOTE_OPTIONS: Array<{ value: HydrationNote; label: string; Icon: React.ComponentType<{ className?: string; strokeWidth?: number }> }> = [
  { value: "water", label: "Water", Icon: Droplets },
  { value: "coffee", label: "Coffee", Icon: Coffee },
  { value: "tea", label: "Tea", Icon: Leaf },
  { value: "workout", label: "Workout", Icon: Dumbbell },
  { value: "hot-day", label: "Hot Day", Icon: Sun },
];

const SHIMMER_DELAYS = ["4.8s", "7.9s", "2.6s"];
const ONBOARDING_STORAGE_KEY = "fluid-onboarding-complete";
const ONBOARDING_GOALS = [2000, 2500, 3000];
const ONBOARDING_FAVORITE_AMOUNTS = [
  { label: "Small", amount: 150 },
  { label: "Glass", amount: 250 },
  { label: "Bottle", amount: 500 },
];
const ONBOARDING_REMINDERS = [
  { label: "Off", value: 0 },
  { label: "40m", value: 40 },
  { label: "60m", value: 60 },
];

function formatLogTime(timestamp: number) {
  return new Intl.DateTimeFormat("en", {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(timestamp));
}

function getNoteLabel(note?: HydrationNote) {
  return NOTE_OPTIONS.find((item) => item.value === note)?.label ?? "Water";
}

function getHomeStatusMessage(intake: number, goal: number) {
  const safeGoal = Math.max(goal, 1);
  const remaining = Math.max(0, safeGoal - intake);
  const overGoal = Math.max(0, intake - safeGoal);

  if (intake <= 0) return "Start with one glass";
  if (overGoal > 0) return `${overGoal} ml over goal`;
  if (remaining === 0) return "Goal complete, nice work";
  if (remaining <= 250) return "One small glass to finish";
  if (remaining <= 500) return "One glass to finish";

  return `${remaining} ml left today`;
}

function formatLiters(amount: number) {
  const liters = amount / 1000;
  return Number.isInteger(liters) ? `${liters}L` : `${liters.toFixed(1)}L`;
}

export default function Home() {
  const {
    intake,
    goal,
    drinkLog,
    quickAddAmount,
    quietHours,
    addDrink,
    subtractDrink,
    undoLastDrink,
    updateDrinkLogItem,
    deleteDrinkLogItem,
    setGoal,
    setQuickAddAmount,
    setReminderInterval,
    resetDaily,
    mounted,
  } = useHydration();
  const { requestPermission, isSupported: notificationsSupported } = useNotifications(0, quietHours, false);
  const [isResetConfirming, setIsResetConfirming] = React.useState(false);
  const [selectedNote, setSelectedNote] = React.useState<HydrationNote>("water");
  const [isNoteMenuOpen, setIsNoteMenuOpen] = React.useState(false);
  const [isCustomQuickOpen, setIsCustomQuickOpen] = React.useState(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = React.useState(false);
  const [isDailyLogOpen, setIsDailyLogOpen] = React.useState(false);
  const [onboardingGoal, setOnboardingGoal] = React.useState(goal);
  const [onboardingQuickAmount, setOnboardingQuickAmount] = React.useState(quickAddAmount);
  const [onboardingReminder, setOnboardingReminder] = React.useState(0);
  const [editingLog, setEditingLog] = React.useState<DrinkLogItem | null>(null);
  const handledQuickAddRef = React.useRef(false);

  React.useEffect(() => {
    if (!mounted || typeof window === "undefined") return;

    setOnboardingGoal(goal);
    setOnboardingQuickAmount(quickAddAmount);
    setIsOnboardingOpen(localStorage.getItem(ONBOARDING_STORAGE_KEY) !== "true");
  }, [goal, mounted, quickAddAmount]);

  React.useEffect(() => {
    if (!mounted || handledQuickAddRef.current || typeof window === "undefined") return;

    handledQuickAddRef.current = true;

    const quickAdd = Number(new URLSearchParams(window.location.search).get("quickAdd"));

    if (!Number.isFinite(quickAdd) || quickAdd <= 0) return;

    addDrink(Math.min(5000, Math.round(quickAdd)), "water");
    window.history.replaceState(null, "", `${window.location.pathname}${window.location.hash}`);
  }, [addDrink, mounted]);

  if (!mounted) {
    return <main className="min-h-screen bg-water-50" />;
  }

  const progressAttr = Math.min(1, Math.max(0, intake / goal));
  const latestLog = drinkLog.slice(0, 3);
  const homeStatusMessage = getHomeStatusMessage(intake, goal);
  const selectedNoteOption = NOTE_OPTIONS.find((item) => item.value === selectedNote) ?? NOTE_OPTIONS[0];
  const SelectedNoteIcon = selectedNoteOption.Icon;

  const handleReset = () => {
    resetDaily();
    setIsResetConfirming(false);
  };

  const handleAddDrink = (amount: number) => {
    addDrink(amount, selectedNote);
  };

  const handleEditLog = (amount: number) => {
    if (!editingLog) return;

    const sign = editingLog.amount < 0 ? -1 : 1;
    updateDrinkLogItem(editingLog.id, amount * sign, editingLog.note);
    setEditingLog(null);
  };

  const completeOnboarding = async () => {
    setGoal(onboardingGoal);
    setQuickAddAmount(onboardingQuickAmount);
    setReminderInterval(onboardingReminder);

    if (onboardingReminder > 0 && notificationsSupported) {
      await requestPermission();
    }

    localStorage.setItem(ONBOARDING_STORAGE_KEY, "true");
    setIsOnboardingOpen(false);
  };

  const skipOnboarding = () => {
    localStorage.setItem(ONBOARDING_STORAGE_KEY, "true");
    setIsOnboardingOpen(false);
  };

  return (
    <main className="relative mx-auto flex min-h-[100dvh] w-[100vw] max-w-[23rem] min-w-0 flex-col items-center overflow-x-hidden p-4 pb-24 pt-5 sm:max-w-[26rem] sm:p-6 sm:pb-24">
      <WaveBackground progress={progressAttr} />

      <div className="z-10 flex h-full min-w-0 flex-1 flex-col gap-5 w-full">
        <header className="relative z-20 mt-1 w-full text-center">
          <h1 className="font-display text-5xl font-black text-white drop-shadow-md sm:text-6xl">Fluid.</h1>
          <p className="font-ui mt-1 text-xs font-semibold uppercase tracking-widest text-water-200">
            {homeStatusMessage}
          </p>
        </header>

        <div className="mt-2 flex min-h-0 w-full flex-col items-center">
          <ProgressCard intake={intake} goal={goal} />
        </div>

        <section className="w-full max-w-[18.5rem] self-center space-y-3 sm:max-w-full">
          <div className="flex items-center justify-between gap-3 px-1">
            <p className="font-ui text-[12px] font-bold uppercase tracking-[0.18em] text-water-200/90">Quick add</p>
            <button
              type="button"
              onClick={() => setIsNoteMenuOpen((isOpen) => !isOpen)}
              className="font-ui inline-flex max-w-[11rem] items-center gap-1.5 rounded-full border border-white/10 bg-water-950/24 px-3 py-2 text-xs font-extrabold text-water-100 transition-all hover:border-cyan-100/25 hover:bg-white/10 hover:text-white active:scale-95"
              aria-expanded={isNoteMenuOpen}
              aria-controls="drink-type-menu"
              aria-label={`Change drink type. Current type: ${selectedNoteOption.label}`}
              title="Change drink type"
            >
              <SelectedNoteIcon className="h-3.5 w-3.5 shrink-0" strokeWidth={2.6} />
              <span className="truncate">{selectedNoteOption.label}</span>
              <Tag className="h-3.5 w-3.5 shrink-0 text-water-300/76" strokeWidth={2.6} />
            </button>
          </div>

          {isNoteMenuOpen && (
            <div
              id="drink-type-menu"
              className="grid grid-cols-2 gap-2 rounded-[1rem] border border-white/10 bg-water-950/28 p-2 shadow-inner backdrop-blur-md sm:grid-cols-3"
            >
              {NOTE_OPTIONS.map(({ value, label, Icon }) => {
                const isActive = selectedNote === value;

                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => {
                      setSelectedNote(value);
                      setIsNoteMenuOpen(false);
                    }}
                    className={`font-ui inline-flex min-w-0 items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-extrabold transition-all ${
                      isActive
                        ? "border-cyan-100/35 bg-cyan-100/18 text-white shadow-[0_8px_18px_rgba(56,189,248,0.16)]"
                        : "border-white/10 bg-water-950/18 text-water-200/75 hover:bg-white/10 hover:text-white"
                    }`}
                    aria-pressed={isActive}
                  >
                    <Icon className="h-3.5 w-3.5 shrink-0" strokeWidth={2.6} />
                    <span className="truncate">{label}</span>
                  </button>
                );
              })}
            </div>
          )}

          <button
            type="button"
            onClick={() => handleAddDrink(250)}
            className="group relative flex min-h-[6rem] w-full items-center justify-between overflow-hidden rounded-[1.25rem] border border-cyan-100/25 bg-gradient-to-br from-cyan-300/26 via-water-500/18 to-emerald-300/18 px-4 py-4 text-left shadow-[0_18px_34px_rgba(8,47,73,0.24),inset_0_1px_0_rgba(255,255,255,0.18)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-cyan-100/40 hover:brightness-110 active:scale-[0.98]"
            aria-label={`Add 250 milliliters as ${getNoteLabel(selectedNote)}`}
          >
            <div className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-white/70 to-transparent" />
            <div className="relative z-10 min-w-0 pr-3">
              <div className="flex items-center gap-2 text-cyan-100">
                <GlassIcon className="h-6 w-6 shrink-0 drop-shadow-md" />
                <span className="font-ui text-[0.76rem] font-black uppercase tracking-[0.16em]">Daily glass</span>
              </div>
              <p className="font-body mt-2 max-w-[13rem] text-sm font-semibold leading-snug text-water-100/82">
                Fast, calm, and tagged as {getNoteLabel(selectedNote).toLowerCase()}.
              </p>
            </div>
            <div className="relative z-10 shrink-0 text-right">
              <p className="font-numeric text-4xl font-black leading-none text-white drop-shadow-xl sm:text-5xl">250</p>
              <p className="font-ui mt-1 text-xs font-black uppercase tracking-[0.22em] text-cyan-100/75">ml</p>
            </div>
          </button>

          <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
            {QUICK_AMOUNTS.map(({ amount, label, Icon }, index) => (
              <button
                key={amount}
                type="button"
                onClick={() => handleAddDrink(amount)}
                className="group relative flex min-h-[6rem] flex-col items-center justify-center gap-2 overflow-hidden rounded-[1rem] border border-white/10 bg-white/5 px-2 py-3 shadow-[0_8px_16px_rgba(0,0,0,0.14),inset_0_1px_1px_rgba(255,255,255,0.1)] backdrop-blur-lg transition-all duration-300 hover:-translate-y-1 hover:border-white/20 hover:bg-white/10 hover:shadow-[0_12px_24px_rgba(56,189,248,0.18),inset_0_1px_2px_rgba(255,255,255,0.2)] active:scale-[0.97]"
                aria-label={`Add ${amount} milliliters as ${getNoteLabel(selectedNote)}`}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                <div
                  className="pointer-events-none absolute inset-y-[-14%] -left-[120%] w-[205%] rotate-[14deg] bg-[linear-gradient(90deg,rgba(255,255,255,0),rgba(255,255,255,0.14),rgba(255,255,255,0.38),rgba(255,255,255,0.14),rgba(255,255,255,0))] opacity-0 blur-[4px] animate-[quick-add-shimmer_15s_linear_infinite]"
                  style={{ animationDelay: SHIMMER_DELAYS[index] }}
                />
                <div className="relative z-10 flex items-center gap-1.5 text-water-200 transition-colors duration-300 group-hover:text-white">
                  <Icon className="h-5 w-5 drop-shadow-md" />
                  <span className="font-ui text-[10px] font-extrabold uppercase tracking-[0.14em]">{label}</span>
                </div>
                <span className="font-numeric relative z-10 mt-1 text-[1.35rem] font-black text-white drop-shadow-lg transition-transform duration-300 group-hover:scale-105">
                  {amount}
                  <span className="font-ui ml-0.5 text-[10px] font-extrabold tracking-normal text-water-300">ml</span>
                </span>
              </button>
            ))}
          </div>

          <div className="grid grid-cols-[1fr_auto] gap-2.5">
            <button
              type="button"
              onClick={() => handleAddDrink(quickAddAmount)}
              className="flex items-center justify-between rounded-[1rem] border border-water-300/18 bg-water-950/24 px-4 py-3 text-left shadow-inner transition-all hover:bg-water-900/32 active:scale-[0.98]"
              aria-label={`Add custom amount ${quickAddAmount} milliliters`}
            >
              <span>
                <span className="font-ui block text-xs font-black uppercase tracking-[0.18em] text-water-300/85">Favorite</span>
                <span className="font-body mt-1 block text-xs font-semibold text-water-300/70">Your usual one-tap amount</span>
              </span>
              <span className="font-numeric text-2xl font-black text-white">
                {quickAddAmount}
                <span className="font-ui ml-1 text-xs font-extrabold text-water-300">ml</span>
              </span>
            </button>
            <button
              type="button"
              onClick={() => setIsCustomQuickOpen(true)}
              className="flex w-12 items-center justify-center rounded-[1rem] border border-water-300/18 bg-water-950/24 text-water-200 transition-all hover:bg-water-900/32 hover:text-white active:scale-95"
              aria-label="Edit favorite amount"
            >
              <Pencil className="h-4 w-4" strokeWidth={2.5} />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={undoLastDrink}
              disabled={drinkLog.length === 0}
              className="rounded-[1rem] border-white/10 bg-water-950/28 px-3 py-3 text-water-100 disabled:opacity-35"
            >
              <RotateCcw className="mr-2 h-4 w-4" strokeWidth={2.5} />
              Undo
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => subtractDrink(250, selectedNote)}
              disabled={intake === 0}
              className="rounded-[1rem] border-rose-200/15 bg-rose-500/10 px-3 py-3 text-rose-50 hover:bg-rose-500/18 disabled:opacity-35"
            >
              <Minus className="mr-2 h-4 w-4" strokeWidth={2.5} />
              250 ml
            </Button>
          </div>

          {latestLog.length > 0 && (
            <div className="rounded-[1.15rem] border border-white/10 bg-water-950/22 px-4 py-3 backdrop-blur-md">
              <div className="mb-2 flex items-center justify-between">
                <p className="font-ui text-[0.68rem] font-black uppercase tracking-[0.2em] text-water-300/82">Recent</p>
                {drinkLog.length > 3 ? (
                  <button
                    type="button"
                    onClick={() => setIsDailyLogOpen(true)}
                    className="font-ui rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[0.68rem] font-black uppercase tracking-[0.16em] text-water-200 transition-colors hover:bg-white/10 hover:text-white"
                  >
                    View all
                  </button>
                ) : (
                  <p className="font-body text-xs font-semibold text-water-300/70">{drinkLog.length} actions</p>
                )}
              </div>
              <div className="space-y-2">
                {latestLog.map((item) => (
                  <div key={item.id} className="grid grid-cols-[1fr_auto] items-center gap-3 rounded-2xl bg-water-900/20 px-3 py-2">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <span className={`font-ui font-black ${item.amount > 0 ? "text-cyan-100" : "text-rose-100"}`}>
                          {item.amount > 0 ? "+" : ""}
                          {item.amount} ml
                        </span>
                        <span className="font-body text-xs font-semibold text-water-300/70">{formatLogTime(item.timestamp)}</span>
                      </div>
                      <p className="font-body mt-0.5 truncate text-xs font-semibold text-water-300/68">{getNoteLabel(item.note)}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setEditingLog(item)}
                        className="rounded-full p-2 text-water-300/78 transition-colors hover:bg-white/10 hover:text-white"
                        aria-label={`Edit ${Math.abs(item.amount)} milliliter log`}
                      >
                        <Pencil className="h-3.5 w-3.5" strokeWidth={2.5} />
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteDrinkLogItem(item.id)}
                        className="rounded-full p-2 text-rose-100/75 transition-colors hover:bg-rose-500/14 hover:text-rose-50"
                        aria-label={`Delete ${Math.abs(item.amount)} milliliter log`}
                      >
                        <Trash2 className="h-3.5 w-3.5" strokeWidth={2.5} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={() => setIsResetConfirming(true)}
            disabled={intake === 0 && drinkLog.length === 0}
            className="font-ui mx-auto flex items-center justify-center gap-2 rounded-full border border-rose-200/14 bg-rose-500/8 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-rose-50/82 transition-all hover:bg-rose-500/14 hover:text-rose-50 active:scale-95 disabled:pointer-events-none disabled:opacity-35"
            aria-label="Reset today's hydration"
          >
            <RefreshCw className="h-3.5 w-3.5" strokeWidth={2.5} />
            Reset today
          </button>
        </section>
      </div>

      <NumberPickerDialog
        isOpen={isCustomQuickOpen}
        value={quickAddAmount}
        min={50}
        max={5000}
        title="Favorite Amount"
        suffix="ml"
        onChange={setQuickAddAmount}
        onClose={() => setIsCustomQuickOpen(false)}
      />

      <NumberPickerDialog
        isOpen={editingLog !== null}
        value={editingLog ? Math.abs(editingLog.amount) : 250}
        min={1}
        max={5000}
        title="Edit Log"
        suffix="ml"
        onChange={handleEditLog}
        onClose={() => setEditingLog(null)}
      />

      {isDailyLogOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-water-950/72 p-4 backdrop-blur-xl sm:p-6">
          <div className="flex max-h-[min(34rem,calc(100dvh-2rem))] w-full max-w-[23rem] flex-col overflow-hidden rounded-[1.35rem] border border-white/12 bg-water-950/90 shadow-[0_24px_70px_rgba(0,0,0,0.42)]">
            <div className="flex items-start justify-between gap-4 border-b border-white/10 px-5 py-4">
              <div>
                <p className="font-ui text-[11px] font-black uppercase tracking-[0.22em] text-water-300/80">Today</p>
                <h2 className="font-ui mt-1 text-2xl font-black tracking-normal text-white">Drink log</h2>
                <p className="font-body mt-1 text-sm font-semibold text-water-300/78">{drinkLog.length} actions recorded</p>
              </div>
              <button
                type="button"
                onClick={() => setIsDailyLogOpen(false)}
                className="rounded-full p-2 text-water-200/80 transition-colors hover:bg-white/10 hover:text-white"
                aria-label="Close daily log"
              >
                <X className="h-5 w-5" strokeWidth={2.5} />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
              <div className="space-y-2">
                {drinkLog.map((item) => (
                  <div key={item.id} className="grid grid-cols-[1fr_auto] items-center gap-3 rounded-2xl border border-white/10 bg-water-900/22 px-3 py-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <span className={`font-ui font-black ${item.amount > 0 ? "text-cyan-100" : "text-rose-100"}`}>
                          {item.amount > 0 ? "+" : ""}
                          {item.amount} ml
                        </span>
                        <span className="font-body text-xs font-semibold text-water-300/70">{formatLogTime(item.timestamp)}</span>
                      </div>
                      <p className="font-body mt-0.5 truncate text-xs font-semibold text-water-300/68">{getNoteLabel(item.note)}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingLog(item);
                          setIsDailyLogOpen(false);
                        }}
                        className="rounded-full p-2 text-water-300/78 transition-colors hover:bg-white/10 hover:text-white"
                        aria-label={`Edit ${Math.abs(item.amount)} milliliter log`}
                      >
                        <Pencil className="h-3.5 w-3.5" strokeWidth={2.5} />
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteDrinkLogItem(item.id)}
                        className="rounded-full p-2 text-rose-100/75 transition-colors hover:bg-rose-500/14 hover:text-rose-50"
                        aria-label={`Delete ${Math.abs(item.amount)} milliliter log`}
                      >
                        <Trash2 className="h-3.5 w-3.5" strokeWidth={2.5} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {isResetConfirming && (
        <div className="fixed inset-0 z-[115] flex items-center justify-center bg-water-950/72 p-4 backdrop-blur-xl sm:p-6">
          <div className="w-full max-w-[22rem] overflow-hidden rounded-[1.35rem] border border-rose-100/16 bg-water-950/92 shadow-[0_24px_70px_rgba(0,0,0,0.42)]">
            <div className="border-b border-white/10 px-5 py-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-ui text-[11px] font-black uppercase tracking-[0.22em] text-rose-100/78">Today actions</p>
                  <h2 className="font-ui mt-2 text-2xl font-black tracking-normal text-white">Reset today?</h2>
                </div>
                <button
                  type="button"
                  onClick={() => setIsResetConfirming(false)}
                  className="rounded-full p-2 text-water-200/80 transition-colors hover:bg-white/10 hover:text-white"
                  aria-label="Cancel reset"
                >
                  <X className="h-5 w-5" strokeWidth={2.5} />
                </button>
              </div>
              <p className="font-body mt-3 text-sm font-semibold leading-relaxed text-water-300/82">
                This clears today&apos;s intake and drink log. Your previous days stay saved.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 px-5 py-4">
              <Button type="button" variant="secondary" size="sm" onClick={() => setIsResetConfirming(false)} className="rounded-xl">
                Cancel
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={handleReset}
                className="rounded-xl border-rose-200/20 bg-rose-500/14 text-rose-50 hover:bg-rose-500/22"
              >
                Reset today
              </Button>
            </div>
          </div>
        </div>
      )}

      {isOnboardingOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-water-950/72 p-4 backdrop-blur-xl sm:p-6">
          <div className="w-full max-w-[23rem] overflow-hidden rounded-[1.35rem] border border-white/12 bg-water-950/88 shadow-[0_24px_70px_rgba(0,0,0,0.42)]">
            <div className="border-b border-white/10 px-5 py-4">
              <p className="font-ui text-[11px] font-black uppercase tracking-[0.22em] text-water-300/80">First setup</p>
              <h2 className="font-ui mt-2 text-2xl font-black tracking-normal text-white">Make Fluid fit your day.</h2>
              <p className="font-body mt-2 text-sm font-semibold leading-relaxed text-water-300/82">
                Pick the defaults you will actually use. You can change them anytime.
              </p>
            </div>

            <div className="space-y-5 px-5 py-5">
              <section>
                <div className="mb-2 flex items-center gap-2 text-water-200">
                  <Target className="h-4 w-4" strokeWidth={2.5} />
                  <p className="font-ui text-sm font-bold">Daily goal</p>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {ONBOARDING_GOALS.map((preset) => {
                    const isActive = onboardingGoal === preset;

                    return (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setOnboardingGoal(preset)}
                        className={`font-numeric rounded-xl border px-3 py-3 text-sm font-black transition-all ${
                          isActive
                            ? "border-water-200/35 bg-water-400/22 text-white shadow-[0_8px_18px_rgba(56,189,248,0.14)]"
                            : "border-white/10 bg-water-900/28 text-water-200 hover:bg-white/10"
                        }`}
                        aria-pressed={isActive}
                      >
                        {formatLiters(preset)}
                      </button>
                    );
                  })}
                </div>
              </section>

              <section>
                <div className="mb-2 flex items-center gap-2 text-water-200">
                  <GlassIcon className="h-4 w-4" />
                  <p className="font-ui text-sm font-bold">Favorite amount</p>
                </div>
                <p className="font-body mb-2 text-xs font-semibold leading-relaxed text-water-300/78">
                  This becomes your saved one-tap amount on the Home screen.
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {ONBOARDING_FAVORITE_AMOUNTS.map(({ label, amount }) => {
                    const isActive = onboardingQuickAmount === amount;

                    return (
                      <button
                        key={amount}
                        type="button"
                        onClick={() => setOnboardingQuickAmount(amount)}
                        className={`font-numeric rounded-xl border px-3 py-3 text-sm font-black transition-all ${
                          isActive
                            ? "border-cyan-100/35 bg-cyan-100/18 text-white shadow-[0_8px_18px_rgba(56,189,248,0.14)]"
                            : "border-white/10 bg-water-900/28 text-water-200 hover:bg-white/10"
                        }`}
                        aria-pressed={isActive}
                      >
                        <span className="font-ui block text-[0.68rem] font-black uppercase tracking-[0.12em] text-water-300/88">
                          {label}
                        </span>
                        <span className="mt-1 block">{amount} ml</span>
                      </button>
                    );
                  })}
                </div>
              </section>

              <section>
                <div className="mb-2 flex items-center gap-2 text-water-200">
                  <BellRing className="h-4 w-4" strokeWidth={2.5} />
                  <p className="font-ui text-sm font-bold">Reminders</p>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {ONBOARDING_REMINDERS.map(({ label, value }) => {
                    const isActive = onboardingReminder === value;

                    return (
                      <button
                        key={label}
                        type="button"
                        onClick={() => setOnboardingReminder(value)}
                        className={`font-ui rounded-xl border px-3 py-3 text-sm font-black transition-all ${
                          isActive
                            ? "border-emerald-100/32 bg-emerald-300/14 text-white shadow-[0_8px_18px_rgba(45,212,191,0.12)]"
                            : "border-white/10 bg-water-900/28 text-water-200 hover:bg-white/10"
                        }`}
                        aria-pressed={isActive}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
                {onboardingReminder > 0 && !notificationsSupported && (
                  <p className="font-body mt-2 rounded-xl border border-rose-200/18 bg-rose-500/10 px-3 py-2 text-xs font-semibold text-rose-50/86">
                    Notifications are not available on this device yet.
                  </p>
                )}
              </section>
            </div>

            <div className="grid grid-cols-[auto_1fr] gap-3 border-t border-white/10 px-5 py-4">
              <Button type="button" variant="ghost" size="sm" onClick={skipOnboarding} className="rounded-xl px-3">
                Skip
              </Button>
              <Button type="button" variant="primary" size="sm" onClick={completeOnboarding} className="rounded-xl">
                Start Fluid
              </Button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
