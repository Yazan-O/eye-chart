# Eye Chart contract between lanes

The product: an eye exam for TestSprite's AI tester agent. A chart of real UI widgets ("letters"), each built as twins: one that works and one that is visibly broken to a human. TestSprite's agent is run against every twin. The site shows which letters it read correctly, and a "lens" (a small code change) for each letter it misread, measured again with the lens on.

## Ownership (one writer per path)
- Letters lane: `src/letters/**`, `calibration/**`, `public/readings/**`, `.github/workflows/calibration.yml`.
- Chart lane: everything else under `src/`, `index.html`, styles, 3D, routing shell.
- Ship lane: `README.md`, `docs/WRITEUP.md`, `docs/SUBMISSION_DRAFT.md`, `docs/VIDEO.md`.
- Shared, change only by agreement through the lead: `docs/CONTRACT.md`, `package.json`.

## Letter registry (`src/letters/registry.ts`, owned by the letters lane)
```ts
export type Variant = 'works' | 'broken' | 'lens' | 'lens-broken'
export interface Letter {
  id: string
  row: number
  glyph: string
  name: string
  trap: string
  howToUse: string
  brokenBehaviour: string
  lens?: { name: string; summary: string; diff: string }
  Component: React.ComponentType<{ variant: Variant }>
}
export const letters: Letter[]
```
- Row 1 is the easiest for an AI tester (plain buttons), higher rows are harder (motion, hover-only, shadow DOM, canvas, WebGL, real-time).
- Each twin is served at its own route: `#/l/<id>/works`, `#/l/<id>/broken`, `#/l/<id>/lens` (the working twin with the lens), `#/l/<id>/lens-broken` (the broken twin with the lens). A twin page renders the widget alone, full page, with no chart chrome, so the agent tests only the widget.

## Readings (`public/readings/latest.json` plus dated copies, owned by the letters lane)
```json
{
  "takenAt": "ISO-8601 UTC",
  "commit": "git sha the site served",
  "engine": "TestSprite cloud agent, CLI version",
  "projectId": "calibration project id",
  "results": [
    {
      "letterId": "canvas-slider",
      "variant": "works",
      "truth": "pass",
      "verdict": "passed | failed | blocked",
      "testId": "", "runId": "",
      "reason": "TestSprite's own stated reason, verbatim",
      "screenshot": "readings/shots/<runId>.png or null"
    }
  ]
}
```
- Every value comes from a real TestSprite run. No invented or sample verdicts anywhere, ever. A letter with no reading shows "not read yet".
- A reading is correct when (truth pass, verdict passed) or (truth fail, verdict failed). Blocked is always counted separately.
- With a lens on, the chart reads the letter from two twins: `lens` in place of `works`, and `lens-broken` in place of `broken`, each only when that reading exists. A lens fixes a letter when the letter reads correctly with it on.

## Credits
The account has 150 credits and no top-ups. A frontend test run costs 0.5. Budget: calibration at most 50 credits in total, product suite at most 85. Check `testsprite usage` before and after every batch and log the balance.

## Two TestSprite projects
- Product project: tests the chart site itself, generated in the 3.0 portal, wired to the GitHub App, blocks the merge, must be green.
- Calibration project: tests the twins, run by the CLI, never gates a merge.
