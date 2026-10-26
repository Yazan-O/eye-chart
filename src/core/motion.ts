import { usePrefersReducedMotion } from "../hooks/usePrefersReducedMotion";
import { isStill, useUi } from "./store";

export function useStillMotion(): boolean {
  const reduced = usePrefersReducedMotion();
  const { paused } = useUi();
  return reduced || paused || isStill();
}
