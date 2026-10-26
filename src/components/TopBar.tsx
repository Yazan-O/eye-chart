import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { AgentToggle } from "../agent/AgentView";
import About from "./About";

export default function TopBar({ children }: { children?: ReactNode }) {
  return (
    <header className="topbar" data-testid="topbar">
      <Link to="/" className="wordmark" data-testid="wordmark">
        Eye Chart
      </Link>
      <div className="topbar-actions">
        <AgentToggle />
        <About />
        {children}
      </div>
    </header>
  );
}
