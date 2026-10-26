import { isBroken } from "./types";
import type { LetterProps } from "./types";

function Tick() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28">
      <circle cx="14" cy="14" r="13" fill="#1f8f4e" />
      <path d="M8 14.5l4 4 8-9" stroke="#fff" strokeWidth="3" fill="none" />
    </svg>
  );
}

function Cross() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28">
      <circle cx="14" cy="14" r="13" fill="#c0392b" />
      <path d="M9 9l10 10M19 9L9 19" stroke="#fff" strokeWidth="3" />
    </svg>
  );
}

export default function IconStatus({ variant }: LetterProps) {
  const rows = [
    { name: "Build", passed: 3, icon: "tick" },
    { name: "Lint", passed: 1, icon: isBroken(variant) ? "tick" : "cross" },
  ];
  return (
    <div className="letter-widget">
      {rows.map((r) => (
        <div className="letter-row-gap" key={r.name}>
          {r.icon === "tick" ? <Tick /> : <Cross />}
          <span className="letter-readout">
            {r.name}: {r.passed}/3 checks
          </span>
        </div>
      ))}
    </div>
  );
}
