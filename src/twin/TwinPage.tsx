import { useParams } from "react-router-dom";
import { useLetters } from "../data/hooks";
import { findLetter } from "../data/letters";
import type { Variant } from "../data/types";
import NotFound from "../pages/NotFound";

const VARIANTS: Variant[] = ["works", "broken", "lens"];

export default function TwinPage() {
  const { id = "", variant = "" } = useParams();
  const { letters, ready } = useLetters();
  if (!ready) return null;
  const letter = findLetter(letters, id);
  const v = VARIANTS.find((x) => x === variant);
  if (!letter || !v || (v === "lens" && !letter.lens)) return <NotFound />;
  const { Component } = letter;
  return (
    <div className="twin" data-testid={`twin-${letter.id}-${v}`}>
      <Component variant={v} />
    </div>
  );
}
