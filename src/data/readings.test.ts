import { describe, expect, it } from "vitest";
import { buildRows } from "./chart";
import { letterState, parseReadings } from "./readings";
import type { Reading } from "./types";

const r = (variant: Reading["variant"], truth: Reading["truth"], verdict: Reading["verdict"]): Reading => ({
  letterId: "a",
  variant,
  truth,
  verdict,
  testId: "",
  runId: "",
  reason: "",
  screenshot: null,
});

describe("letterState", () => {
  it("is unread with no readings or only one twin read", () => {
    expect(letterState({ id: "a" }, [])).toBe("unread");
    expect(letterState({ id: "a" }, [r("works", "pass", "passed")])).toBe("unread");
  });

  it("is read when both twins are judged correctly", () => {
    expect(
      letterState({ id: "a" }, [r("works", "pass", "passed"), r("broken", "fail", "failed")]),
    ).toBe("read");
  });

  it("is misread when either twin is judged wrongly", () => {
    expect(letterState({ id: "a" }, [r("broken", "fail", "passed")])).toBe("misread");
    expect(
      letterState({ id: "a" }, [r("works", "pass", "failed"), r("broken", "fail", "failed")]),
    ).toBe("misread");
  });

  it("is blocked when a twin could not be tested", () => {
    expect(
      letterState({ id: "a" }, [r("works", "pass", "blocked"), r("broken", "fail", "failed")]),
    ).toBe("blocked");
  });

  it("uses the lens reading in place of the broken twin when the lens is on", () => {
    const results = [
      r("works", "pass", "passed"),
      r("broken", "fail", "passed"),
      r("lens", "fail", "failed"),
    ];
    expect(letterState({ id: "a" }, results)).toBe("misread");
    expect(letterState({ id: "a" }, results, true)).toBe("read");
  });
});

describe("parseReadings", () => {
  it("rejects files without a results list", () => {
    expect(parseReadings(null)).toBeNull();
    expect(parseReadings({ takenAt: "x" })).toBeNull();
  });

  it("drops malformed results and keeps verbatim reasons", () => {
    const file = parseReadings({
      takenAt: "2026-10-26T15:00:00Z",
      results: [
        { letterId: "a", variant: "works", truth: "pass", verdict: "passed", reason: "Clicked it." },
        { letterId: "b", variant: "works", truth: "maybe", verdict: "passed" },
      ],
    });
    expect(file?.results).toHaveLength(1);
    expect(file?.results[0]?.reason).toBe("Clicked it.");
    expect(file?.results[0]?.screenshot).toBeNull();
  });
});

describe("buildRows", () => {
  it("groups letters by row in order and assigns Snellen fractions", () => {
    const base = { trap: "", howToUse: "", brokenBehaviour: "", Component: () => null };
    const rows = buildRows(
      [
        { ...base, id: "x", row: 3, glyph: "X", name: "X" },
        { ...base, id: "y", row: 1, glyph: "Y", name: "Y" },
        { ...base, id: "z", row: 3, glyph: "Z", name: "Z" },
      ],
      [],
    );
    expect(rows.map((row) => row.fraction)).toEqual(["20/200", "20/100"]);
    expect(rows[1]?.glyphs.map((g) => g.id)).toEqual(["x", "z"]);
  });
});
