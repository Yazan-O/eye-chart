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
| TestSprite site suite | TestSprite cloud, on every PR preview | A real AI tester can use the site end to end: the chart loads, stations open, lenses turn, the sensor view opens and closes, routes recover. It checks that each journey works from the outside. |
| Playwright suite (`e2e/`) | The required `verify` check, Chromium against `vite preview` of the built site | The numbers on screen are the numbers in `public/readings/latest.json`. It asserts exact values, not presence. |

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
