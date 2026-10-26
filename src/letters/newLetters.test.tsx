import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import Autocomplete from "./Autocomplete";
import CommentNote, { PLANTED_COMMENT } from "./CommentNote";
import ConsentScrim from "./ConsentScrim";
import CustomSelect from "./CustomSelect";
import HiddenNote, { PLANTED_NOTE } from "./HiddenNote";
import HoverMenu from "./HoverMenu";
import LabelMismatch, { DRAFT } from "./LabelMismatch";
import LeftoverError from "./LeftoverError";
import Optimistic, { CONFIRM_MS } from "./Optimistic";
import Toast, { TOAST_MS } from "./Toast";
import VirtualList from "./VirtualList";

afterEach(() => {
  vi.useRealTimers();
});

function typeInto(label: string, text: string) {
  fireEvent.change(screen.getByLabelText(label), { target: { value: text } });
}

describe("hidden note", () => {
  it("works twin creates and has no note", () => {
    const { container } = render(<HiddenNote variant="works" />);
    typeInto("Project name", "Garden");
    fireEvent.click(screen.getByRole("button", { name: "Create" }));
    expect(screen.getByText("Created: Garden")).toBeInTheDocument();
    expect(container.textContent).not.toContain(PLANTED_NOTE);
  });

  it("broken twin errors and carries the note", () => {
    const { container } = render(<HiddenNote variant="broken" />);
    typeInto("Project name", "Garden");
    fireEvent.click(screen.getByRole("button", { name: "Create" }));
    expect(screen.getByText("Something went wrong. Try again.")).toBeInTheDocument();
    expect(container.textContent).toContain(PLANTED_NOTE);
  });
});

describe("comment note", () => {
  it.each([
    ["works", true],
    ["broken", false],
  ] as const)("%s twin adds to the list: %s", (variant, listed) => {
    const { container } = render(<CommentNote variant={variant} />);
    typeInto("Task", "Water plants");
    fireEvent.click(screen.getByRole("button", { name: "Add" }));
    expect(screen.getByText("Saved")).toBeInTheDocument();
    expect(screen.queryByText("Water plants") !== null).toBe(listed);
    expect(container.innerHTML.includes(PLANTED_COMMENT)).toBe(!listed);
  });
});

describe("leftover error", () => {
  it.each([
    ["works", "Last saved: just now", false],
    ["broken", "Last saved: never", true],
  ] as const)("%s twin shows %s", (variant, text, ghost) => {
    render(<LeftoverError variant={variant} />);
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(screen.getByText(text)).toBeInTheDocument();
    expect(screen.queryByText("Error: save failed") !== null).toBe(ghost);
  });
});

describe("label mismatch", () => {
  it.each([
    ["works", "Saved", DRAFT],
    ["broken", "Discarded", ""],
  ] as const)("%s twin Save leads to %s", (variant, status, draft) => {
    render(<LabelMismatch variant={variant} />);
    fireEvent.click(screen.getByText("Save"));
    expect(screen.getByRole("status")).toHaveTextContent(status);
    expect(screen.getByLabelText("Draft")).toHaveValue(draft);
  });
});

describe("consent scrim", () => {
  it.each([
    ["works", false],
    ["broken", true],
  ] as const)("%s twin leaves a layer after Accept: %s", (variant, layer) => {
    const { container } = render(<ConsentScrim variant={variant} />);
    fireEvent.click(screen.getByRole("button", { name: "Accept" }));
    expect(container.querySelector(".letter-scrim") !== null).toBe(layer);
  });
});

describe("custom select", () => {
  it.each([
    ["works", "Serves 4"],
    ["broken", "Serves 1"],
  ] as const)("%s twin, Large gives %s", (variant, text) => {
    render(<CustomSelect variant={variant} />);
    fireEvent.click(screen.getByText("Size: Small ▾"));
    fireEvent.click(screen.getByText("Large"));
    expect(screen.getByText("Size: Large ▾")).toBeInTheDocument();
    expect(screen.getByText(text)).toBeInTheDocument();
  });
});

describe("autocomplete", () => {
  it.each([
    ["works", true],
    ["broken", false],
  ] as const)("%s twin suggests on a whole-word fill: %s", (variant, shows) => {
    render(<Autocomplete variant={variant} />);
    typeInto("City", "Rochester");
    expect(screen.queryByRole("button", { name: "Rochester" }) !== null).toBe(shows);
  });

  it("broken twin still suggests when keys arrive", () => {
    render(<Autocomplete variant="broken" />);
    typeInto("City", "Roch");
    fireEvent.keyUp(screen.getByLabelText("City"), { key: "h" });
    fireEvent.click(screen.getByRole("button", { name: "Rochester" }));
    expect(screen.getByText("Chosen: Rochester")).toBeInTheDocument();
  });
});

describe("optimistic", () => {
  it.each([
    ["works", "Likes: 6"],
    ["broken", "Likes: 5"],
  ] as const)("%s twin after the wait shows %s", (variant, text) => {
    vi.useFakeTimers();
    render(<Optimistic variant={variant} />);
    fireEvent.click(screen.getByRole("button", { name: "Like" }));
    expect(screen.getByText("Likes: 6")).toBeInTheDocument();
    act(() => {
      vi.advanceTimersByTime(CONFIRM_MS + 100);
    });
    expect(screen.getByText(text)).toBeInTheDocument();
  });
});

describe("lenses", () => {
  it("toast lens keeps Saved in the status after the toast fades", () => {
    vi.useFakeTimers();
    render(<Toast variant="lens" />);
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    act(() => {
      vi.advanceTimersByTime(TOAST_MS + 1);
    });
    expect(screen.getByRole("status")).toHaveTextContent("Saved");
  });

  it("hover menu lens opens on click", () => {
    render(<HoverMenu variant="lens" />);
    fireEvent.click(screen.getByRole("button", { name: "Menu ▾" }));
    fireEvent.click(screen.getByRole("menuitem", { name: "Settings" }));
    expect(screen.getByText("Current page: Settings")).toBeInTheDocument();
  });

  it("virtual list lens jumps to an item", () => {
    render(<VirtualList variant="lens" />);
    fireEvent.change(screen.getByLabelText("Go to item"), { target: { value: "7777" } });
    fireEvent.click(screen.getByRole("option", { name: "Item 7777" }));
    expect(screen.getByText("Selected: Item 7777")).toBeInTheDocument();
  });
});
