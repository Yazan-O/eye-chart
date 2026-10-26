import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import ReadingCard from "./ReadingCard";
import Diff from "./Diff";
import type { Reading } from "../data/types";

const reading: Reading = {
  letterId: "a",
  variant: "broken",
  truth: "fail",
  verdict: "passed",
  testId: "t1",
  runId: "r1",
  reason: "The menu opened and the item was clicked.",
  screenshot: "readings/shots/r1.png",
};

describe("ReadingCard", () => {
  it("shows not read yet when there is no reading", () => {
    render(<ReadingCard letterId="a" variant="works" expected="pass" results={[]} />);
    expect(screen.getByTestId("reading-works-verdict")).toHaveTextContent("Not read yet");
    expect(screen.getByTestId("reading-works-truth")).toHaveTextContent("Should pass");
    expect(screen.queryByTestId("reading-works-judgement")).not.toBeInTheDocument();
  });

  it("shows the verdict, the verbatim reason, the screenshot and the judgement", () => {
    render(<ReadingCard letterId="a" variant="broken" expected="fail" results={[reading]} />);
    expect(screen.getByTestId("reading-broken-verdict")).toHaveTextContent("Passed");
    expect(screen.getByTestId("reading-broken-judgement")).toHaveTextContent("Misread");
    expect(screen.getByTestId("reading-broken-reason")).toHaveTextContent(reading.reason);
    expect(screen.getByRole("img")).toHaveAttribute("src", "/readings/shots/r1.png");
  });
});

describe("Diff", () => {
  it("marks added and removed lines", () => {
    const { container } = render(<Diff diff={"@@ -1 +1 @@\n-old\n+new\n same"} />);
    expect(container.querySelector(".diff-line--add")).toHaveTextContent("+new");
    expect(container.querySelector(".diff-line--del")).toHaveTextContent("-old");
    expect(container.querySelector(".diff-line--hunk")).toHaveTextContent("@@ -1 +1 @@");
  });
});
