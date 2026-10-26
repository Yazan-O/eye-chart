import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App";
import { resetReadingsCache } from "./data/readings";
import type { Letter, Variant } from "./data/types";

vi.mock("./chart/ChartScene", () => ({
  default: ({ reduced }: { reduced: boolean }) => (
    <div data-testid="scene-mock" data-reduced={String(reduced)} />
  ),
}));

function Widget({ variant }: { variant: Variant }) {
  return <button type="button">Widget {variant}</button>;
}

const testLetters: Letter[] = [
  {
    id: "plain-button",
    row: 1,
    glyph: "E",
    name: "Plain button",
    trap: "t",
    howToUse: "h",
    brokenBehaviour: "b",
    Component: Widget,
  },
  {
    id: "canvas-slider",
    row: 2,
    glyph: "F",
    name: "Canvas slider",
    trap: "t",
    howToUse: "h",
    brokenBehaviour: "b",
    lens: { name: "Slider role", summary: "s", diff: "+role" },
    Component: Widget,
  },
];

vi.mock("./data/letters", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./data/letters")>();
  return {
    ...actual,
    registeredLetters: () => testLetters,
    loadLetters: async () => testLetters,
  };
});

function mockMatchMedia(matches: boolean) {
  vi.stubGlobal(
    "matchMedia",
    vi.fn().mockImplementation((query: string) => ({
      matches,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  );
}

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  );
}

describe("App routing", () => {
  beforeEach(() => {
    mockMatchMedia(false);
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false }));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("names the product and mirrors every letter as a link", async () => {
    renderAt("/");
    expect(screen.getByTestId("heading")).toHaveTextContent("Eye Chart");
    const link = screen.getByTestId("letter-link-plain-button");
    expect(link).toHaveAttribute("href", "/letter/plain-button");
    expect(link).toHaveAttribute("data-state", "unread");
    expect(screen.getByTestId("letter-link-canvas-slider")).toHaveAccessibleName(
      "Canvas slider: Not read yet",
    );
    expect(await screen.findByTestId("reading-summary")).toHaveTextContent("Not read yet.");
  });

  it("passes the reduced-motion preference to the scene", async () => {
    mockMatchMedia(true);
    renderAt("/");
    expect(screen.getByTestId("scene")).toHaveAttribute("data-reduced", "true");
    expect(await screen.findByTestId("scene-mock")).toHaveAttribute("data-reduced", "true");
  });

  it("renders a real twin alone on its route, without chart chrome", () => {
    renderAt("/l/counter/works");
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Counter");
    expect(screen.queryByTestId("topbar")).not.toBeInTheDocument();
  });

  it("opens a station with both twins embedded and no invented verdicts", () => {
    renderAt("/letter/canvas-slider");
    expect(screen.getByTestId("station-heading")).toHaveTextContent("Canvas slider");
    expect(screen.getByTestId("frame-works")).toHaveAttribute("src", "/#/l/canvas-slider/works");
    expect(screen.getByTestId("frame-broken")).toHaveAttribute("src", "/#/l/canvas-slider/broken");
    expect(screen.getByTestId("reading-works-verdict")).toHaveTextContent("Not read yet");
    expect(screen.getByTestId("reading-broken-verdict")).toHaveTextContent("Not read yet");
    expect(screen.getByTestId("lens-name")).toHaveTextContent("Lens: Slider role");
    expect(screen.getByTestId("reading-lens-verdict")).toHaveTextContent("Not read yet");
    expect(screen.getByTestId("prev-letter")).toHaveAttribute("href", "/letter/plain-button");
  });

  it("switches to the agent view from the chart and back", () => {
    renderAt("/");
    const toggle = screen.getByTestId("agent-toggle");
    expect(toggle).toHaveAttribute("aria-pressed", "false");
    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByTestId("agent-overlay")).toBeInTheDocument();
    expect(screen.getByTestId("agent-summary")).toHaveTextContent("What a page-structure reader gets here");
    fireEvent.keyDown(window, { key: "Escape" });
    expect(screen.queryByTestId("agent-overlay")).not.toBeInTheDocument();
    fireEvent.click(toggle);
    fireEvent.click(screen.getByTestId("agent-exit"));
    expect(screen.queryByTestId("agent-overlay")).not.toBeInTheDocument();
  });

  it("turns a lens dial with the keyboard-reachable button and rereads the chart", async () => {
    const reading = (variant: string, truth: string, verdict: string) => ({
      letterId: "canvas-slider",
      variant,
      truth,
      verdict,
      reason: "r",
    });
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          takenAt: "2026-10-26T15:00:00Z",
          results: [
            reading("works", "pass", "passed"),
            reading("broken", "fail", "passed"),
            reading("lens", "fail", "failed"),
          ],
        }),
      }),
    );
    resetReadingsCache();
    renderAt("/");
    const link = screen.getByTestId("letter-link-canvas-slider");
    await waitFor(() => expect(link).toHaveAttribute("data-state", "misread"));
    const dial = screen.getByTestId("lens-dial-canvas-slider");
    expect(dial).toHaveAttribute("aria-pressed", "false");
    fireEvent.click(dial);
    expect(dial).toHaveAttribute("aria-pressed", "true");
    expect(link).toHaveAttribute("data-state", "read");
    expect(screen.getByTestId("reading-summary")).toHaveTextContent("With 1 lens on.");
    fireEvent.click(screen.getByTestId("lens-reset"));
    expect(link).toHaveAttribute("data-state", "misread");
    resetReadingsCache();
  });

  it("opens and closes the about panel", () => {
    renderAt("/");
    fireEvent.click(screen.getByTestId("about-open"));
    expect(screen.getByTestId("about-panel")).toHaveAccessibleName("An eye exam for an AI tester");
    fireEvent.click(screen.getByTestId("about-close"));
    expect(screen.queryByTestId("about-panel")).not.toBeInTheDocument();
  });

  it("renders the not-found page with a link home on unknown routes", () => {
    renderAt("/does-not-exist");
    expect(screen.getByTestId("not-found-heading")).toHaveTextContent("Page not found");
    expect(screen.getByTestId("home-link")).toHaveAttribute("href", "/");
  });
});
