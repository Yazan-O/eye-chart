import { useEffect, useState } from "react";
import { loadLetters, registeredLetters } from "./letters";
import { loadReadings } from "./readings";
import type { Letter, ReadingsFile } from "./types";

export function useLetters(): { letters: Letter[]; ready: boolean } {
  const [stubbed, setStubbed] = useState<Letter[] | null>(null);
  const initial = registeredLetters();
  const pending = initial === null;

  useEffect(() => {
    if (!pending) return;
    let live = true;
    loadLetters().then((list) => {
      if (live) setStubbed(list);
    });
    return () => {
      live = false;
    };
  }, [pending]);

  if (initial) return { letters: initial, ready: true };
  return { letters: stubbed ?? [], ready: stubbed !== null };
}

export function useReadings(): {
  file: ReadingsFile | null;
  ready: boolean;
} {
  const [state, setState] = useState<{
    file: ReadingsFile | null;
    ready: boolean;
  }>({ file: null, ready: false });

  useEffect(() => {
    let live = true;
    loadReadings().then((file) => {
      if (live) setState({ file, ready: true });
    });
    return () => {
      live = false;
    };
  }, []);

  return state;
}
