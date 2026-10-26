import type { CSSProperties } from "react";
import { Link } from "react-router-dom";
import type { ChartRow } from "../data/chart";
import { STATE_WORDS } from "../data/readings";
import GlyphMark from "../components/GlyphMark";

export interface ChartKeyProps {
  rows: ChartRow[];
  activeId: string | null;
  onActive: (id: string | null) => void;
}

export default function ChartKey({ rows, activeId, onActive }: ChartKeyProps) {
  if (rows.length === 0) {
    return (
      <p className="chart-key-empty" data-testid="chart-empty">
        No letters on the chart yet.
      </p>
    );
  }
  return (
    <nav className="chart-key" aria-label="Letters on the chart" data-testid="chart-key">
      {rows.map((row, i) => (
        <div
          className="chart-key-row"
          key={row.row}
          data-testid={`chart-row-${row.row}`}
          style={{ "--i": i } as CSSProperties}
        >
          <span className="chart-key-fraction">{row.fraction}</span>
          <ul>
            {row.glyphs.map((g) => (
              <li key={g.id}>
                <Link
                  to={`/letter/${g.id}`}
                  className={`chart-key-link${activeId === g.id ? " is-active" : ""}`}
                  data-testid={`letter-link-${g.id}`}
                  data-state={g.state}
                  aria-label={`${g.name}: ${STATE_WORDS[g.state]}`}
                  onMouseEnter={() => onActive(g.id)}
                  onMouseLeave={() => onActive(null)}
                  onFocus={() => onActive(g.id)}
                  onBlur={() => onActive(null)}
                >
                  <GlyphMark glyph={g.glyph} state={g.state} />
                  <span className="chart-key-name">{g.name}</span>
                  <span className="chart-key-state">{STATE_WORDS[g.state]}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  );
}
