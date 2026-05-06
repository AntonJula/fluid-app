"use client";

import React from "react";
import {
  Check,
  Coffee,
  Droplets,
  Dumbbell,
  Leaf,
  Minus,
  Pencil,
  RefreshCw,
  RotateCcw,
  Sun,
  Trash2,
  X,
} from "lucide-react";
import { useHydration, type DrinkLogItem } from "@/hooks/useHydration";
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

function formatLogTime(timestamp: number) {
  return new Intl.DateTimeFormat("en", {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(timestamp));
}

function getNoteLabel(note?: HydrationNote) {
  return NOTE_OPTIONS.find((item) => item.value === note)?.label ?? "Water";
}

export default function Home() {
  const {
    intake,
    goal,
    drinkLog,
    quickAddAmount,
    addDrink,
    subtractDrink,
    undoLastDrink,
    updateDrinkLogItem,
    deleteDrinkLogItem,
    setQuickAddAmount,
    resetDaily,
    mounted,
  } = useHydration();
  const [isResetConfirming, setIsResetConfirming] = React.useState(false);
  const [selectedNote, setSelectedNote] = React.useState<HydrationNote>("water");
  const [isCustomQuickOpen, setIsCustomQuickOpen] = React.useState(false);
  const [editingLog, setEditingLog] = React.useState<DrinkLogItem | null>(null);
  const handledQuickAddRef = React.useRef(false);

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
  const completedToday = intake >= goal;
  const latestLog = drinkLog.slice(0, 5);

  const handleReset = () => {
    if (!isResetConfirming) {
      setIsResetConfirming(true);
      window.setTimeout(() => setIsResetConfirming(false), 4000);
      return;
    }

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

  return (
    <main className="relative mx-auto flex min-h-[100dvh] w-[100vw] max-w-[23rem] min-w-0 flex-col items-center overflow-x-hidden p-4 pb-24 pt-5 sm:max-w-[26rem] sm:p-6 sm:pb-24">
      <WaveBackground progress={progressAttr} />

      <div className="z-10 flex h-full min-w-0 flex-1 flex-col gap-5 w-full">
        <header className="relative z-20 mt-1 w-full text-center">
          <div className="absolute right-0 top-0 z-50">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleReset}
              className={`rounded-full p-2.5 backdrop-blur-md transition-all ${
                isResetConfirming
                  ? "bg-rose-500/25 text-rose-100 hover:bg-rose-500/35"
                  : "bg-water-800/30 text-water-300 hover:bg-water-700/50 hover:text-white active:rotate-180"
              }`}
              aria-label={isResetConfirming ? "Confirm reset today's hydration" : "Reset today's hydration"}
              title={isResetConfirming ? "Tap again to reset today's hydration" : "Reset today's hydration"}
            >
              {isResetConfirming ? <Check className="h-5 w-5" strokeWidth={2.5} /> : <RefreshCw className="h-5 w-5" strokeWidth={2.5} />}
            </Button>
          </div>

          <h1 className="font-display text-5xl font-black text-white drop-shadow-md sm:text-6xl">Fluid.</h1>
          <p className="font-ui mt-1 text-xs font-semibold uppercase tracking-widest text-water-200">
            {completedToday ? "Today is complete" : "Build your daily rhythm"}
          </p>
        </header>

        <div className="mt-2 flex min-h-0 w-full flex-col items-center">
          <ProgressCard intake={intake} goal={goal} />
        </div>

        <section className="w-full max-w-[18.5rem] self-center space-y-3 sm:max-w-full">
          <div className="flex items-center justify-between px-1">
            <p className="font-ui text-[12px] font-bold uppercase tracking-[0.18em] text-water-200/90">Quick add</p>
            <p className="font-body text-xs font-semibold text-water-300/80">Tap to log</p>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {NOTE_OPTIONS.map(({ value, label, Icon }) => {
              const isActive = selectedNote === value;

              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => setSelectedNote(value)}
                  className={`font-ui inline-flex min-w-max items-center gap-1.5 rounded-full border px-3 py-2 text-xs font-extrabold transition-all ${
                    isActive
                      ? "border-cyan-100/35 bg-cyan-100/18 text-white shadow-[0_8px_18px_rgba(56,189,248,0.16)]"
                      : "border-white/10 bg-water-950/18 text-water-200/75 hover:bg-white/10 hover:text-white"
                  }`}
                  aria-pressed={isActive}
                >
                  <Icon className="h-3.5 w-3.5" strokeWidth={2.6} />
                  {label}
                </button>
              );
            })}
          </div>

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
            {QUICK_AMOUNTS.map((item, index) => (
              <button
                key={item.amount}
                type="button"
                onClick={() => handleAddDrink(item.amount)}
                className="group relative flex min-h-[6rem] flex-col items-center justify-center gap-2 overflow-hidden rounded-[1rem] border border-white/10 bg-white/5 px-2 py-3 shadow-[0_8px_16px_rgba(0,0,0,0.14),inset_0_1px_1px_rgba(255,255,255,0.1)] backdrop-blur-lg transition-all duration-300 hover:-translate-y-1 hover:border-white/20 hover:bg-white/10 hover:shadow-[0_12px_24px_rgba(56,189,248,0.18),inset_0_1px_2px_rgba(255,255,255,0.2)] active:scale-[0.97]"
                aria-label={`Add ${item.amount} milliliters as ${getNoteLabel(selectedNote)}`}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                <div
                  className="pointer-events-none absolute inset-y-[-14%] -left-[120%] w-[205%] rotate-[14deg] bg-[linear-gradient(90deg,rgba(255,255,255,0),rgba(255,255,255,0.14),rgba(255,255,255,0.38),rgba(255,255,255,0.14),rgba(255,255,255,0))] opacity-0 blur-[4px] animate-[quick-add-shimmer_15s_linear_infinite]"
                  style={{ animationDelay: SHIMMER_DELAYS[index] }}
                />
                <div className="relative z-10 flex items-center gap-1.5 text-water-200 transition-colors duration-300 group-hover:text-white">
                  <item.Icon className="h-5 w-5 drop-shadow-md" />
                  <span className="font-ui text-[10px] font-extrabold uppercase tracking-[0.14em]">{item.label}</span>
                </div>
                <span className="font-numeric relative z-10 mt-1 text-[1.35rem] font-black text-white drop-shadow-lg transition-transform duration-300 group-hover:scale-105">
                  {item.amount}
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
                <span className="font-ui block text-xs font-black uppercase tracking-[0.18em] text-water-300/85">Custom</span>
                <span className="font-body mt-1 block text-xs font-semibold text-water-300/70">Your saved quick amount</span>
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
              aria-label="Edit custom quick add amount"
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

          {isResetConfirming && (
            <div className="flex items-center justify-between rounded-2xl border border-rose-200/20 bg-rose-500/12 px-4 py-3 text-sm text-rose-50">
              <span className="font-body font-semibold">Tap check again to reset today.</span>
              <button
                type="button"
                onClick={() => setIsResetConfirming(false)}
                className="rounded-full p-1 text-rose-100/80 transition-colors hover:bg-white/10 hover:text-white"
                aria-label="Cancel reset"
                title="Cancel reset"
              >
                <X className="h-4 w-4" strokeWidth={2.5} />
              </button>
            </div>
          )}

          {latestLog.length > 0 && (
            <div className="rounded-[1.15rem] border border-white/10 bg-water-950/22 px-4 py-3 backdrop-blur-md">
              <div className="mb-2 flex items-center justify-between">
                <p className="font-ui text-[0.68rem] font-black uppercase tracking-[0.2em] text-water-300/82">Recent</p>
                <p className="font-body text-xs font-semibold text-water-300/70">{drinkLog.length} actions</p>
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
        </section>
      </div>

      <NumberPickerDialog
        isOpen={isCustomQuickOpen}
        value={quickAddAmount}
        min={50}
        max={5000}
        title="Custom Quick Add"
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

      <style
        dangerouslySetInnerHTML={{
          __html: `
            @keyframes quick-add-shimmer {
              0%, 8%, 100% {
                transform: translateX(-150%) rotate(14deg);
                opacity: 0;
              }
              10% {
                opacity: 0.3;
              }
              15% {
                transform: translateX(135%) rotate(14deg);
                opacity: 0.62;
              }
              17% {
                opacity: 0;
              }
            }
          `,
        }}
      />
    </main>
  );
}
