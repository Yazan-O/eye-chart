import { useState } from "react";
import type { LetterProps } from "./types";

export const SIZES = [
  { label: "Small", serves: 1 },
  { label: "Medium", serves: 2 },
  { label: "Large", serves: 4 },
] as const;

export default function CustomSelect({ variant }: LetterProps) {
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);
  const size = SIZES[index] ?? SIZES[0];
  const serves = variant === "broken" ? SIZES[0].serves : size.serves;

  return (
    <div className="letter-widget">
      <div className="letter-select">
        <div className="letter-select-box" onClick={() => setOpen((o) => !o)}>
          Size: {size.label} ▾
        </div>
        {open ? (
          <div className="letter-select-list">
            {SIZES.map((s, i) => (
              <div
                key={s.label}
                className="letter-select-option"
                onClick={() => {
                  setIndex(i);
                  setOpen(false);
                }}
              >
                {s.label}
              </div>
            ))}
          </div>
        ) : null}
      </div>
      <p className="letter-readout">Serves {serves}</p>
    </div>
  );
}
