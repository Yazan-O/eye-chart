import { ui } from "../core/store";

export const OVERLAY = "data-agent-overlay";
const CLOSE_MS = 180;
const OPEN_MS = 240;

export type Shutter = "idle" | "closing" | "opening";

let shutterSetter: ((s: Shutter) => void) | null = null;

export function registerShutter(fn: ((s: Shutter) => void) | null) {
  shutterSetter = fn;
}
let timers: number[] = [];

function later(fn: () => void, ms: number) {
  timers.push(window.setTimeout(fn, ms));
}

export function clearTimers() {
  timers.forEach((t) => window.clearTimeout(t));
  timers = [];
}

function stillNow(): boolean {
  return document.documentElement.dataset.motion === "paused";
}

export function enterSensor() {
  clearTimers();
  if (stillNow()) {
    ui.setView("robot");
    return;
  }
  shutterSetter?.("closing");
  later(() => {
    ui.setView("robot");
    shutterSetter?.("opening");
    later(() => shutterSetter?.("idle"), OPEN_MS);
  }, CLOSE_MS);
}

export function leaveSensor() {
  clearTimers();
  const back = () => {
    ui.setView("human");
    ui.setReady(true);
    document.querySelector<HTMLElement>('[data-testid="agent-toggle"]')?.focus();
  };
  if (stillNow()) {
    back();
    return;
  }
  shutterSetter?.("closing");
  later(() => {
    back();
    shutterSetter?.("opening");
    later(() => shutterSetter?.("idle"), OPEN_MS);
  }, CLOSE_MS);
}

export function toggleSensor() {
  if (ui.get().view === "robot") leaveSensor();
  else enterSensor();
}

