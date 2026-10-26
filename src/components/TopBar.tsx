import type { ReactNode } from "react";
import { Link } from "react-router-dom";

export default function TopBar({ children }: { children?: ReactNode }) {
  return (
    <header className="topbar" data-testid="topbar">
      <Link to="/" className="wordmark" data-testid="wordmark">
        Eye Chart
      </Link>
      <div className="topbar-actions">{children}</div>
    </header>
  );
}
