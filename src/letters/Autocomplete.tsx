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
  const lens = variant === "lens";
  const matches = chosen ? [] : suggest(query);

  return (
    <div className="letter-widget">
      <div className="letter-row-gap">
        <label htmlFor="city">City</label>
        <input
          id="city"
          className="letter-field"
          autoComplete="off"
          role={lens ? "combobox" : undefined}
          aria-autocomplete={lens ? "list" : undefined}
          aria-expanded={lens ? matches.length > 0 : undefined}
          aria-controls={lens ? "city-options" : undefined}
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
        <ul className="letter-suggestions" id="city-options" role={lens ? "listbox" : undefined}>
          {matches.map((c) => (
            <li key={c} role={lens ? "none" : undefined}>
              <button
                type="button"
                className="letter-suggestion"
                role={lens ? "option" : undefined}
                aria-selected={lens ? false : undefined}
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
