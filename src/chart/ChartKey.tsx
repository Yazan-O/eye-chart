import { memo } from "react";
import type { CSSProperties, MouseEvent } from "react";
import { Link } from "react-router-dom";
import type { ChartRow } from "../data/chart";
import { STATE_WORDS } from "../data/readings";
import GlyphMark from "../components/GlyphMark";
import type { ScreenBox } from "./layout";

export interface ChartKeyProps {
  rows: ChartRow[];
  boxes: Record<string, ScreenBox> | null;
  activeId: string | null;
  onActive: (id: string | null) => void;
  onOpen: (id: string) => void;
}

function plainClick(e: MouseEvent): boolean {
  return e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey;
}

function ChartKey({ rows, boxes, activeId, onActive, onOpen }: ChartKeyProps) {
  if (rows.length === 0) {
    return (
      <p className="chart-key-empty" data-testid="chart-empty">
        No letters on the chart yet.
      </p>
    );
  }
  const placed = boxes !== null && rows.every((r) => r.glyphs.every((g) => boxes[g.id]));
  return (
    <nav
      className={`chart-key${placed ? " chart-key--placed" : ""}`}
      aria-label="Letters on the chart"
      data-testid="chart-key"
    >
      {rows.map((row, i) => (
        <div
          className="chart-key-row"
          key={row.row}
          data-testid={`chart-row-${row.row}`}
          style={{ "--i": i } as CSSProperties}
        >
          <span className="chart-key-fraction">{row.fraction}</span>
          <ul>
            {row.glyphs.map((g) => {
              const box = placed ? boxes[g.id] : undefined;
              const style = box
                ? ({ left: box.x, top: box.y, width: box.w, height: box.h } as CSSProperties)
                : undefined;
              return (
                <li key={g.id}>
                  <Link
                    to={`/letter/${g.id}`}
                    className={`chart-key-link${activeId === g.id ? " is-active" : ""}`}
                    style={style}
                    data-testid={`letter-link-${g.id}`}
                    data-letter-id={g.id}
                    data-state={g.state}
                    data-lens={g.lens}
                    aria-label={`${g.name}: ${STATE_WORDS[g.state]}`}
                    onMouseEnter={() => onActive(g.id)}
                    onMouseLeave={() => onActive(null)}
                    onFocus={() => onActive(g.id)}
                    onBlur={() => onActive(null)}
                    onClick={(e) => {
                      if (!plainClick(e)) return;
                      e.preventDefault();
                      onOpen(g.id);
                    }}
                  >
                    {!placed && <GlyphMark glyph={g.glyph} state={g.state} />}
                    <span className="chart-key-tip">
                      <span className="chart-key-name">{g.name}</span>
                      <span className="chart-key-state">{STATE_WORDS[g.state]}</span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

export default memo(ChartKey);
