import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useStillMotion } from "../core/motion";
import { ui, useUi } from "../core/store";

export default function RootHooks() {
  const { view, ready } = useUi();
  const still = useStillMotion();
  const { pathname } = useLocation();

  useEffect(() => {
    if (pathname !== "/" && ui.get().view === "human") ui.setReady(true);
  }, [pathname]);

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.view = view;
    root.dataset.ready = String(ready);
    root.dataset.motion = still ? "paused" : "on";
  }, [view, ready, still]);

  return null;
}
