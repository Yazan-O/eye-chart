import { lazy, Suspense, useCallback, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { createPortal } from "react-dom";
import { ui, useUi } from "../core/store";
import { clearTimers, leaveSensor, OVERLAY, registerShutter, toggleSensor } from "../retina/control";
import type { Shutter } from "../retina/control";

const Sensor = lazy(() => import("../retina/RetinaShell"));

function ShutterBars() {
  const [state, setState] = useState<Shutter>("idle");
  useEffect(() => {
    registerShutter(setState);
    return () => registerShutter(null);
  }, []);
  if (state === "idle") return null;
  return (
    <div className={`shutter shutter--${state}`} aria-hidden="true" {...{ [OVERLAY]: "" }}>
      <span />
      <span />
    </div>
  );
}

export function useAgentView(): { on: boolean; toggle: () => void } {
  const { view } = useUi();
  return { on: view === "robot", toggle: toggleSensor };
}

export function AgentViewProvider({ children }: { children: ReactNode }) {
  const { view } = useUi();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && ui.get().view === "robot") {
        leaveSensor();
        return;
      }
      if (e.key !== "r" && e.key !== "R") return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const target = e.target instanceof Element ? e.target : null;
      const allowed = target?.closest(
        '[data-testid="agent-toggle"], [data-testid="agent-exit"], [data-testid="compare-toggle"], .stage',
      );
      if (allowed) toggleSensor();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      clearTimers();
    };
  }, []);

  return (
    <>
      {children}
      {view === "robot" &&
        createPortal(
          <Suspense fallback={null}>
            <Sensor />
          </Suspense>,
          document.body,
        )}
      {createPortal(<ShutterBars />, document.body)}
    </>
  );
}

const MARK = `${import.meta.env.BASE_URL}testsprite-mark.svg`;

export function AgentToggle() {
  const { on } = useAgentView();
  const prefetch = useCallback(() => {
    void import("../retina/RetinaShell");
  }, []);
  return (
    <button
      type="button"
      className="agent-toggle"
      aria-pressed={on}
      aria-label={on ? "Human view" : "TestSprite view"}
      onClick={toggleSensor}
      onMouseEnter={prefetch}
      onFocus={prefetch}
      data-testid="agent-toggle"
      data-state={on ? "on" : "off"}
    >
      <span className="agent-toggle-ring" aria-hidden="true">
        <span className="sprite-mark" style={{ maskImage: `url(${MARK})`, WebkitMaskImage: `url(${MARK})` }} />
      </span>
      <span className="agent-toggle-text">
        {on ? (
          <>
            <span>Human</span> <span>view</span>
          </>
        ) : (
          <>
            <span className="agent-toggle-word" data-word="TestSprite" aria-hidden="true" />
            <span className="agent-toggle-word" data-word="vision" aria-hidden="true" />
            <span className="visually-hidden">TestSprite view</span>
          </>
        )}
      </span>
    </button>
  );
}
