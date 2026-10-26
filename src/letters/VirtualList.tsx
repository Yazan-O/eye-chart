import { useRef, useState } from "react";
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
  const list = useRef<HTMLDivElement>(null);
  const lens = variant === "lens";
  const { first, last } = visibleRange(scrollTop);
  const rows = [];
  for (let i = first; i <= last; i++) {
    rows.push(
      <button
        type="button"
        key={i}
        className="letter-row"
        style={{ top: i * ROW_HEIGHT, height: ROW_HEIGHT }}
        role={lens ? "option" : undefined}
        aria-selected={lens ? selected === i : undefined}
        aria-posinset={lens ? i + 1 : undefined}
        aria-setsize={lens ? ITEM_COUNT : undefined}
        onClick={() =>
          setSelected(variant === "broken" ? Math.min(i + 1, ITEM_COUNT - 1) : i)
        }
      >
        Item {i + 1}
      </button>,
    );
  }

  function jump(value: string) {
    const n = Number.parseInt(value, 10);
    if (!list.current || !Number.isFinite(n) || n < 1 || n > ITEM_COUNT) return;
    list.current.scrollTop = (n - 1) * ROW_HEIGHT;
    setScrollTop(list.current.scrollTop);
  }

  return (
    <div className="letter-widget">
      {lens ? (
        <label className="letter-skip">
          Go to item{" "}
          <input
            className="letter-field"
            type="number"
            min={1}
            max={ITEM_COUNT}
            onChange={(e) => jump(e.currentTarget.value)}
          />
        </label>
      ) : null}
      <p className="letter-readout">
        Selected: {selected === null ? "none" : `Item ${selected + 1}`}
      </p>
      <div
        ref={list}
        className="letter-list"
        style={{ height: VIEW_HEIGHT }}
        role={lens ? "listbox" : undefined}
        aria-label={lens ? `Items 1 to ${ITEM_COUNT}` : undefined}
        onScroll={(e) => setScrollTop(e.currentTarget.scrollTop)}
      >
        <div style={{ height: ITEM_COUNT * ROW_HEIGHT, position: "relative" }}>
          {rows}
        </div>
      </div>
    </div>
  );
}
