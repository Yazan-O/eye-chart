import type { Letter } from "./types";

type RegistryModule = { letters?: Letter[] };

const real = import.meta.glob<RegistryModule>("../letters/registry.ts", {
  eager: true,
});

export function registeredLetters(): Letter[] | null {
  const mod = Object.values(real)[0];
  if (mod?.letters) return mod.letters;
  if (import.meta.env.DEV && import.meta.env.VITE_STUB_LETTERS === "1") {
    return null;
  }
  return [];
}

export async function loadLetters(): Promise<Letter[]> {
  const listed = registeredLetters();
  if (listed) return listed;
  if (import.meta.env.DEV && import.meta.env.VITE_STUB_LETTERS === "1") {
    const stubs = import.meta.glob<RegistryModule>(
      "../letters-stub/registry.tsx",
    );
    const load = Object.values(stubs)[0];
    if (load) return (await load()).letters ?? [];
  }
  return [];
}

export function findLetter(letters: Letter[], id: string): Letter | null {
  return letters.find((l) => l.id === id) ?? null;
}
