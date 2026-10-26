export type Variant = "works" | "broken" | "lens" | "lens-broken";

export interface LetterProps {
  variant: Variant;
}

export function isBroken(v: Variant) {
  return v === "broken" || v === "lens-broken";
}

export function hasLens(v: Variant) {
  return v === "lens" || v === "lens-broken";
}
