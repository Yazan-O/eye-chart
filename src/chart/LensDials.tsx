import { Link } from "react-router-dom";
import type { LensDial } from "./Phoropter";

export default function LensDials({
  dials,
  activeId,
  onToggle,
  onReset,
  onActive,
}: {
  dials: LensDial[];
  activeId: string | null;
  onToggle: (id: string) => void;
  onReset: () => void;
  onActive: (id: string | null) => void;
}) {
  const anyOn = dials.some((d) => d.on);
  return (
    <section className="dials" aria-label="Lens machine" data-testid="lens-machine">
      <div className="dials-head">
        <h2>Lenses</h2>
        {anyOn && (
          <button type="button" className="dials-reset" onClick={onReset} data-testid="lens-reset">
            Take all lenses off
          </button>
        )}
      </div>
      {dials.length === 0 ? (
        <p className="dials-none" data-testid="lens-none-yet">
          No lenses yet.
        </p>
      ) : (
        <ul className="dials-list">
          {dials.map((d) => (
            <li key={d.id}>
              <button
                type="button"
                data-measured={String(d.measured)}
                className={`dial${d.on || d.demo ? " is-on" : ""}${activeId === d.id ? " is-active" : ""}`}
                aria-pressed={d.on}
                aria-label={`${d.name} lens on ${d.glyph}`}
                onClick={() => onToggle(d.id)}
                onMouseEnter={() => onActive(d.id)}
                onMouseLeave={() => onActive(null)}
                onFocus={() => onActive(d.id)}
                onBlur={() => onActive(null)}
                data-testid={`lens-dial-${d.id}`}
              >
                <span className="dial-knob" aria-hidden="true" />
                <span className="dial-text">
                  <span className="dial-glyph">{d.glyph}</span>
                  <span className="dial-name">{d.name}</span>
                  <span className="dial-state">
                    {d.on ? "On" : "Off"}
                    {d.measured ? "" : ", not measured"}
                  </span>
                  <span className="dial-reading" data-testid={`lens-dial-reading-${d.id}`}>
                    {d.on ? `${d.without} → ${d.with}` : d.without}
                  </span>
                </span>
              </button>
              {d.on && (
                <p className="dial-detail" data-testid={`lens-dial-detail-${d.id}`}>
                  {d.summary}{" "}
                  <Link to={`/letter/${d.id}?pane=lens&focus=lens`} data-testid={`lens-dial-open-${d.id}`}>
                    See the code change: letter {d.glyph}, {d.letter}
                  </Link>
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
      <p className="dials-live" role="status" aria-live="polite" data-testid="lens-live">
        {dials
          .filter((d) => d.on)
          .map((d) => `${d.name} on ${d.glyph}: ${d.without} becomes ${d.with}.`)
          .join(" ")}
      </p>
    </section>
  );
}
