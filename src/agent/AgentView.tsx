import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { createPortal } from "react-dom";
import { useLocation } from "react-router-dom";
import { readPage, summarize } from "./accessibility";
import type { AgentNode } from "./accessibility";

interface AgentViewState {
  on: boolean;
  toggle: () => void;
  setOn: (on: boolean) => void;
}

const AgentViewContext = createContext<AgentViewState>({
  on: false,
  toggle: () => undefined,
  setOn: () => undefined,
});

export function useAgentView(): AgentViewState {
  return useContext(AgentViewContext);
}

const OVERLAY = "data-agent-overlay";

function skip(el: Element): boolean {
  return el.hasAttribute(OVERLAY);
}

function Overlay({ onClose }: { onClose: () => void }) {
  const [nodes, setNodes] = useState<AgentNode[]>([]);
  const { pathname } = useLocation();

  useEffect(() => {
    let frame = 0;
    const read = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => setNodes(readPage(document.body, { skip })));
    };
    read();
    const timer = window.setInterval(read, 1000);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("scroll", read, { capture: true, passive: true });
    window.addEventListener("resize", read);
    window.addEventListener("keydown", onKey);
    return () => {
      cancelAnimationFrame(frame);
      window.clearInterval(timer);
      window.removeEventListener("scroll", read, { capture: true });
      window.removeEventListener("resize", read);
      window.removeEventListener("keydown", onKey);
    };
  }, [pathname, onClose]);

  const counts = summarize(nodes);
  const visible = nodes.filter(
    (n) => n.box.y + n.box.h > 0 && n.box.y < window.innerHeight && n.box.x < window.innerWidth,
  );

  return createPortal(
    <div className="agent" {...{ [OVERLAY]: "" }} data-testid="agent-overlay">
      <div className="agent-field" aria-hidden="true">
        {visible.map((n, i) => (
          <div
            key={i}
            className={`agent-node agent-node--${n.kind}${n.kind === "control" && !n.name ? " agent-node--unnamed" : ""}`}
            style={{ left: n.box.x, top: n.box.y, width: n.box.w, height: n.box.h }}
            data-role={n.role}
          >
            {n.kind === "void" && (
              <span className="agent-void-label">
                {n.name ? `Canvas, labelled “${n.name}”. Nothing inside.` : "Canvas. Nothing inside."}
              </span>
            )}
            {n.kind === "control" && (
              <span className="agent-label">
                {n.role}
                {n.name ? ` “${n.name}”` : ", no name"}
              </span>
            )}
            {n.kind === "text" && <span className="agent-text">{n.name}</span>}
          </div>
        ))}
      </div>
      <p className="agent-summary" role="status" data-testid="agent-summary">
        What a page-structure reader gets here: {counts.controls} parts it can find
        {counts.unnamed > 0 ? ` (${counts.unnamed} with no name)` : ""}, and{" "}
        {counts.voids === 1 ? "1 canvas" : `${counts.voids} canvases`} it cannot see into.
      </p>
    </div>,
    document.body,
  );
}

export function AgentViewProvider({ children }: { children: ReactNode }) {
  const [on, setOn] = useState(false);
  const toggle = useCallback(() => setOn((v) => !v), []);
  const close = useCallback(() => setOn(false), []);
  const value = useMemo(() => ({ on, toggle, setOn }), [on, toggle]);
  return (
    <AgentViewContext.Provider value={value}>
      {children}
      {on && <Overlay onClose={close} />}
    </AgentViewContext.Provider>
  );
}

export function AgentToggle() {
  const { on, toggle } = useAgentView();
  return (
    <button
      type="button"
      className="button agent-toggle"
      aria-pressed={on}
      onClick={toggle}
      data-testid="agent-toggle"
    >
      {on ? "Back to human eyes" : "See it like TestSprite"}
    </button>
  );
}
