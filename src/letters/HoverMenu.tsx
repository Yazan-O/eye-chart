import { useState } from "react";
import type { LetterProps } from "./types";

export const MENU_ITEMS = ["Profile", "Settings", "Sign out"] as const;

export default function HoverMenu({ variant }: LetterProps) {
  const [open, setOpen] = useState(false);
  const [page, setPage] = useState("Home");

  function choose(index: number) {
    const target = variant === "broken" ? (index + 1) % MENU_ITEMS.length : index;
    setPage(MENU_ITEMS[target] ?? "Home");
    setOpen(false);
  }

  return (
    <div className="letter-widget">
      <nav
        className="letter-menu"
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
      >
        <span className="letter-menu-trigger">Menu ▾</span>
        {open ? (
          <ul className="letter-menu-list">
            {MENU_ITEMS.map((item, i) => (
              <li key={item}>
                <button type="button" onClick={() => choose(i)}>
                  {item}
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </nav>
      <p className="letter-readout">Current page: {page}</p>
    </div>
  );
}
