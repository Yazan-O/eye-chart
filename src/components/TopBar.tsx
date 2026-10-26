import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { AgentToggle } from "../agent/AgentView";
import About from "./About";
import { GlassesMark } from "./Marks";

export default function TopBar({ children }: { children?: ReactNode }) {
  return (
    <header className="topbar" data-testid="topbar">
      <div className="topbar-start">
        <Link to="/" className="wordmark" data-testid="wordmark" aria-label="Eye Chart, home">
          <GlassesMark />
          <span className="wordmark-text">Eye Chart</span>
        </Link>
        {children}
      </div>
      <div className="topbar-actions">
        <AgentToggle />
        <About />
      </div>
    </header>
  );
}
