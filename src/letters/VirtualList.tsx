import { useState } from "react";
import type { LetterProps } from "./types";

export const ITEM_COUNT = 10000;
export const ROW_HEIGHT = 32;
const VIEW_HEIGHT = 384;
const OVERSCAN = 4;

export function visibleRange(scrollTop: number) {
  const first = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - OVERSCAN);
  const last = Math.min(
    ITEM_COUNT - 1,
    Math.ceil((scrollTop + VIEW_HEIGHT) / ROW_HEIGHT) + OVERSCAN,
  );
  return { first, last };
}

export default function VirtualList({ variant }: LetterProps) {
  const [scrollTop, setScrollTop] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const { first, last } = visibleRange(scrollTop);
  const rows = [];
  for (let i = first; i <= last; i++) {
    rows.push(
      <button
        type="button"
        key={i}
        className="letter-row"
        style={{ top: i * ROW_HEIGHT, height: ROW_HEIGHT }}
        onClick={() =>
          setSelected(variant === "broken" ? Math.min(i + 1, ITEM_COUNT - 1) : i)
        }
      >
        Item {i + 1}
      </button>,
    );
  }

  return (
    <div className="letter-widget">
      <p className="letter-readout">
        Selected: {selected === null ? "none" : `Item ${selected + 1}`}
      </p>
      <div
        className="letter-list"
        style={{ height: VIEW_HEIGHT }}
        onScroll={(e) => setScrollTop(e.currentTarget.scrollTop)}
      >
        <div style={{ height: ITEM_COUNT * ROW_HEIGHT, position: "relative" }}>
          {rows}
        </div>
      </div>
    </div>
  );
}
