import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App";

vi.mock("./components/Scene", () => ({
  default: ({ reducedMotion }: { reducedMotion: boolean }) => (
    <div data-testid="scene" data-reduced={String(reducedMotion)} />
  ),
}));

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
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders the heading and scene on /", () => {
    renderAt("/");
    expect(screen.getByTestId("heading")).toHaveTextContent("Scene Shell");
    expect(screen.getByTestId("scene")).toBeInTheDocument();
    expect(screen.getByTestId("motion-status")).toHaveTextContent("full");
  });

  it("passes the reduced-motion preference to the scene", () => {
    mockMatchMedia(true);
    renderAt("/");
    expect(screen.getByTestId("scene")).toHaveAttribute("data-reduced", "true");
    expect(screen.getByTestId("motion-status")).toHaveTextContent("reduced");
  });

  it("renders the not-found page with a link home on unknown routes", () => {
    renderAt("/does-not-exist");
    expect(screen.getByTestId("not-found-heading")).toHaveTextContent(
      "Page not found",
    );
    expect(screen.getByTestId("home-link")).toHaveAttribute("href", "/");
  });
});
