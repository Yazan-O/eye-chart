import { useState } from "react";
import { isBroken, hasLens } from "./types";
import type { LetterProps } from "./types";

export const MENU_ITEMS = ["Profile", "Settings", "Sign out"] as const;

export default function HoverMenu({ variant }: LetterProps) {
  const [open, setOpen] = useState(false);
  const [page, setPage] = useState("Home");
  const lens = hasLens(variant);

  function choose(index: number) {
    const target = isBroken(variant) ? (index + 1) % MENU_ITEMS.length : index;
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
        {lens ? (
          <button
            type="button"
            className="letter-menu-trigger"
            aria-haspopup="menu"
            aria-expanded={open}
            onClick={() => setOpen(true)}
            onFocus={() => setOpen(true)}
          >
            Menu ▾
          </button>
        ) : (
          <span className="letter-menu-trigger">Menu ▾</span>
        )}
        {open ? (
          <ul className="letter-menu-list" role={lens ? "menu" : undefined}>
            {MENU_ITEMS.map((item, i) => (
              <li key={item} role={lens ? "none" : undefined}>
                <button
                  type="button"
                  role={lens ? "menuitem" : undefined}
                  onClick={() => choose(i)}
                >
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
