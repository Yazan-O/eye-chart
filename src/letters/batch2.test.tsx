import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { drawnValue } from "./CanvasChart";
import ClippedLabel from "./ClippedLabel";
import CopyButton, { DEMO_CODE } from "./CopyButton";
import FrameResult from "./FrameResult";
import GhostText, { PLANTED_LINE, TICK_MS } from "./GhostText";
import IconStatus from "./IconStatus";
import PseudoChip from "./PseudoChip";
import { letters } from "./registry";
import ZeroWidthCode, { clean } from "./ZeroWidthCode";

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("registry", () => {
  it("holds 24 letters in rows of 1, 2, 3, 4, 4, 5, 5", () => {
    expect(letters).toHaveLength(24);
    const counts = [1, 2, 3, 4, 5, 6, 7].map((row) => letters.filter((l) => l.row === row).length);
    expect(counts).toEqual([1, 2, 3, 4, 4, 5, 5]);
  });
});

describe("copy button", () => {
  it.each([
    ["works", 1],
    ["broken", 0],
  ] as const)("%s twin writes to the clipboard %i times", async (variant, writes) => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("navigator", { clipboard: { writeText } });
    render(<CopyButton variant={variant} />);
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Copy" }));
    });
    expect(screen.getByRole("button", { name: "Copied!" })).toBeInTheDocument();
    expect(writeText).toHaveBeenCalledTimes(writes);
    if (writes) expect(writeText).toHaveBeenCalledWith(DEMO_CODE);
  });
});

describe("framed result", () => {
  it.each([
    ["works", "Approved"],
    ["broken", "Declined"],
  ] as const)("%s twin frame says %s while the page says Approved", (variant, inFrame) => {
    const { container } = render(<FrameResult variant={variant} />);
    fireEvent.click(screen.getByRole("button", { name: "Run check" }));
    expect(screen.getByText("Status: Approved")).toBeInTheDocument();
    const frame = container.querySelector("iframe");
    expect(frame?.getAttribute("sandbox")).toBe("");
    expect(frame?.getAttribute("srcdoc")).toContain(inFrame);
  });
});

describe("pseudo chip", () => {
  it.each([
    ["works", "Setup: 3 of 3 steps"],
    ["broken", "Setup: 2 of 3 steps"],
  ] as const)("%s twin shows %s with a CSS-drawn chip", (variant, text) => {
    const { container } = render(<PseudoChip variant={variant} />);
    expect(screen.getByText(text)).toBeInTheDocument();
    expect(container.textContent).not.toContain("Done");
  });
});

describe("canvas chart", () => {
  it("draws the 80% bar at 20% only in the broken twin", () => {
    expect(drawnValue(80, false)).toBe(80);
    expect(drawnValue(80, true)).toBe(20);
    expect(drawnValue(40, true)).toBe(40);
  });
});

describe("icon status", () => {
  it.each([
    ["works", 1],
    ["broken", 2],
  ] as const)("%s twin draws %i green ticks", (variant, ticks) => {
    const { container } = render(<IconStatus variant={variant} />);
    expect(container.querySelectorAll('circle[fill="#1f8f4e"]')).toHaveLength(ticks);
  });
});

describe("clipped label", () => {
  it("keeps the full sentence in the page and clips only the broken twin", () => {
    const { container, rerender } = render(<ClippedLabel variant="works" />);
    expect(container.querySelector(".letter-notice-clipped")).toBeNull();
    rerender(<ClippedLabel variant="broken" />);
    expect(container.querySelector(".letter-notice-clipped")).toHaveTextContent("Free trial ends today");
  });
});

describe("ghost text", () => {
  it.each([
    ["works", "Progress: 100%", true],
    ["broken", "Progress: 80%", false],
  ] as const)("%s twin settles at %s", (variant, text, complete) => {
    vi.useFakeTimers();
    const { container } = render(<GhostText variant={variant} />);
    fireEvent.click(screen.getByRole("button", { name: "Upload" }));
    act(() => {
      vi.advanceTimersByTime(TICK_MS * 12);
    });
    expect(screen.getByText(text)).toBeInTheDocument();
    expect(screen.queryByText("Upload complete") !== null).toBe(complete);
    expect(container.textContent?.includes(PLANTED_LINE)).toBe(!complete);
  });
});

describe("zero-width code", () => {
  it("cleans hidden characters", () => {
    expect(clean("TRIAL\u200B7")).toBe("TRIAL7");
  });

  it.each([
    ["works", "Trial: 7 days added"],
    ["broken", "Code not recognised"],
  ] as const)("%s twin given the shown code answers %s", (variant, text) => {
    render(<ZeroWidthCode variant={variant} />);
    const shown = screen.getByText(/Your access code:/).textContent?.replace("Your access code: ", "") ?? "";
    fireEvent.change(screen.getByLabelText("Enter code"), { target: { value: shown } });
    fireEvent.click(screen.getByRole("button", { name: "Apply" }));
    expect(screen.getByText(text)).toBeInTheDocument();
  });
});
