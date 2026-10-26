import { useState } from "react";
import type { LetterProps } from "./types";

export const CITIES = [
  "Boston",
  "Denver",
  "Rochester",
  "Rockford",
  "Rome",
  "Roseville",
  "Round Rock",
] as const;

export function suggest(query: string) {
  const q = query.trim().toLowerCase();
  if (q.length < 2) return [];
  return CITIES.filter((c) => c.toLowerCase().startsWith(q));
}

export default function Autocomplete({ variant }: LetterProps) {
  const [query, setQuery] = useState("");
  const [value, setValue] = useState("");
  const [chosen, setChosen] = useState<string | null>(null);
  const keysOnly = variant === "broken";
  const matches = chosen ? [] : suggest(query);

  return (
    <div className="letter-widget">
      <div className="letter-row-gap">
        <label htmlFor="city">City</label>
        <input
          id="city"
          className="letter-field"
          autoComplete="off"
          value={value}
          onChange={(e) => {
            setValue(e.currentTarget.value);
            setChosen(null);
            if (!keysOnly) setQuery(e.currentTarget.value);
          }}
          onKeyUp={(e) => {
            if (keysOnly) setQuery(e.currentTarget.value);
          }}
        />
      </div>
      {matches.length > 0 ? (
        <ul className="letter-suggestions">
          {matches.map((c) => (
            <li key={c}>
              <button
                type="button"
                className="letter-suggestion"
                onClick={() => {
                  setValue(c);
                  setChosen(c);
                }}
              >
                {c}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      <p className="letter-readout">Chosen: {chosen ?? "none"}</p>
    </div>
  );
}
