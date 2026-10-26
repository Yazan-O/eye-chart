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
                    {d.on || d.demo ? "On" : "Off"}
                    {d.measured ? "" : ", not measured"}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
