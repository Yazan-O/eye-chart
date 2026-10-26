import { useParams } from "react-router-dom";
import { findLetter } from "./registry";
import type { Variant } from "./types";

export const letterRoutePath = "/l/:id/:variant";

const VARIANTS: readonly Variant[] = ["works", "broken", "lens", "lens-broken"];

function isVariant(v: string | undefined): v is Variant {
  return VARIANTS.includes(v as Variant);
}

export function TwinPage({ id, variant }: { id?: string; variant?: string }) {
  const letter = findLetter(id);
  if (!letter || !isVariant(variant)) {
    return (
      <main className="letter-page">
        <h1>Unknown widget</h1>
      </main>
    );
  }
  if ((variant === "lens" || variant === "lens-broken") && !letter.lens) {
    return (
      <main className="letter-page">
        <h1>{letter.name}</h1>
        <p>No lens yet.</p>
      </main>
    );
  }
  const { Component } = letter;
  return (
    <main className="letter-page">
      <h1>{letter.name}</h1>
      <p className="letter-hint">{letter.howToUse}</p>
      <Component variant={variant} />
    </main>
  );
}

export function LetterRoute() {
  const { id, variant } = useParams();
  return <TwinPage id={id} variant={variant} />;
}
