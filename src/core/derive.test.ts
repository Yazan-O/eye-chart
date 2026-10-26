import { describe, expect, it } from "vitest";
import { letterView, markFor, stateWord } from "./derive";
import type { Reading } from "../data/types";

const r = (
  variant: Reading["variant"],
  truth: Reading["truth"],
  verdict: Reading["verdict"],
): Reading => ({ letterId: "a", variant, truth, verdict, testId: "", runId: "", reason: "", screenshot: null });

describe("letterView and markFor", () => {
  it("gives every letter not read yet with no readings", () => {
    const v = letterView("a", []);
    expect(v).toEqual({ id: "a", state: "unread", lens: "none" });
    expect(markFor(v.state, v.lens, false).mark).toBe("none");
    expect(stateWord(v.state, v.lens, false)).toBe("not read yet");
  });

  it("gives read with a glow and a bar", () => {
    const v = letterView("a", [r("works", "pass", "passed"), r("broken", "fail", "failed")]);
    expect(v.state).toBe("read");
    expect(markFor(v.state, v.lens, false)).toEqual({ focus: 0, ghost: 0, glow: 1, mark: "bar" });
  });

  it("gives misread a ghost and a slash, never blur", () => {
    const v = letterView("a", [r("works", "pass", "failed"), r("broken", "fail", "failed")]);
    expect(v.state).toBe("misread");
    expect(markFor(v.state, v.lens, false)).toEqual({ focus: 0, ghost: 1, glow: 0, mark: "slash" });
  });

  it("gives blocked a hatch", () => {
    const v = letterView("a", [r("works", "pass", "blocked"), r("broken", "fail", "failed")]);
    expect(v.state).toBe("blocked");
    expect(markFor(v.state, v.lens, false).mark).toBe("hatch");
  });

  it("fuses a misread letter when its recorded lens reading is correct and the lens is on", () => {
    const rows = [r("works", "pass", "failed"), r("broken", "fail", "failed"), r("lens", "pass", "passed")];
    const v = letterView("a", rows);
    expect(v.lens).toBe("fixed");
    expect(markFor(v.state, v.lens, true)).toEqual({ focus: 0, ghost: 0, glow: 0, mark: "tick" });
    expect(stateWord(v.state, v.lens, true)).toBe("fixed with lens");
    expect(markFor(v.state, v.lens, false).mark).toBe("slash");
  });

  it("keeps the slash when the recorded lens reading is still wrong", () => {
    const rows = [r("works", "pass", "failed"), r("broken", "fail", "failed"), r("lens", "pass", "failed")];
    const v = letterView("a", rows);
    expect(v.lens).toBe("notFixed");
    expect(markFor(v.state, v.lens, true).mark).toBe("slash");
    expect(stateWord(v.state, v.lens, true)).toBe("still misread with lens");
  });
});
