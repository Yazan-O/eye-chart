Eye Chart - 39 of 48 twin readings right by TestSprite's AI tester, 7 lenses measured, 5 fixed

Can you trust a red or blocked verdict from an AI tester? Eye Chart measures it. I built 24 real UI widgets, each twice: a working twin and a visibly broken twin, so the right answer is known before any test runs. TestSprite's cloud agent tested all 48 twins. It read 39 right, misread 4 and could not test 5. It ignored every planted "this form works" note, and it failed a working Save button because the notice fades after 1.5 seconds. For each miss there is a lens, a small code change, and the site shows the reading taken again with the lens on: 7 lenses measured, 5 fixed their letter, 2 did not. Every verdict and run id is in public/readings/latest.json.

The checks run themselves. The TestSprite gate runs on every PR (31 tests) and main requires it. The required verify check runs 109 Playwright tests and 109 unit tests. The CI also re-examines the five headline twins on PRs when credits allow, posting a table, so if TestSprite's agent changes, a later PR shows it. PR 1 went red three times (18, 20, 20 of 21) before it went green. In PR 8 a planted off-by-one bug was blocked by the required checks (2 Playwright tests caught it), then fixed and merged, while TestSprite's suite passed the buggy commit 31 of 31, which Eye Chart logs as a finding.

Live: https://yazan-o.github.io/eye-chart/
Code: https://github.com/Yazan-O/eye-chart
PR (TestSprite check): https://github.com/Yazan-O/eye-chart/pull/8
TestSprite report: https://www.testsprite.com/dashboard-v3/o/9db76168-3c40-5a47-9bb7-b3589a267ccc/projects/aca2323a-9450-40b3-ab92-6ad21f4d77ff/execution/c85b8a73-aa97-4470-84b3-053eb1d1a94a
Demo video: [X]
X post: [X]
TestSprite account: mohamad.yazan@ou.edu
Discord: yazan030803
