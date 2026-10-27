export function GlassesMark({ size = 28 }: { size?: number }) {
  return (
    <svg className="glasses-mark" width={size} height={size * 0.5} viewBox="0 0 64 32" aria-hidden="true">
      <g fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round">
        <circle cx="16" cy="18" r="11" />
        <circle cx="48" cy="18" r="11" />
        <path d="M27 17q5-5 10 0M5 15 1 8M59 15l4-7" />
      </g>
    </svg>
  );
}

export function RobotMark() {
  return (
    <svg className="robot-mark" viewBox="0 0 120 120" aria-hidden="true" data-testid="robot-mark">
      <g className="robot-head">
        <line x1="60" y1="10" x2="60" y2="24" stroke="var(--sky)" strokeWidth="3" strokeLinecap="round" />
        <circle className="robot-bulb" cx="60" cy="9" r="5" fill="var(--lamp)" />
        <rect x="18" y="24" width="84" height="72" rx="20" fill="var(--graphite)" stroke="var(--muted)" strokeWidth="2" />
        <rect x="28" y="38" width="64" height="40" rx="12" fill="var(--room)" />
        <g className="robot-eyes" fill="var(--sky)">
          <circle cx="45" cy="58" r="5" />
          <circle cx="75" cy="58" r="5" />
        </g>
        <g className="robot-glasses" fill="none" stroke="var(--lamp)" strokeWidth="4" strokeLinecap="round">
          <circle cx="45" cy="58" r="13" />
          <circle cx="75" cy="58" r="13" />
          <path d="M58 56q2-3 4 0M32 54l-10-4M88 54l10-4" />
        </g>
        <rect x="46" y="84" width="28" height="4" rx="2" fill="var(--sky)" />
        <g className="robot-arm" fill="none" stroke="var(--robot-text)" strokeLinecap="round" strokeLinejoin="round">
          <path d="M170 50 122 22 68 40" strokeWidth="7" />
          <path d="M68 40 57 50M68 40 64 52" stroke="var(--lamp)" strokeWidth="4" />
          <circle cx="122" cy="22" r="6" fill="var(--graphite)" strokeWidth="4" />
          <circle cx="68" cy="40" r="5" fill="var(--graphite)" strokeWidth="4" />
        </g>
      </g>
    </svg>
  );
}
