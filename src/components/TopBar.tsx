import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { AgentToggle } from "../agent/AgentView";
import About from "./About";
import { GlassesMark } from "./Marks";

export default function TopBar({ children }: { children?: ReactNode }) {
  return (
    <header className="topbar" data-testid="topbar">
      <Link to="/" className="wordmark" data-testid="wordmark" aria-label="Eye Chart, home">
        <GlassesMark />
        <span className="wordmark-text">Eye Chart</span>
      </Link>
      <div className="topbar-actions">
        <AgentToggle />
        <About />
        {children}
      </div>
    </header>
  );
}
