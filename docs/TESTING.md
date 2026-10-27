# How Eye Chart is tested

Two TestSprite projects watch this repo. They answer different questions.

## 1. The site itself (blocks the merge)
- Project "Eye Chart site" in the TestSprite 3.0 portal, planned from `docs/PRD.md`.
- Every pull request deploys a preview to `https://yazan-o.github.io/eye-chart/pr-preview/pr-<number>/`.
- When the preview is up, the TestSprite GitHub App runs the suite against it and posts the result on the pull request.
- The merge gate is on: a failing test turns the check red and the pull request cannot merge.

## 2. The eye exam (never blocks)
- The calibration project runs TestSprite on the working and broken twin of every letter (`#/l/<id>/works`, `#/l/<id>/broken`, `#/l/<id>/lens`).
- Each verdict is compared with the truth we built into the twin. Right, misread and blocked are counted on the chart.
- `.github/workflows/calibration.yml` re-examines the headline twins on every preview. A misread here is a finding about the tester, not a bug in the site, so it never gates.

## Tests

| Suite | Runs where | What it proves |
|---|---|---|
| TestSprite site suite | TestSprite cloud, on every PR preview | A real AI tester can use the site end to end: the chart loads, stations open, lenses turn, the sensor view opens and closes, routes recover. 21 journey tests plus 10 tests that assert exact values the PRD guarantees (listed below). |
| Playwright suite (`e2e/`) | The required `verify` check, Chromium against `vite preview` of the built site | The numbers on screen are the numbers in `public/readings/latest.json`. It asserts exact values, not presence. |

The 10 exact-value tests in the TestSprite site suite (each passed once against the live site before joining the gate; all 31 site plans are exported to `calibration/site-suite/` by `calibration/export-site-suite.mjs`):
- the four tally counts add to 24, the About panel repeats them, and its totals line adds up and matches the twin summary;
- the reading summary's N equals the Read correctly tally;
- the toast dial reads "Misread", then "Misread → Read correctly" with "With 1 lens on.", then "Misread" again;
- the hover menu dial does the same from "Blocked", and the virtual list dial from "Misread";
- the autocomplete station shows the broken twin as "Should fail" and "Passed", and the letter as Misread;
- the toast station's Lens pane presses its button and reads "Fixed with lens.";
- the lens-broken twin route `#/l/virtual-list/lens-broken` renders the widget alone;
- the sensor view reports a part count above 0, and Escape removes the status line;
- an unknown route shows "Page not found", and "Back to the chart" returns to the chart with its tally.

### The PR 8 tally miss, and the rewritten test
In PR 8 a planted off-by-one made the tally skip the chart's first row: 16 of 23 instead of 17 of 24. Playwright caught it. TestSprite's tally test passed it. Its run steps show why: the agent opened the PR preview, then followed the plan's "Open the site's chart page (the base URL, hash #/)" to `https://yazan-o.github.io/eye-chart/#/`, the live site, and checked main's numbers instead (run 155916ca).

The test is now rewritten. It stays on the page it is given and compares exact numbers: tally 17, 4, 3, 0, sum 24, and "Read correctly: 17 of 24 letters". The planted commit's build is published at `https://yazan-o.github.io/eye-chart/pr-preview/replay-bug/`. The rewritten test was run once against each:

| Build | Verdict | TestSprite's reason | Run |
|---|---|---|---|
| main | passed | | 5b44d927-f0ee-4803-aa20-74140c09c6da |
| planted bug (4abcbcb) | failed | "Read correctly: 16; expected 17 ... a total of 23 instead of 24" | 6fc04668-6aaa-4db9-9063-bb846564d335 |

The Playwright suite checks:
- the four tally counts add up to 24 and equal the counts computed from the readings file, and the reading summary repeats the read count;
- every one of the 24 letter links shows the state the readings file gives it;
- each lens dial turns its letter to the lens reading and back, for every dial;
- the sensor view counts more than 0 parts, and both Escape and the toggle leave it;
- each of the 24 stations shows the truth, verdict and reason from the readings file for both twins;
- next walks all 24 stations in chart order and previous walks back;
- unknown routes show the not-found page and its link returns to the chart;
- at 375 px the chart and three stations have no horizontal scroll;
- with reduced motion the chart settles and then requests no animation frames;
- the answer key: for each of the 21 letters not drawn on a canvas, the test drives the working twin to its pass outcome and the broken twin to its fail outcome, so CI proves the truth TestSprite is scored against (for example, three clicks give "Count: 3" on the working counter and "Count: 6" on the broken one);
- the top bar links to the source on GitHub, the landing page says what TestSprite is, and a station screenshot opens larger and closes with Escape;
- each of the 48 twins renders alone, without the chart shell, and the counter twin counts three clicks right when it works and wrong when broken.

The oracle in `e2e/readings.ts` reads the readings file and applies the letter-state rule on its own, so a wrong count on the page fails the suite. CI uploads the HTML report as the `playwright-report` artifact.

## Run it yourself
```bash
npm ci
npm test
npm run build
npx playwright install chromium
npm run e2e
```
