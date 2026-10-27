import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { AgentToggle } from "../agent/AgentView";
import About from "./About";
import { RobotMark } from "./Marks";

export default function TopBar({ children, home = false }: { children?: ReactNode; home?: boolean }) {
  return (
    <header className="topbar" data-testid="topbar">
      <div className="topbar-start">
        <Link to="/" className="wordmark" data-testid="wordmark" aria-label="Eye Chart, home">
          <RobotMark />
          {home ? (
            <h1 className="wordmark-text" data-testid="heading">
              Eye Chart
            </h1>
          ) : (
            <span className="wordmark-text">Eye Chart</span>
          )}
        </Link>
        {children}
      </div>
      <div className="topbar-actions">
        <AgentToggle />
        <About />
        <a
          className="button button--quiet topbar-github"
          href="https://github.com/Yazan-O/eye-chart"
          target="_blank"
          rel="noreferrer"
          data-testid="github-link"
        >
          GitHub
        </a>
      </div>
    </header>
  );
}
