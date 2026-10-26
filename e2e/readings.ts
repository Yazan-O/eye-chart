import { readFileSync } from "node:fs";

export type State = "read" | "misread" | "blocked" | "unread";

export interface Reading {
  letterId: string;
  variant: string;
  truth: "pass" | "fail";
  verdict: "passed" | "failed" | "blocked";
  reason?: string;
  screenshot?: string;
}

export const STATE_WORDS: Record<State, string> = {
  read: "Read correctly",
  misread: "Misread",
  blocked: "Blocked",
  unread: "Not read yet",
};

export const TRUTH_WORDS = { pass: "Should pass", fail: "Should fail" } as const;
export const VERDICT_WORDS = { passed: "Passed", failed: "Failed", blocked: "Blocked" } as const;

const file = JSON.parse(readFileSync(new URL("../public/readings/latest.json", import.meta.url), "utf8")) as {
  results: Reading[];
};

export const results = file.results;

export const letterIds = [
  ...new Set(results.filter((r) => r.variant === "works" || r.variant === "broken").map((r) => r.letterId)),
];

export function find(id: string, variant: string): Reading | null {
  let found: Reading | null = null;
  for (const r of results) if (r.letterId === id && r.variant === variant) found = r;
  return found;
}

function correct(r: Reading): boolean {
  return (r.truth === "pass" && r.verdict === "passed") || (r.truth === "fail" && r.verdict === "failed");
}

export function stateOf(id: string, lensOn = false): State {
  const lens = lensOn ? find(id, "lens") : null;
  const lensBroken = lensOn ? find(id, "lens-broken") : null;
  const pair = [
    lens?.truth === "pass" ? lens : find(id, "works"),
    lensBroken ?? (lens?.truth === "fail" ? lens : find(id, "broken")),
  ];
  if (pair.some((r) => r && r.verdict !== "blocked" && !correct(r))) return "misread";
  if (pair.some((r) => r?.verdict === "blocked")) return "blocked";
  if (pair.some((r) => r === null)) return "unread";
  return "read";
}
