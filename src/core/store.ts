import { useSyncExternalStore } from "react";

export type View = "human" | "robot";

export interface UiState {
  view: View;
  ready: boolean;
  paused: boolean;
  compare: boolean;
}

const PAUSE_KEY = "eye-chart-paused";

function readPaused(): boolean {
  try {
    return window.sessionStorage.getItem(PAUSE_KEY) === "1";
  } catch {
    return false;
  }
}

let state: UiState = { view: "human", ready: false, paused: readPaused(), compare: false };
const listeners = new Set<() => void>();

function set(patch: Partial<UiState>) {
  const next = { ...state, ...patch };
  if (
    next.view === state.view &&
    next.ready === state.ready &&
    next.paused === state.paused &&
    next.compare === state.compare
  ) {
    return;
  }
  state = next;
  listeners.forEach((l) => l());
}

export const ui = {
  get: () => state,
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  setView: (view: View) => set({ view, ready: false }),
  setReady: (ready: boolean) => set({ ready }),
  setCompare: (compare: boolean) => set({ compare }),
  setPaused(paused: boolean) {
    try {
      window.sessionStorage.setItem(PAUSE_KEY, paused ? "1" : "0");
    } catch {
      return set({ paused });
    }
    set({ paused });
  },
  reset() {
    state = { view: "human", ready: false, paused: false, compare: false };
    listeners.forEach((l) => l());
  },
};

export function useUi(): UiState {
  return useSyncExternalStore(ui.subscribe, ui.get, ui.get);
}

export function isStill(): boolean {
  if (typeof window === "undefined") return false;
  const { search, hash } = window.location;
  const q = hash.includes("?") ? hash.slice(hash.indexOf("?")) : "";
  return new URLSearchParams(search).get("still") === "1" || new URLSearchParams(q).get("still") === "1";
}
