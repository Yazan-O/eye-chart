import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App";
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

  it("renders a twin alone on its route", () => {
    renderAt("/l/plain-button/broken");
    expect(screen.getByTestId("twin-plain-button-broken")).toHaveTextContent("Widget broken");
    expect(screen.queryByTestId("topbar")).not.toBeInTheDocument();
  });

  it("refuses a lens twin for a letter without a lens", () => {
    renderAt("/l/plain-button/lens");
    expect(screen.getByTestId("not-found")).toBeInTheDocument();
  });

  it("opens a station with both twins embedded and no invented verdicts", () => {
    renderAt("/letter/canvas-slider");
    expect(screen.getByTestId("station-heading")).toHaveTextContent("Canvas slider");
    expect(screen.getByTestId("frame-works")).toHaveAttribute("src", "/#/l/canvas-slider/works");
    expect(screen.getByTestId("frame-broken")).toHaveAttribute("src", "/#/l/canvas-slider/broken");
    expect(screen.getByTestId("reading-works-verdict")).toHaveTextContent("Not read yet");
    expect(screen.getByTestId("reading-broken-verdict")).toHaveTextContent("Not read yet");
    expect(screen.getByTestId("lens-none")).toBeInTheDocument();
    expect(screen.getByTestId("prev-letter")).toHaveAttribute("href", "/letter/plain-button");
  });

  it("renders the not-found page with a link home on unknown routes", () => {
    renderAt("/does-not-exist");
    expect(screen.getByTestId("not-found-heading")).toHaveTextContent("Page not found");
    expect(screen.getByTestId("home-link")).toHaveAttribute("href", "/");
  });
});
