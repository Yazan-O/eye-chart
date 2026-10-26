import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import AnimatedTotal from "./AnimatedTotal";
import { valueAt } from "./CanvasSlider";
import Counter from "./Counter";
import HoverMenu from "./HoverMenu";
import { letters } from "./registry";
import { TwinPage } from "./routes";
import Toast, { TOAST_MS } from "./Toast";
import VirtualList, { ROW_HEIGHT } from "./VirtualList";
import { angleFor, stepFromDrag } from "./WebglKnob";
import type { Variant } from "./types";

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("registry", () => {
  it("has eight letters with unique ids, rows 1 to 8", () => {
    expect(letters).toHaveLength(8);
    expect(new Set(letters.map((l) => l.id)).size).toBe(8);
    expect(letters.map((l) => l.row)).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
  });

  it("twin pages never print the variant name", () => {
    for (const variant of ["works", "broken"] as Variant[]) {
      const { container, unmount } = render(<TwinPage id="counter" variant={variant} />);
      expect(container.textContent).not.toMatch(/works|broken/i);
      unmount();
    }
  });

  it("shows a plain message for an unknown letter or a missing lens", () => {
    render(<TwinPage id="nope" variant="works" />);
    expect(screen.getByText("Unknown widget")).toBeInTheDocument();
  });
});

describe("counter", () => {
  it.each([
    ["works", "Count: 3"],
    ["broken", "Count: 6"],
  ] as const)("%s twin after three clicks shows %s", (variant, text) => {
    render(<Counter variant={variant} />);
    const button = screen.getByRole("button", { name: "Add one" });
    for (let i = 0; i < 3; i++) fireEvent.click(button);
    expect(screen.getByText(text)).toBeInTheDocument();
  });
});

describe("toast", () => {
  it("works twin shows Saved, then hides it", () => {
    vi.useFakeTimers();
    render(<Toast variant="works" />);
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(screen.getByText("Saved")).toBeInTheDocument();
    act(() => {
      vi.advanceTimersByTime(TOAST_MS + 1);
    });
    expect(screen.queryByText("Saved")).toBeNull();
  });

  it("broken twin shows nothing", () => {
    render(<Toast variant="broken" />);
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(screen.queryByText("Saved")).toBeNull();
  });
});

describe("hover menu", () => {
  it.each([
    ["works", "Current page: Settings"],
    ["broken", "Current page: Sign out"],
  ] as const)("%s twin, Settings leads to %s", (variant, text) => {
    render(<HoverMenu variant={variant} />);
    expect(screen.queryByRole("button", { name: "Settings" })).toBeNull();
    fireEvent.mouseEnter(screen.getByText("Menu ▾"));
    fireEvent.click(screen.getByRole("button", { name: "Settings" }));
    expect(screen.getByText(text)).toBeInTheDocument();
  });
});

describe("animated total", () => {
  it.each([
    ["works", "Total: 1,250"],
    ["broken", "Total: 1,205"],
  ] as const)("%s twin with reduced motion shows %s", (variant, text) => {
    vi.stubGlobal("matchMedia", (q: string) => ({ matches: true, media: q }));
    render(<AnimatedTotal variant={variant} />);
    fireEvent.click(screen.getByRole("button", { name: "Load total" }));
    expect(screen.getByText(text)).toBeInTheDocument();
  });
});

describe("virtual list", () => {
  it.each([
    ["works", "Selected: Item 7777"],
    ["broken", "Selected: Item 7778"],
  ] as const)("%s twin renders few rows and selects %s", (variant, text) => {
    const { container } = render(<VirtualList variant={variant} />);
    expect(screen.queryByText("Item 7777")).toBeNull();
    const list = container.querySelector(".letter-list") as HTMLElement;
    list.scrollTop = 7776 * ROW_HEIGHT;
    fireEvent.scroll(list);
    expect(container.querySelectorAll(".letter-row").length).toBeLessThan(30);
    fireEvent.click(screen.getByText("Item 7777"));
    expect(screen.getByText(text)).toBeInTheDocument();
  });
});

describe("canvas slider and webgl knob maths", () => {
  it("maps canvas x to 0..100", () => {
    expect(valueAt(20)).toBe(0);
    expect(valueAt(440)).toBe(70);
    expect(valueAt(9999)).toBe(100);
  });

  it("turns the knob one step per 20 px of upward drag", () => {
    expect(stepFromDrag(0, -140)).toBe(7);
    expect(stepFromDrag(0, 300)).toBe(0);
    expect(stepFromDrag(0, -999)).toBe(10);
    expect(angleFor(10)).toBeCloseTo((-135 * Math.PI) / 180);
  });
});
