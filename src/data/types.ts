import type { ComponentType } from "react";

export type Variant = "works" | "broken" | "lens" | "lens-broken";

export interface Lens {
  name: string;
  summary: string;
  diff: string;
}

export interface Letter {
  id: string;
  row: number;
  glyph: string;
  name: string;
  trap: string;
  howToUse: string;
  brokenBehaviour: string;
  lens?: Lens;
  Component: ComponentType<{ variant: Variant }>;
}

export type Truth = "pass" | "fail";
export type Verdict = "passed" | "failed" | "blocked";

export interface Reading {
  letterId: string;
  variant: Variant;
  truth: Truth;
  verdict: Verdict;
  testId: string;
  runId: string;
  reason: string;
  screenshot: string | null;
}

export interface ReadingsFile {
  takenAt: string;
  commit: string;
  engine: string;
  projectId: string;
  results: Reading[];
}

export type GlyphState = "read" | "misread" | "blocked" | "unread";
