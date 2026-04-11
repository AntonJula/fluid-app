"use client";

import { useSyncExternalStore } from "react";

type SwipeUiState = {
  isDragging: boolean;
  isTransitioning: boolean;
  frozenPathname: string | null;
};

const DEFAULT_STATE: SwipeUiState = {
  isDragging: false,
  isTransitioning: false,
  frozenPathname: null,
};

let swipeUiState: SwipeUiState = DEFAULT_STATE;
const listeners = new Set<() => void>();

function emitChange() {
  listeners.forEach((listener) => listener());
}

function getSnapshot() {
  return swipeUiState;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function setSwipeUiState(nextState: Partial<SwipeUiState>) {
  const resolvedState = {
    ...swipeUiState,
    ...nextState,
  };

  if (
    resolvedState.isDragging === swipeUiState.isDragging &&
    resolvedState.isTransitioning === swipeUiState.isTransitioning &&
    resolvedState.frozenPathname === swipeUiState.frozenPathname
  ) {
    return;
  }

  swipeUiState = resolvedState;
  emitChange();
}

export function resetSwipeUiState() {
  swipeUiState = DEFAULT_STATE;
  emitChange();
}

export function useSwipeUiState() {
  return useSyncExternalStore(subscribe, getSnapshot, () => DEFAULT_STATE);
}
