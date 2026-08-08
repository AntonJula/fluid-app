"use client";

import React from "react";
import { createPortal } from "react-dom";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import {
  Clock3,
  Coffee,
  Droplets,
  Dumbbell,
  Leaf,
  Pause,
  Play,
  SlidersHorizontal,
  Square,
  X,
} from "lucide-react";

gsap.registerPlugin(useGSAP);

export type OccasionalDrink = "coffee" | "tea";

type DrinkTypeBarProps = {
  activeDrink: "water" | OccasionalDrink;
  onSelectWater: () => void;
  onSelectOccasionalDrink: (drink: OccasionalDrink) => void;
};

const DRINK_TYPES = [
  { value: "water", label: "Water", Icon: Droplets },
  { value: "coffee", label: "Coffee", Icon: Coffee },
  { value: "tea", label: "Tea", Icon: Leaf },
] as const;

export function DrinkTypeBar({
  activeDrink,
  onSelectWater,
  onSelectOccasionalDrink,
}: DrinkTypeBarProps) {
  const gridTemplateColumns =
    activeDrink === "coffee"
      ? "0.92fr 1.16fr 0.92fr"
      : activeDrink === "tea"
        ? "0.92fr 0.92fr 1.16fr"
        : "1.16fr 0.92fr 0.92fr";

  return (
    <div
      className="grid grid-flow-dense gap-1.5 rounded-[1.15rem] border border-cyan-100/14 bg-water-950/24 p-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-xl transition-[grid-template-columns] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]"
      style={{ gridTemplateColumns }}
      aria-label="Choose drink type"
    >
      {DRINK_TYPES.map(({ value, label, Icon }) => {
        const isActive = activeDrink === value;

        return (
          <button
            key={value}
            type="button"
            onClick={() => {
              if (value === "water") {
                onSelectWater();
                return;
              }

              onSelectOccasionalDrink(value);
            }}
            aria-label={value === "water" ? "Use water for quick add" : `Log one ${label.toLowerCase()}`}
            aria-pressed={isActive}
            className={`group relative flex min-h-12 min-w-0 items-center justify-center gap-2 overflow-hidden rounded-[0.9rem] border px-2 py-2.5 font-ui text-xs font-black transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] active:scale-[0.96] ${
              isActive
                ? "border-cyan-100/28 bg-cyan-100/14 text-white shadow-[0_8px_22px_rgba(34,211,238,0.12),inset_0_1px_0_rgba(255,255,255,0.12)]"
                : "border-transparent bg-white/[0.025] text-water-200/72 hover:border-cyan-100/16 hover:bg-white/[0.07] hover:text-white"
            }`}
          >
            <span
              className={`pointer-events-none absolute inset-x-4 top-0 h-px bg-gradient-to-r from-transparent via-cyan-100/70 to-transparent transition-opacity duration-500 ${
                isActive ? "opacity-100" : "opacity-0"
              }`}
            />
            <Icon
              className={`h-4 w-4 shrink-0 transition-transform duration-700 ease-out group-hover:scale-110 ${
                isActive ? "text-cyan-50" : "text-water-300/78"
              }`}
              strokeWidth={2.6}
            />
            <span className="min-w-0 truncate">{label}</span>
          </button>
        );
      })}
    </div>
  );
}

type DrinkAmountSheetProps = {
  drink: OccasionalDrink | null;
  onChooseAmount: (amount: number) => void;
  onChooseCustom: () => void;
  onClose: () => void;
};

const DRINK_AMOUNTS = [
  { amount: 150, label: "Small" },
  { amount: 250, label: "Cup" },
  { amount: 330, label: "Large" },
] as const;

export function DrinkAmountSheet({
  drink,
  onChooseAmount,
  onChooseCustom,
  onClose,
}: DrinkAmountSheetProps) {
  if (!drink || typeof document === "undefined") return null;

  return createPortal(
    <DrinkAmountSheetContent
      drink={drink}
      onChooseAmount={onChooseAmount}
      onChooseCustom={onChooseCustom}
      onClose={onClose}
    />,
    document.body
  );
}

