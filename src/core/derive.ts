import { findReading, letterState } from "../data/readings";
import type { GlyphState, Reading } from "../data/types";

export type LensResult = "none" | "fixed" | "notFixed";

export interface Mark {
  focus: number;
  ghost: number;
  glow: number;
  mark: "none" | "slash" | "hatch" | "tick" | "bar";
}

export interface LetterView {
  id: string;
  state: GlyphState;
  lens: LensResult;
}

export function lensResult(letterId: string, results: Reading[]): LensResult {
  const lenses = [findReading(results, letterId, "lens"), findReading(results, letterId, "lens-broken")];
  if (!lenses.some((r) => r && r.verdict !== "blocked")) return "none";
  return letterState({ id: letterId }, results, true) === "read" ? "fixed" : "notFixed";
}

export function letterView(letterId: string, results: Reading[]): LetterView {
  return {
    id: letterId,
    state: letterState({ id: letterId }, results),
    lens: lensResult(letterId, results),
  };
}

export function markFor(state: GlyphState, lens: LensResult, lensOn: boolean): Mark {
  if (lensOn && lens === "fixed" && (state === "misread" || state === "blocked")) {
    return { focus: 0, ghost: 0, glow: 0, mark: "tick" };
  }
  if (state === "misread") {
    return { focus: 0, ghost: 1, glow: 0, mark: "slash" };
  }
  if (state === "read") return { focus: 0, ghost: 0, glow: 1, mark: "bar" };
  if (state === "blocked") return { focus: 0, ghost: 0, glow: 0, mark: "hatch" };
  return { focus: 0, ghost: 0, glow: 0, mark: "none" };
}

export function stateWord(state: GlyphState, lens: LensResult, lensOn: boolean): string {
  if ((state === "misread" || state === "blocked") && lensOn && lens === "fixed") return "fixed with lens";
  if ((state === "misread" || state === "blocked") && lensOn && lens === "notFixed") {
    return "still misread with lens";
  }
  return { read: "read", misread: "misread", blocked: "blocked", unread: "not read yet" }[state];
}
