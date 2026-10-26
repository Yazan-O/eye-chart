import { render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import EventField from "./EventField";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("EventField", () => {
  it("draws exactly once and starts no frame loop in the still path", () => {
    const ctx = {
      canvas: { width: 0, height: 0 },
      clearRect: vi.fn(),
      strokeRect: vi.fn(),
      setLineDash: vi.fn(),
      lineWidth: 1,
      strokeStyle: "",
    };
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(
      ctx as unknown as CanvasRenderingContext2D,
    );
    const raf = vi.spyOn(window, "requestAnimationFrame");
    const onFrame = vi.fn();
    const nodes = [
      { kind: "control" as const, role: "link", name: "Toast", box: { x: 0, y: 0, w: 40, h: 20 }, letterId: "toast", state: "misread" },
    ];
    render(<EventField nodes={nodes} still fixed={new Set()} onFrame={onFrame} />);
    expect(onFrame).toHaveBeenCalledTimes(1);
    expect(ctx.clearRect).toHaveBeenCalledTimes(1);
    expect(ctx.strokeRect).toHaveBeenCalledTimes(2);
    expect(raf).not.toHaveBeenCalled();
  });
});
