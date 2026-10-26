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

## Run it yourself
```bash
npm ci
npm test
npm run build
```
