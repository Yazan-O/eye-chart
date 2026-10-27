import { useState } from "react";
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
  const [latest, setLatest] = useState<string | null>(null);
  const onDials = dials.filter((d) => d.on);
  const anyOn = onDials.length > 0;
  const shown = onDials.find((d) => d.id === latest) ?? onDials[onDials.length - 1];
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
                onClick={() => {
                  if (!d.on) setLatest(d.id);
                  onToggle(d.id);
                }}
                onMouseEnter={() => onActive(d.id)}
                onMouseLeave={() => onActive(null)}
                onFocus={() => onActive(d.id)}
                onBlur={() => onActive(null)}
                data-testid={`lens-dial-${d.id}`}
              >
                <span className="dial-face">
                  <span className="dial-knob" aria-hidden="true" />
                  <span className="dial-glyph">{d.glyph}</span>
                </span>
                <span className="dial-text">
                  <span className="dial-name">{d.name}</span>
                  <span className="dial-state visually-hidden">
                    {d.on ? "On" : "Off"}
                    {d.measured ? "" : ", not measured"}
                  </span>
                  <span className="dial-reading" data-testid={`lens-dial-reading-${d.id}`}>
                    {d.on ? `${d.without} → ${d.with}` : d.without}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
      {shown && (
        <p className="dial-detail" data-testid={`lens-dial-detail-${shown.id}`}>
          {shown.summary}{" "}
          <Link to={`/letter/${shown.id}?pane=lens&focus=lens`} data-testid={`lens-dial-open-${shown.id}`}>
            See the code change: letter {shown.glyph}, {shown.letter}
          </Link>
        </p>
      )}
      <p className="dials-live visually-hidden" role="status" aria-live="polite" data-testid="lens-live">
        {shown ? `${shown.name} on ${shown.glyph}: ${shown.without} becomes ${shown.with}.` : ""}
      </p>
    </section>
  );
}
