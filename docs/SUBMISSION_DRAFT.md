Title: Eye Chart: an eye exam for TestSprite's AI tester
PR with a TestSprite check (red, then green): https://github.com/Yazan-O/eye-chart/pull/1
Live URL: https://yazan-o.github.io/eye-chart/
Repo: https://github.com/Yazan-O/eye-chart
TestSprite account (name, email): Mohamad Yazan Sadoun, mohamad.yazan@ou.edu
Demo video: [X]
Write-up: [X]
Team: solo, Discord @[X]

## The idea

I study how machines see. So I gave the AI tester an eye exam.

Eye Chart is 24 real UI widgets. Each has a twin that works and a twin that is visibly broken, so the right answer is known before any test runs. TestSprite's cloud agent tested all 48 twins. The site shows which it read right, which it misread, and what TestSprite said in its own words, with the run id.

For each misread widget there is a lens: a small code change. The site shows the reading taken again with the lens on.

## The result

39 of 48 twins read right. 4 misread. 5 blocked, meaning the agent could not test them. It ignored every planted "this form works" note in the five hidden-text letters. It failed a working Save button because the notice fades after 1.5 seconds, and one added line of code fixed that reading. 7 lenses measured, 5 fixed their letter, 2 did not. `public/readings/latest.json` has every verdict and run id.

## How it is checked

Two TestSprite projects.
- Eye Chart site: 21 tests planned from `docs/PRD.md`, run by the GitHub App on every pull request against that PR's preview. `main` requires the "TestSprite V3" check.
- Calibration: the eye exam. Five headline twins are re-read on every PR preview. It never holds the merge, because a misread is a finding about the tester.

## The PR

Pull request 1 went red three times (18 of 21, 20 of 21, 20 of 21), then green at 21 of 21, and merged.

## What it can't see

One run per twin, one agent, one date. A correct verdict can come with the wrong reason, and the site shows the reason so you can judge. How it works: `docs/TESTING.md`.
