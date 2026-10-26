import type {
  GlyphState,
  Letter,
  Reading,
  ReadingsFile,
  Variant,
} from "./types";

const VARIANTS: Variant[] = ["works", "broken", "lens"];
const TRUTHS = ["pass", "fail"];
const VERDICTS = ["passed", "failed", "blocked"];

function isString(value: unknown): value is string {
  return typeof value === "string";
}

function parseReading(raw: unknown): Reading | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  if (
    !isString(r.letterId) ||
    !VARIANTS.includes(r.variant as Variant) ||
    !TRUTHS.includes(r.truth as string) ||
    !VERDICTS.includes(r.verdict as string)
  ) {
    return null;
  }
  return {
    letterId: r.letterId,
    variant: r.variant as Variant,
    truth: r.truth as Reading["truth"],
    verdict: r.verdict as Reading["verdict"],
    testId: isString(r.testId) ? r.testId : "",
    runId: isString(r.runId) ? r.runId : "",
    reason: isString(r.reason) ? r.reason : "",
    screenshot: isString(r.screenshot) && r.screenshot ? r.screenshot : null,
  };
}

export function parseReadings(raw: unknown): ReadingsFile | null {
  if (!raw || typeof raw !== "object") return null;
  const f = raw as Record<string, unknown>;
  if (!Array.isArray(f.results)) return null;
  const results = f.results
    .map(parseReading)
    .filter((r): r is Reading => r !== null);
  return {
    takenAt: isString(f.takenAt) ? f.takenAt : "",
    commit: isString(f.commit) ? f.commit : "",
    engine: isString(f.engine) ? f.engine : "",
    projectId: isString(f.projectId) ? f.projectId : "",
    results,
  };
}

export function isCorrect(reading: Reading): boolean {
  return (
    (reading.truth === "pass" && reading.verdict === "passed") ||
    (reading.truth === "fail" && reading.verdict === "failed")
  );
}

export function findReading(
  results: Reading[],
  letterId: string,
  variant: Variant,
): Reading | null {
  let found: Reading | null = null;
  for (const r of results) {
    if (r.letterId === letterId && r.variant === variant) found = r;
  }
  return found;
}

export function letterState(
  letter: Pick<Letter, "id">,
  results: Reading[],
  lensOn = false,
): GlyphState {
  const lens = lensOn ? findReading(results, letter.id, "lens") : null;
  const variants: Variant[] = !lens
    ? ["works", "broken"]
    : lens.truth === "pass"
      ? ["lens", "broken"]
      : ["works", "lens"];
  const readings = variants.map((v) => findReading(results, letter.id, v));
  if (readings.some((r) => r && r.verdict !== "blocked" && !isCorrect(r))) {
    return "misread";
  }
  if (readings.some((r) => r?.verdict === "blocked")) return "blocked";
  if (readings.some((r) => r === null)) return "unread";
  return "read";
}

export const STATE_WORDS: Record<GlyphState, string> = {
  read: "Read correctly",
  misread: "Misread",
  blocked: "Blocked",
  unread: "Not read yet",
};

const READINGS_URL = `${import.meta.env.BASE_URL}readings/latest.json`;
let cache: Promise<ReadingsFile | null> | null = null;

export function loadReadings(): Promise<ReadingsFile | null> {
  cache ??= fetch(READINGS_URL, { cache: "no-cache" })
    .then((res) => (res.ok ? res.json() : null))
    .then(parseReadings)
    .catch(() => null);
  return cache;
}

export function resetReadingsCache(): void {
  cache = null;
}