function DrinkAmountSheetContent({
  drink,
  onChooseAmount,
  onChooseCustom,
  onClose,
}: Omit<DrinkAmountSheetProps, "drink"> & { drink: OccasionalDrink }) {
  const scope = React.useRef<HTMLDivElement>(null);
  const card = React.useRef<HTMLElement>(null);
  const DrinkIcon = drink === "coffee" ? Coffee : Leaf;
  const label = drink === "coffee" ? "Coffee" : "Tea";

  useGSAP(
    () => {
      if (!card.current || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

      gsap.fromTo(
        card.current,
        { y: 42, scale: 0.96 },
        { y: 0, scale: 1, duration: 0.48, ease: "power3.out", clearProps: "transform" }
      );
    },
    { scope }
  );

  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div
      ref={scope}
      className="fluid-modal-backdrop fixed inset-0 z-[160] flex items-end justify-center px-3 pb-[max(0.85rem,env(safe-area-inset-bottom))] pt-6"
      data-swipe-ignore="true"
      onClick={onClose}
    >
      <section
        ref={card}
        role="dialog"
        aria-modal="true"
        aria-labelledby="drink-amount-title"
        className="fluid-glass-soft w-full max-w-[25.5rem] overflow-hidden rounded-[1.7rem] border border-[1.5px] border-cyan-100/18 bg-water-950/96 shadow-[0_24px_64px_rgba(1,31,47,0.42)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-cyan-100/12 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-[0.95rem] border border-cyan-100/18 bg-cyan-100/10 text-cyan-50">
              <DrinkIcon className="h-5 w-5" strokeWidth={2.5} />
            </div>
            <div>
              <p className="font-ui text-[0.65rem] font-black uppercase tracking-[0.18em] text-water-300/72">
                One-time drink
              </p>
              <h2 id="drink-amount-title" className="font-ui mt-1 text-xl font-black text-white">
                How much {label.toLowerCase()}?
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full text-water-200/72 transition-colors hover:bg-white/10 hover:text-white active:scale-95"
            aria-label={`Cancel ${label.toLowerCase()} log`}
          >
            <X className="h-5 w-5" strokeWidth={2.5} />
          </button>
        </div>

        <div className="p-4">
          <div className="grid grid-flow-dense grid-cols-3 gap-2.5">
            {DRINK_AMOUNTS.map(({ amount, label: amountLabel }) => (
              <button
                key={amount}
                type="button"
                onClick={() => onChooseAmount(amount)}
                className="group relative min-h-[6.25rem] overflow-hidden rounded-[1.1rem] border border-cyan-100/14 bg-white/[0.05] px-2.5 py-3 text-center transition-all duration-500 ease-out hover:-translate-y-1 hover:border-cyan-100/30 hover:bg-cyan-100/10 active:scale-[0.97]"
                aria-label={`Log ${amount} milliliters of ${label.toLowerCase()}`}
              >
                <span className="pointer-events-none absolute inset-x-3 top-0 h-px bg-gradient-to-r from-transparent via-white/55 to-transparent" />
                <span className="font-ui block text-[0.65rem] font-black uppercase tracking-[0.16em] text-water-300/68">
                  {amountLabel}
                </span>
                <span className="font-numeric mt-2 block text-2xl font-black text-white transition-transform duration-700 ease-out group-hover:scale-105">
                  {amount}
                </span>
                <span className="font-ui mt-1 block text-[0.68rem] font-bold text-water-300/70">ml</span>
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={onChooseCustom}
            className="font-ui relative mt-3 flex min-h-12 w-full items-center justify-center gap-2 overflow-hidden rounded-[1rem] border border-white/55 bg-white/[0.075] px-4 py-3 text-xs font-black text-white shadow-[0_0_0_1px_rgba(255,255,255,0.08),0_0_24px_rgba(186,230,253,0.16),inset_0_1px_0_rgba(255,255,255,0.18)] transition-all duration-300 hover:-translate-y-0.5 hover:border-white/80 hover:bg-white/[0.12] hover:shadow-[0_0_0_1px_rgba(255,255,255,0.14),0_0_30px_rgba(186,230,253,0.25),inset_0_1px_0_rgba(255,255,255,0.24)] active:scale-[0.98]"
          >
            <span className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-white to-transparent" />
            <SlidersHorizontal className="relative h-4 w-4 text-cyan-50" strokeWidth={2.5} />
            <span className="relative">Custom amount</span>
          </button>
        </div>
      </section>
    </div>
  );
}

type WorkoutSetupSheetProps = {
  isOpen: boolean;
  onStart: (durationMinutes: number) => void;
  onClose: () => void;
};

const WORKOUT_DURATIONS = [30, 60, 90] as const;

export function WorkoutSetupSheet({
  isOpen,
  onStart,
  onClose,
}: WorkoutSetupSheetProps) {
  if (!isOpen || typeof document === "undefined") return null;

  return createPortal(
    <WorkoutSetupSheetContent onStart={onStart} onClose={onClose} />,
    document.body
  );
}

function WorkoutSetupSheetContent({
  onStart,
  onClose,
}: Omit<WorkoutSetupSheetProps, "isOpen">) {
  const scope = React.useRef<HTMLDivElement>(null);
  const card = React.useRef<HTMLElement>(null);

  useGSAP(
    () => {
      if (!card.current || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

      gsap.fromTo(
        card.current,
        { y: 42, scale: 0.96 },
        { y: 0, scale: 1, duration: 0.48, ease: "power3.out", clearProps: "transform" }
      );
    },
    { scope }
  );

  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div
      ref={scope}
      className="fluid-modal-backdrop fixed inset-0 z-[160] flex items-end justify-center px-3 pb-[max(0.85rem,env(safe-area-inset-bottom))] pt-6"
      data-swipe-ignore="true"
      onClick={onClose}
    >
      <section
        ref={card}
        role="dialog"
        aria-modal="true"
        aria-labelledby="workout-setup-title"
        className="fluid-glass-soft w-full max-w-[25.5rem] overflow-hidden rounded-[1.7rem] border border-[1.5px] border-emerald-100/18 bg-water-950/96 shadow-[0_24px_64px_rgba(1,31,47,0.42)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-emerald-100/12 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-[0.95rem] border border-emerald-100/18 bg-emerald-200/10 text-emerald-50">
              <Dumbbell className="h-5 w-5" strokeWidth={2.5} />
            </div>
            <div>
              <p className="font-ui text-[0.65rem] font-black uppercase tracking-[0.18em] text-emerald-200/70">
                Workout hydration
              </p>
              <h2 id="workout-setup-title" className="font-ui mt-1 text-xl font-black text-white">
                Choose session length
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full text-water-200/72 transition-colors hover:bg-white/10 hover:text-white active:scale-95"
            aria-label="Close workout setup"
          >
            <X className="h-5 w-5" strokeWidth={2.5} />
          </button>
        </div>

        <div className="p-4">
          <p className="font-body mb-4 text-sm font-semibold leading-relaxed text-water-200/74">
            Sip checks stay gentle and stop automatically when the session ends.
          </p>
          <div className="grid grid-flow-dense grid-cols-3 gap-2.5">
            {WORKOUT_DURATIONS.map((duration) => (
              <button
                key={duration}
                type="button"
                onClick={() => onStart(duration)}
                className="group relative min-h-[6rem] overflow-hidden rounded-[1.1rem] border border-emerald-100/14 bg-emerald-300/[0.065] px-2 py-3 text-center transition-all duration-500 ease-out hover:-translate-y-1 hover:border-emerald-100/30 hover:bg-emerald-300/12 active:scale-[0.97]"
                aria-label={`Start a ${duration} minute workout hydration session`}
              >
                <Clock3 className="mx-auto h-5 w-5 text-emerald-100/78 transition-transform duration-700 ease-out group-hover:scale-110" strokeWidth={2.4} />
                <span className="font-numeric mt-2 block text-2xl font-black text-white">{duration}</span>
                <span className="font-ui mt-1 block text-[0.66rem] font-black uppercase tracking-[0.14em] text-emerald-100/68">
                  minutes
                </span>
              </button>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

type WorkoutHydrationCardProps = {
  status: "idle" | "active" | "paused";
  durationMinutes: number;
  remainingMs: number;
  progress: number;
  reminderCopy: string;
  canEnableNotifications: boolean;
  onOpenSetup: () => void;
  onAddDrink: (amount: number) => void;
  onPause: () => void;
  onResume: () => void;
  onEnd: () => void;
  onEnableNotifications: () => void;
};

function formatRemainingTime(remainingMs: number) {
  const totalSeconds = Math.max(0, Math.ceil(remainingMs / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export function WorkoutHydrationCard({
  status,
  durationMinutes,
  remainingMs,
  progress,
  reminderCopy,
  canEnableNotifications,
  onOpenSetup,
  onAddDrink,
  onPause,
  onResume,
  onEnd,
  onEnableNotifications,
}: WorkoutHydrationCardProps) {
  const scope = React.useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (!scope.current || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

      gsap.fromTo(
        scope.current,
        { y: 18, scale: 0.975 },
        { y: 0, scale: 1, duration: 0.52, ease: "power3.out", clearProps: "transform" }
      );
    },
    { scope, dependencies: [status], revertOnUpdate: true }
  );

  if (status === "idle") {
    return (
      <div ref={scope}>
        <button
          type="button"
          onClick={onOpenSetup}
          className="group relative flex min-h-[4.75rem] w-full items-center gap-3 overflow-hidden rounded-[1.15rem] border border-emerald-100/14 bg-gradient-to-r from-emerald-300/[0.075] via-cyan-300/[0.045] to-water-950/16 px-3.5 py-3 text-left transition-all duration-500 ease-out hover:-translate-y-0.5 hover:border-emerald-100/26 hover:bg-emerald-300/10 active:scale-[0.98]"
          aria-label="Start workout hydration mode"
        >
          <span className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-emerald-100/52 to-transparent" />
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[0.95rem] border border-emerald-100/18 bg-emerald-200/10 text-emerald-50 transition-transform duration-700 ease-out group-hover:scale-105">
            <Dumbbell className="h-5 w-5" strokeWidth={2.5} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="font-ui block text-sm font-black text-white">Workout hydration</span>
            <span className="font-body mt-0.5 block text-xs font-semibold text-water-200/66">
              Timed sip checks with simple controls.
            </span>
          </span>
          <span className="font-ui rounded-full border border-emerald-100/18 bg-emerald-200/10 px-3 py-2 text-[0.67rem] font-black uppercase tracking-[0.12em] text-emerald-50 transition-colors group-hover:bg-emerald-200/16">
            Start
          </span>
        </button>
      </div>
    );
  }

  const isPaused = status === "paused";

  return (
    <div
      ref={scope}
      className="relative overflow-hidden rounded-[1.3rem] border border-emerald-100/18 bg-gradient-to-br from-emerald-300/12 via-cyan-300/[0.07] to-water-950/18 p-3.5 shadow-[0_16px_34px_rgba(5,92,92,0.16),inset_0_1px_0_rgba(255,255,255,0.12)] backdrop-blur-xl"
      data-workout-status={status}
    >
      <span className="pointer-events-none absolute -right-12 -top-16 h-32 w-32 rounded-full bg-emerald-200/10 blur-3xl" />
      <div className="relative z-10 flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[0.95rem] border border-emerald-100/20 bg-emerald-200/12 text-emerald-50">
          {isPaused ? <Pause className="h-5 w-5" strokeWidth={2.5} /> : <Dumbbell className="h-5 w-5" strokeWidth={2.5} />}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="font-ui text-[0.64rem] font-black uppercase tracking-[0.16em] text-emerald-100/70">
                {isPaused ? "Session paused" : "Workout in flow"}
              </p>
              <p className="font-numeric mt-1 text-2xl font-black leading-none text-white">
                {formatRemainingTime(remainingMs)}
              </p>
            </div>
            <span className="font-ui shrink-0 rounded-full border border-emerald-100/16 bg-water-950/18 px-2.5 py-1.5 text-[0.65rem] font-black text-emerald-100/80">
              {durationMinutes} min
            </span>
          </div>
          <p className="font-body mt-2 text-xs font-semibold leading-relaxed text-water-200/70">
            {reminderCopy}
          </p>
        </div>
      </div>

      <div className="relative z-10 mt-3 h-2 overflow-hidden rounded-full bg-water-950/38">
        <div
          className="h-full rounded-full bg-gradient-to-r from-emerald-300 via-cyan-200 to-cyan-100 transition-[width] duration-1000 ease-linear shadow-[0_0_14px_rgba(110,231,183,0.32)]"
          style={{ width: `${Math.max(3, Math.min(100, progress * 100))}%` }}
        />
      </div>

      <div className="relative z-10 mt-3 grid grid-flow-dense grid-cols-2 gap-2">
        {[150, 250].map((amount) => (
          <button
            key={amount}
            type="button"
            onClick={() => onAddDrink(amount)}
            className="font-ui min-h-11 rounded-[0.9rem] border border-cyan-100/16 bg-cyan-100/[0.075] px-3 py-2 text-xs font-black text-cyan-50 transition-all duration-300 hover:border-cyan-100/26 hover:bg-cyan-100/13 active:scale-[0.97]"
          >
            +{amount} ml
          </button>
        ))}
      </div>

      <div className="relative z-10 mt-2 grid grid-flow-dense grid-cols-2 gap-2">
        <button
          type="button"
          onClick={isPaused ? onResume : onPause}
          className="font-ui flex min-h-11 items-center justify-center gap-2 rounded-[0.9rem] border border-water-300/14 bg-water-950/20 px-3 py-2 text-xs font-black text-water-100 transition-colors hover:bg-white/[0.07] hover:text-white active:scale-[0.97]"
        >
          {isPaused ? <Play className="h-4 w-4" strokeWidth={2.5} /> : <Pause className="h-4 w-4" strokeWidth={2.5} />}
          {isPaused ? "Resume" : "Pause"}
        </button>
        <button
          type="button"
          onClick={onEnd}
          className="font-ui flex min-h-11 items-center justify-center gap-2 rounded-[0.9rem] border border-rose-200/14 bg-rose-400/[0.065] px-3 py-2 text-xs font-black text-rose-50 transition-colors hover:bg-rose-400/12 active:scale-[0.97]"
        >
          <Square className="h-3.5 w-3.5" strokeWidth={2.5} />
          End
        </button>
      </div>

      {canEnableNotifications && (
        <button
          type="button"
          onClick={onEnableNotifications}
          className="font-ui relative z-10 mt-2 min-h-10 w-full rounded-[0.85rem] border border-emerald-100/14 bg-emerald-200/[0.065] px-3 py-2 text-[0.67rem] font-black uppercase tracking-[0.1em] text-emerald-50 transition-colors hover:bg-emerald-200/12 active:scale-[0.98]"
        >
          Enable optional sip checks
        </button>
      )}
    </div>
  );
}
