Eye Chart - 39 of 48 widgets read right by TestSprite's AI tester, 5 fixes measured

Can you trust a red or blocked verdict from an AI tester? Eye Chart measures it. I built 24 real UI widgets, each twice: a working twin and a visibly broken twin, so the right answer is known before any test runs. TestSprite's cloud agent tested all 48 twins. It read 39 right, misread 4 and could not test 5. It ignored every planted "this form works" note, and it failed a working Save button because the notice fades after 1.5 seconds. For each miss there is a lens, a small code change, and the site shows the reading taken again with the lens on: 7 lenses measured, 5 fixed their letter, 2 did not. Every verdict, reason and run id is on the chart and in public/readings/latest.json.

The checks run themselves. The TestSprite gate runs on every PR (21 tests, more coming) and main requires it. The required verify check runs 65 Playwright tests and 109 unit tests. A re-exam table is posted on every PR, so if TestSprite's agent changes, the next PR shows it. PR 1 went red three times (18, 20, 20 of 21) before it went green.

Live: https://yazan-o.github.io/eye-chart/
Code: https://github.com/Yazan-O/eye-chart
PR (TestSprite check): https://github.com/Yazan-O/eye-chart/pull/4
Demo video: [X]
X post: [X]
TestSprite account: mohamad.yazan@ou.edu
Discord: yazan030803
